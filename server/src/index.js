require('dotenv').config();
const express = require('express');
const https = require('https');
const { WebSocketServer } = require('ws');
const { createAISClient } = require('./aisClient');
const { getSchedules } = require('./maerskClient');

const app = express();
const PORT = process.env.PORT || 3001;

const MAERSK_BASE   = 'https://api.maersk.com';
const CONSUMER_KEY  = process.env.MAERSK_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MAERSK_CONSUMER_SECRET;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ─── OAuth Token Cache ────────────────────────────────────────────────────────
let _tokenCache = null; // { access_token, expires_at }

function oauthFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqOptions = {
      hostname: u.hostname,
      path:     u.pathname + u.search,
      method:   options.method || 'GET',
      headers:  options.headers || {},
    };
    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({
        ok:     res.statusCode >= 200 && res.statusCode < 300,
        status: res.statusCode,
        body:   data,   // <-- plain string, no .text()/.json() methods
      }));
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function getMaerskToken() {
  const now = Date.now();
  if (_tokenCache && _tokenCache.expires_at > now + 60_000) {
    return _tokenCache.access_token;
  }
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new Error('MAERSK_CONSUMER_KEY and MAERSK_CONSUMER_SECRET must both be set in .env');
  }
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     CONSUMER_KEY,
    client_secret: CONSUMER_SECRET,
  }).toString();

  console.log('[auth] Fetching OAuth token...');
  const res = await oauthFetch('https://api.maersk.com/customer-identity/oauth/v2/access_token', {
    method:  'POST',
    headers: {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
      'Consumer-Key':   CONSUMER_KEY,   // <-- required by Maersk
    },
    body,
  });

  console.log('[auth] OAuth response status:', res.status);
  console.log('[auth] OAuth response body:', res.body.substring(0, 300));

  if (!res.ok) {
    throw new Error(`OAuth failed (${res.status}): ${res.body}`);
  }
  const data = JSON.parse(res.body);
  _tokenCache = {
    access_token: data.access_token,
    expires_at:   now + (data.expires_in || 3600) * 1000,
  };
  console.log(`[auth] OAuth token obtained, expires in ${data.expires_in}s`);
  return _tokenCache.access_token;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// TEMP DEBUG — remove after fixing
app.get('/debug-oauth', async (req, res) => {
  const body = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     CONSUMER_KEY,
    client_secret: CONSUMER_SECRET,
  }).toString();

  const result = await oauthFetch('https://api.maersk.com/customer-identity/oauth/v2/access_token', {
    method: 'POST',
    headers: {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
      'Consumer-Key':   CONSUMER_KEY,
    },
    body,
  });

  res.json({
    status: result.status,
    body:   result.body,
    consumer_key_set: !!CONSUMER_KEY,
    consumer_secret_set: !!CONSUMER_SECRET,
    consumer_key_length: CONSUMER_KEY ? CONSUMER_KEY.length : 0,
  });
});

// Schedules endpoint
app.get('/schedules', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const data = await getSchedules(forceRefresh);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track & Trace endpoint — uses OAuth Bearer token
app.get('/track', async (req, res) => {
  const { carrierBookingReference, transportDocumentReference, equipmentReference } = req.query;

  if (!carrierBookingReference && !transportDocumentReference && !equipmentReference) {
    return res.status(400).json({ error: 'Provide at least one of: carrierBookingReference, transportDocumentReference, or equipmentReference' });
  }

  try {
    const token = await getMaerskToken();

    const params = new URLSearchParams();
    if (carrierBookingReference)    params.set('carrierBookingReference',    carrierBookingReference);
    if (transportDocumentReference) params.set('transportDocumentReference', transportDocumentReference);
    if (equipmentReference)         params.set('equipmentReference',         equipmentReference);
    params.set('limit', '100');
    params.set('sort', 'eventDateTime:ASC');

    const url = `${MAERSK_BASE}/track-and-trace-private/events?${params}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Consumer-Key':  CONSUMER_KEY,
        'Accept':        'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `Maersk API error: ${response.status}`, detail: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Server + WebSocket ───────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

const aisClient = createAISClient((msg) => broadcast(msg));
aisClient.connect();

// Pre-warm the schedule cache on startup
getSchedules().catch(err => console.error('[MAERSK] Startup prefetch failed:', err.message));