require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const { createAISClient } = require('./aisClient');
const { getSchedules } = require('./maerskClient');

const app = express();
const PORT = process.env.PORT || 3001;

const MAERSK_BASE = 'https://api.maersk.com';
const CONSUMER_KEY = process.env.MAERSK_CONSUMER_KEY;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

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

// Track & Trace endpoint
app.get('/track', async (req, res) => {
  const { carrierBookingReference, transportDocumentReference, equipmentReference } = req.query;

  if (!carrierBookingReference && !transportDocumentReference && !equipmentReference) {
    return res.status(400).json({ error: 'Provide at least one of: carrierBookingReference, transportDocumentReference, or equipmentReference' });
  }

  try {
    const params = new URLSearchParams();
    if (carrierBookingReference) params.set('carrierBookingReference', carrierBookingReference);
    if (transportDocumentReference) params.set('transportDocumentReference', transportDocumentReference);
    if (equipmentReference) params.set('equipmentReference', equipmentReference);
    params.set('limit', '100');
    params.set('sort', 'eventDateTime:ASC');

    const url = `${MAERSK_BASE}/track-and-trace-private/v2/events?${params}`;
    const response = await fetch(url, {
      headers: {
        'Consumer-Key': CONSUMER_KEY,
        'Accept': 'application/json',
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

const server = app.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
});

// WebSocket for AIS
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