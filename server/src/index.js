require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { createAISClient } = require('./aisClient');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3001;

// Track all connected browser clients
const clients = new Set();

// Start AIS connection — broadcast every message to all browser clients
const aisClient = createAISClient((msg) => {
  const data = JSON.stringify(msg);
  clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
});

// When a browser connects to our server
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[SERVER] Client connected. Total: ${clients.size}`);

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[SERVER] Client disconnected. Total: ${clients.size}`);
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', clients: clients.size }));

server.listen(PORT, () => {
  console.log(`[SERVER] Running on http://localhost:${PORT}`);
  aisClient.connect();
});