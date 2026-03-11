# PortWatch

**Vessel Schedule Intelligence for Sri Lanka Ports**

A full-stack freight forwarder dashboard providing real-time vessel schedules, cut-off deadlines, and shipment tracking for the Port of Colombo and Hambantota. Built on the Maersk DCSA Commercial Schedules API and Track & Trace Private API.

---

## Features

- **Live Vessel Schedules** — Aggregates arrival/departure data across all major Colombo terminals (CWIT, SAGT, CICT, LKJCT) and Hambantota (CECT)
- **Cut-off Deadline Columns** — On-Board, Docs, VGM, FCO, and Empty cut-offs displayed per vessel with colour-coded urgency (amber ≤48h, pulsing red ≤12h, strikethrough if past)
- **Multi-carrier Support** — Maersk, Hapag-Lloyd, CMA CGM, and regional feeders
- **Shipment Track & Trace** — Search by Booking Reference, Bill of Lading, or Container Number via the Maersk Track & Trace Private API; displays a full event timeline with actual/estimated status
- **My Shipments** — Save and quickly reload frequently tracked references (persisted in localStorage)
- **Responsive Mobile Layout** — Dedicated mobile UI with card-based vessel list, collapsible cut-offs, and bottom tab navigation
- **1-hour Schedule Cache** — Server-side caching reduces API calls and improves load time
- **Real-time UTC Clock** — Header displays live UTC time for cut-off reference

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Zustand |
| Backend | Node.js, Express |
| Styling | CSS custom properties, IBM Plex Mono / IBM Plex Sans |
| Schedule API | Maersk DCSA Commercial Schedules API |
| Track API | Maersk Track & Trace Private API (OAuth 2.0) |
| Deployment | Vercel (frontend) + Railway (backend) |

---

## Project Structure

```
portwatch/
├── client/                         # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Schedule/           # Desktop schedule table
│   │   │   │   ├── ScheduleTable.jsx
│   │   │   │   ├── VesselRow.jsx
│   │   │   │   └── CutoffBadge.jsx
│   │   │   ├── Track/              # Track & Trace panel
│   │   │   │   ├── TrackPanel.jsx
│   │   │   │   ├── TrackSearch.jsx
│   │   │   │   └── EventTimeline.jsx
│   │   │   ├── Mobile/             # Mobile-specific layout
│   │   │   │   ├── MobileLayout.jsx
│   │   │   │   ├── MobileHeader.jsx
│   │   │   │   ├── MobileSchedules.jsx
│   │   │   │   └── MobileTrack.jsx
│   │   │   ├── Header.jsx
│   │   │   └── Filters.jsx
│   │   ├── store/
│   │   │   ├── scheduleStore.js    # Zustand store — schedules
│   │   │   └── trackStore.js      # Zustand store — track & trace
│   │   ├── hooks/
│   │   │   └── useIsMobile.js
│   │   ├── utils/
│   │   │   └── formatters.js
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── App.jsx
│   └── index.html
│
└── server/                         # Node.js backend
    ├── src/
    │   ├── index.js                # Express server, routes, OAuth
    │   ├── maerskClient.js         # Schedule API client + cache
    │   └── aisClient.js            # AIS WebSocket client
    └── .env                        # Environment variables (not committed)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Maersk Developer](https://developer.maersk.com) account with the following APIs subscribed:
  - **Ocean - Commercial Schedules (DCSA)**
  - **Track & Trace Private**

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/portwatch.git
cd portwatch
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:

```env
MAERSK_CONSUMER_KEY=your_consumer_key_here
MAERSK_CONSUMER_SECRET=your_consumer_secret_here
PORT=3001
```

Your Consumer Key and Secret are found at **developer.maersk.com → My Apps → your app**.

### 3. Start the backend

```bash
node src/index.js
# [SERVER] Running on http://localhost:3001
```

### 4. Configure the frontend

```bash
cd ../client
npm install
```

Create a `.env` file in the `client/` directory:

```env
VITE_API_URL=http://localhost:3001
```

### 5. Start the frontend

```bash
npm run dev
# → Local: http://localhost:5173
```

---

## API Authentication

### Schedules API
Uses a simple `Consumer-Key` header — no OAuth required.

### Track & Trace Private API
Uses **OAuth 2.0 client credentials** flow. The server automatically fetches and caches a Bearer token (valid for 2 hours) before each track request:

```
POST https://api.maersk.com/customer-identity/oauth/v2/access_token
  grant_type=client_credentials
  client_id=<CONSUMER_KEY>
  client_secret=<CONSUMER_SECRET>
```

The token is cached in memory and refreshed automatically before expiry. Both the `Authorization: Bearer <token>` and `Consumer-Key` headers are required by the Track & Trace gateway.

---

## Deployment

### Backend — Railway

1. Create a new Railway project, connect your GitHub repo
2. Set **Root Directory** to `server`
3. Set the start command to `node src/index.js`
4. Add environment variables:
   - `MAERSK_CONSUMER_KEY`
   - `MAERSK_CONSUMER_SECRET`

### Frontend — Vercel

1. Import the repo into Vercel
2. Set **Root Directory** to `client`
3. Framework preset: **Vite**
4. Add environment variable:
   - `VITE_API_URL=https://your-railway-backend.up.railway.app`

---

## Terminals in Scope

| Code | Terminal | Port |
|---|---|---|
| CWIT | Colombo West International Terminal | Colombo |
| SAGT | South Asia Gateway Terminals | Colombo |
| CICT | Colombo International Container Terminals | Colombo |
| LKJCT | Jaye Container Terminal | Colombo |
| CECT | China Merchants Colombo East Container Terminal | Hambantota |

---

## Environment Variables Reference

| Variable | Location | Description |
|---|---|---|
| `MAERSK_CONSUMER_KEY` | `server/.env` | Maersk API consumer key |
| `MAERSK_CONSUMER_SECRET` | `server/.env` | Maersk API consumer secret (for OAuth) |
| `PORT` | `server/.env` | Server port (default: 3001) |
| `VITE_API_URL` | `client/.env` | Backend API base URL |

---

## Roadmap

- [ ] ONE (Ocean Network Express) carrier integration
- [ ] Push notifications for critical cut-off deadlines
- [ ] Email/WhatsApp cut-off alerts
- [ ] Historical schedule data and ETD accuracy tracking
- [ ] Multi-port support (Galle, Trincomalee)

---

## License

MIT

---

*Built for freight forwarders operating at the Port of Colombo, Sri Lanka.*
