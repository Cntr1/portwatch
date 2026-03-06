require('dotenv').config();

const CONSUMER_KEY = process.env.MAERSK_CONSUMER_KEY;
const BASE = 'https://api.maersk.com/ocean/commercial-schedules/dcsa';

async function testPortSchedule() {
  console.log('\n--- Port Schedule: Colombo next 4 weeks ---');
  
  const today = new Date().toISOString().split('T')[0];
  const url = `${BASE}/v1/port-schedules?UNLocationCode=LKCMB&date=${today}`;
  console.log('Calling:', url);
  
  const res = await fetch(url, {
    headers: {
      'Consumer-Key': CONSUMER_KEY,
      'API-Version': '1',
    }
  });

  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text.slice(0, 3000));
}

async function main() {
  console.log('KEY starts with:', CONSUMER_KEY?.slice(0, 6));
  await testPortSchedule();
}

main().catch(console.error);