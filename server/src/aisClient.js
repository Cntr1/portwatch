const WebSocket = require('ws');

const AIS_URL = 'wss://stream.aisstream.io/v0/stream';

// Sri Lanka bounding box
const SRI_LANKA_BBOX = [[[5.5, 78.5], [10.5, 83.0]]];

function createAISClient(onMessage) {
  let ws = null;
  let reconnectTimer = null;

  function connect() {
    console.log('[AIS] Connecting to aisstream.io...');
    ws = new WebSocket(AIS_URL);

    ws.on('open', () => {
      console.log('[AIS] Connected. Subscribing to Sri Lanka region...');
      ws.send(JSON.stringify({
        APIKey: process.env.AIS_API_KEY,
        BoundingBoxes: SRI_LANKA_BBOX,
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      }));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        onMessage(msg);
      } catch (e) {
        console.error('[AIS] Failed to parse message:', e.message);
      }
    });

    ws.on('close', (code) => {
      console.log(`[AIS] Connection closed (code ${code}). Reconnecting in 5s...`);
      reconnectTimer = setTimeout(connect, 5000);
    });

    ws.on('error', (err) => {
      console.error('[AIS] WebSocket error:', err.message);
      ws.close();
    });
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }

  return { connect, disconnect };
}

module.exports = { createAISClient };