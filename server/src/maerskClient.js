require('dotenv').config();

const CONSUMER_KEY = process.env.MAERSK_CONSUMER_KEY;
const BASE = 'https://api.maersk.com/ocean/commercial-schedules/dcsa';

const PORTS = ['LKCMB']; // add LKHBA (Hambantota), LKTCO (Trincomalee) later

let cache = {
  data: null,
  lastFetched: null,
};

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function fetchPortSchedule(portCode) {
  const date = new Date().toISOString().split('T')[0];
  const url = `${BASE}/v1/port-schedules?UNLocationCode=${portCode}&date=${date}`;

  const res = await fetch(url, {
    headers: {
      'Consumer-Key': CONSUMER_KEY,
      'API-Version': '1',
    }
  });

  if (!res.ok) {
    throw new Error(`Maersk API error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

function parseSchedules(raw, portCode) {
  const vessels = [];

  for (const terminal of raw) {
    const terminalName = terminal.location?.locationName || portCode;
    const facilitySMDGCode = terminal.location?.facilitySMDGCode || '';

    for (const vs of (terminal.vesselSchedules || [])) {
      const vessel = vs.vessel || {};
      const service = vs.servicePartners?.[0] || {};
      const timestamps = vs.timestamps || [];
      const cutoffs = vs.cutOffTimes || [];

      const getTime = (typeCode, classifierCode) =>
        timestamps.find(t => t.eventTypeCode === typeCode && t.eventClassifierCode === classifierCode)?.eventDateTime || null;

      const getCutoff = (code) =>
        cutoffs.find(c => c.cutOffDateTimeCode === code)?.cutOffDateTime || null;

      vessels.push({
        // Vessel info
        imo: vessel.vesselIMONumber,
        name: vessel.name,
        flag: vessel.flag,
        callSign: vessel.callSign,
        operator: vessel.operatorCarrierCode,

        // Service info
        serviceName: service.carrierServiceName,
        serviceCode: service.carrierServiceCode,
        voyageNumber: service.carrierImportVoyageNumber,

        // Terminal
        terminal: terminalName,
        facilitySMDGCode,
        portCode,

        // Timestamps — EST = estimated, PLN = planned
        etaEstimated: getTime('ARRI', 'EST'),
        etaPlanned:   getTime('ARRI', 'PLN'),
        etdEstimated: getTime('DEPA', 'EST'),
        etdPlanned:   getTime('DEPA', 'PLN'),

        // Cut-off times (critical for freight forwarders)
        cutoffs: {
          OBC: getCutoff('OBC'), // On-board cut-off
          DCO: getCutoff('DCO'), // Documentation cut-off
          VCO: getCutoff('VCO'), // VGM cut-off
          FCO: getCutoff('FCO'), // Full container out
          ECP: getCutoff('ECP'), // Empty container pickup
        },

        isDummy: vs.isDummyVessel,
      });
    }
  }

  // Sort by estimated arrival
  return vessels.sort((a, b) => {
    const aTime = a.etaEstimated || a.etaPlanned || '';
    const bTime = b.etaEstimated || b.etaPlanned || '';
    return aTime.localeCompare(bTime);
  });
}

async function getSchedules(forceRefresh = false) {
  const now = Date.now();
  const cacheAge = cache.lastFetched ? now - cache.lastFetched : Infinity;

  if (!forceRefresh && cache.data && cacheAge < CACHE_TTL_MS) {
    console.log(`[MAERSK] Serving from cache (${Math.round(cacheAge / 60000)}m old)`);
    return { ...cache.data, fromCache: true, cacheAgeMs: cacheAge };
  }

  console.log('[MAERSK] Fetching fresh data...');

  try {
    const results = await Promise.all(PORTS.map(fetchPortSchedule));
    const vessels = results.flatMap((raw, i) => parseSchedules(raw, PORTS[i]));

    cache.data = {
      vessels,
      fetchedAt: new Date().toISOString(),
      ports: PORTS,
    };
    cache.lastFetched = now;

    console.log(`[MAERSK] Fetched ${vessels.length} vessel schedules`);
    return { ...cache.data, fromCache: false, cacheAgeMs: 0 };

  } catch (err) {
    console.error('[MAERSK] Fetch failed:', err.message);
    // Return stale cache if available rather than crashing
    if (cache.data) {
      console.log('[MAERSK] Returning stale cache due to error');
      return { ...cache.data, fromCache: true, stale: true, cacheAgeMs };
    }
    throw err;
  }
}

module.exports = { getSchedules };