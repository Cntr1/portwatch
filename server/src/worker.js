const BASE = 'https://api.maersk.com/ocean/commercial-schedules/dcsa';
const PORTS = ['LKCMB'];
const SCHEDULE_CACHE_KEY = 'schedules_cmb';
const SCHEDULE_TTL = 3600; // 1 hour

// ── OAuth (for Track & Trace only) ──────────────────────────────────────────
const OAUTH_URL = 'https://api.maersk.com/customer-identity/oauth/v2/access_token';
const TOKEN_CACHE_KEY = 'oauth_token';
const TOKEN_BUFFER = 60;

async function getOAuthToken(env) {
  const cached = await env.CACHE.get(TOKEN_CACHE_KEY, 'json');
  if (cached && cached.expires_at > Date.now() / 1000 + TOKEN_BUFFER) {
    return cached.access_token;
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.MAERSK_CONSUMER_KEY,
    client_secret: env.MAERSK_CONSUMER_SECRET,
  });

  const res = await fetch(OAUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Consumer-Key': env.MAERSK_CONSUMER_KEY,
    },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`OAuth failed: ${res.status}`);
  const data = await res.json();

  await env.CACHE.put(TOKEN_CACHE_KEY, JSON.stringify({
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
  }), { expirationTtl: data.expires_in - TOKEN_BUFFER });

  return data.access_token;
}

// ── Schedules (Consumer-Key only, no OAuth) ──────────────────────────────────
async function fetchPortSchedule(portCode, env) {
  const date = new Date().toISOString().split('T')[0];
  const url = `${BASE}/v1/port-schedules?UNLocationCode=${portCode}&date=${date}`;

  const res = await fetch(url, {
    headers: {
      'Consumer-Key': env.MAERSK_CONSUMER_KEY,
      'API-Version': '1',
    },
  });

  if (!res.ok) throw new Error(`Maersk API error: ${res.status} ${await res.text()}`);
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
        imo: vessel.vesselIMONumber,
        name: vessel.name,
        flag: vessel.flag,
        callSign: vessel.callSign,
        operator: vessel.operatorCarrierCode,
        serviceName: service.carrierServiceName,
        serviceCode: service.carrierServiceCode,
        voyageNumber: service.carrierImportVoyageNumber,
        terminal: terminalName,
        facilitySMDGCode,
        portCode,
        etaEstimated: getTime('ARRI', 'EST'),
        etaPlanned:   getTime('ARRI', 'PLN'),
        etdEstimated: getTime('DEPA', 'EST'),
        etdPlanned:   getTime('DEPA', 'PLN'),
        cutoffs: {
          OBC: getCutoff('OBC'),
          DCO: getCutoff('DCO'),
          VCO: getCutoff('VCO'),
          FCO: getCutoff('FCO'),
          ECP: getCutoff('ECP'),
        },
        isDummy: vs.isDummyVessel,
      });
    }
  }

  return vessels.sort((a, b) => {
    const aTime = a.etaEstimated || a.etaPlanned || '';
    const bTime = b.etaEstimated || b.etaPlanned || '';
    return aTime.localeCompare(bTime);
  });
}

async function getSchedules(env) {
  // Check KV cache
  const cached = await env.CACHE.get(SCHEDULE_CACHE_KEY, 'json');
  if (cached) return { ...cached, fromCache: true };

  // Fetch fresh
  const results = await Promise.all(PORTS.map(p => fetchPortSchedule(p, env)));
  const vessels = results.flatMap((raw, i) => parseSchedules(raw, PORTS[i]));

  const data = {
    vessels,
    fetchedAt: new Date().toISOString(),
    ports: PORTS,
  };

  await env.CACHE.put(SCHEDULE_CACHE_KEY, JSON.stringify(data), {
    expirationTtl: SCHEDULE_TTL,
  });

  return { ...data, fromCache: false };
}

// ── Track & Trace (OAuth required) ──────────────────────────────────────────
async function fetchTrackEvents(env, queryType, queryValue) {
  const token = await getOAuthToken(env);
  const params = new URLSearchParams({ [queryType]: queryValue });

  const res = await fetch(
    `https://api.maersk.com/track-and-trace-private/events?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Consumer-Key': env.MAERSK_CONSUMER_KEY,
      },
    }
  );

  if (!res.ok) throw new Error(`Track fetch failed: ${res.status} — ${await res.text()}`);
  return res.json();
}

// ── CORS helper ──────────────────────────────────────────────────────────────
function cors(response) {
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(response.body, { status: response.status, headers });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── Router ───────────────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    try {
      if (url.pathname === '/schedules' && request.method === 'GET') {
        const data = await getSchedules(env);
        return cors(json(data));
      }

      if (url.pathname === '/track' && request.method === 'GET') {
        const queryType = url.searchParams.get('queryType');
        const queryValue = url.searchParams.get('queryValue');
        if (!queryType || !queryValue) {
          return cors(json({ error: 'Missing queryType or queryValue' }, 400));
        }
        const data = await fetchTrackEvents(env, queryType, queryValue);
        return cors(json(data));
      }

      return cors(json({ error: 'Not found' }, 404));

    } catch (err) {
      return cors(json({ error: err.message }, 500));
    }
  },
};