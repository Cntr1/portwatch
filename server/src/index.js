require('dotenv').config();
const express = require('express');
const { WebSocketServer } = require('ws');
const { createAISClient } = require('./aisClient');
const { getSchedules } = require('./maerskClient');

const app = express();
const PORT = process.env.PORT || 3001;

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