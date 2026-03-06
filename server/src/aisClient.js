const WebSocket = require('ws');

const AIS_URL = 'wss://stream.aisstream.io/v0/stream';

// Track these specific vessels globally by MMSI
const WATCHED_MMSI = [
  '413060000',  // IMO 9270440
  '636016619',  // IMO 9678630
  '563131500',  // IMO 9706748
];

function createAISClient(onMessage) {
  let ws = null;
  let reconnectTimer = null;

  function connect() {
    console.log('[AIS] Connecting to aisstream.io...');
    ws = new WebSocket(AIS_URL);

    ws.on('open', () => {
      console.log('[AIS] Connected. Subscribing to watchlist...');

      const subscription = {
        APIKey: process.env.AIS_API_KEY,
        BoundingBoxes: [[[-90, -180], [90, 180]]], // whole world
        FiltersShipMMSI: WATCHED_MMSI,
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      };

      console.log('[AIS] Watching MMSIs:', WATCHED_MMSI.join(', '));
      ws.send(JSON.stringify(subscription));
    });

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        const name = msg.MetaData?.ShipName?.trim() || 'Unknown';
        const mmsi = msg.MetaData?.MMSI;
        const lat  = msg.MetaData?.latitude?.toFixed(4);
        const lng  = msg.MetaData?.longitude?.toFixed(4);
        console.log(`[AIS] ${name} (${mmsi}) — ${lat}, ${lng}`);
        onMessage(msg);
      } catch (e) {
        console.error('[AIS] Parse error:', e.message);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[AIS] Closed — code: ${code}, reason: "${reason.toString()}"`);
      reconnectTimer = setTimeout(connect, 5000);
    });

    ws.on('error', (err) => {
      console.error('[AIS] Error:', err.message);
    });
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }

  return { connect, disconnect };
}

module.exports = { createAISClient };