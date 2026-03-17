<div align="center">

# 🛰️ lms-controller

**Real-time satellite tracking control system with 3D visualization**

[![Live Demo](https://img.shields.io/badge/demo-lmsproject.space-00dc82?style=for-the-badge&logo=vercel&logoColor=white)](https://lmsproject.space)

[![Bun](https://img.shields.io/badge/runtime-Bun_1.3-f9f1e1?style=flat-square&logo=bun)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/frontend-Next.js_16-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/3D-Three.js-000?style=flat-square&logo=three.js)](https://threejs.org)
[![InfluxDB](https://img.shields.io/badge/TSDB-InfluxDB_2-22ADF6?style=flat-square&logo=influxdb&logoColor=white)](https://influxdata.com)
[![Docker](https://img.shields.io/badge/deploy-Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/license-BSL_1.1-blue?style=flat-square)](LICENSE)

Backend, frontend and infrastructure for the [LMS](https://github.com/Didi0dum/LMS) mini SLR station.
Single `docker compose up` deployment. See also [lms-hardware](https://github.com/rangelovkiril/lms-hardware) for the Raspberry Pi station software.

</div>

---

## Features

**Real-time 3D tracking** — WebGL scene with live position updates at up to 10 Hz, speed-colored trajectory trace and satellite model

**MQTT telemetry pipeline** — Station → Mosquitto → Backend → InfluxDB + WebSocket → Browser, with polar→cartesian coordinate conversion

**Multi-organization** — Independent user accounts, invite-code groups, role-based access (owner / admin / member), station isolation per org

**Observation sets** — Import, overlay and compare multiple tracking sessions as colored traces in the same 3D scene

**One-command deploy** — Docker Compose with InfluxDB, Mosquitto, Bun backend and Next.js frontend

## Architecture

```               
┌─────────────┐      MQTT pub      ┌────────────┐
│  Raspberry  │ ────────────────>  │  Mosquitto │
│  Pi Station │ <────────────────  │   Broker   │
└─────────────┘      MQTT cmd      └──────┬─────┘
                                          │ subscribe
                                    ┌─────▼──────┐
                                    │            │
┌──────────────┐  REST + WebSocket  │   Elysia   │
│   Browser    │ ←────────────────→ │  Backend   │
│  (Next.js)   │                    │            │
└──────────────┘                    └──┬──────┬──┘
                                       │      │
                                ┌──────▼┐  ┌──▼───────┐
                                │InfluxDB│  │  SQLite  │
                                │ (TSDB) │  │  (Auth)  │
                                └────────┘  └──────────┘
```

**Data flow:** Station publishes to MQTT → Backend subscribes, converts polar→cartesian, writes to InfluxDB and broadcasts via WebSocket → Browser renders in Three.js. Commands flow in reverse.

## Quick Start

### Prerequisites

- Docker + Docker Compose
- Git

### 1. Clone and configure

```bash
git clone https://github.com/rangelovkiril/lms-controller.git
cd lms-controller
cp .env.example .env
```

Edit `.env` and replace the placeholder values with secure random strings. You can use `openssl rand -hex 32` to generate them.

<details>
<summary><b>Environment variables reference</b></summary>

| Variable | Description |
|:--|:--|
| `INFLUX_TOKEN` | InfluxDB admin token |
| `JWT_SECRET` | JWT signing key |
| `INTERNAL_KEY` | Server-to-server auth (Next.js SSR → Backend) |
| `INFLUX_ADMIN_PASSWORD` | InfluxDB web UI password |
| `FRONTEND_PORT` | Host port for the web UI (default: `4001`) |
| `BACKEND_PORT` | Host port for the API (default: `4000`) |

</details>

### 2. Start

```bash
docker compose up -d
```

First build takes 2–3 minutes. After that, open `http://localhost:4001`.

### 3. Initial setup

1. **Register** an account
2. **Create an organization** (or join one with an invite code)
3. **Add a station** — save the write-only token shown after creation
4. **Configure the Raspberry Pi** with the token, MQTT broker address and station ID
5. Start the hardware client — data appears in the 3D view

## Development

```bash
# Start only infrastructure
docker compose up -d influxdb mqtt

# Backend (port 3000, auto-restarts on changes)
cd backend && bun install && bun run dev

# Frontend (port 3000, Next.js HMR)
cd frontend && bun install && bun run dev

# Tests
cd backend && bun test
```

<details>
<summary><b>MQTT topics</b></summary>

| Topic | Direction | Payload |
|:--|:--|:--|
| `slr/<id>/status` | Station → Backend | `{ "event": "online" \| "offline" \| "tracking_start" \| ... }` |
| `slr/<id>/tracking/<obj>/pos` | Station → Backend | `{ "az", "el", "dist", "influx_token" }` |
| `slr/<id>/env` | Station → Backend | `{ "temp", "humidity", "pressure", "wind" }` |
| `slr/<id>/log/<LEVEL>` | Station → Backend | Plain text message |
| `slr/<id>/cmd` | Backend → Station | `{ "action": "track" \| "stop" }` |

</details>

<details>
<summary><b>Auth model</b></summary>

- **Users** are independent — register with email + password
- **Organizations** are groups with 8-character invite codes
- A user can be in multiple organizations (owner / admin / member)
- Stations belong to an organization, scoped via `X-Org-Id` header
- JWT (HS256) in `Authorization: Bearer` header
- `X-Internal-Key` for server-to-server calls (Next.js SSR → Backend)

</details>

## Project Structure

```
lms-controller/
├── backend/
│   ├── src/
│   │   ├── index.ts                 # All routes
│   │   ├── db.ts                    # SQLite schema
│   │   ├── plugins/                 # auth, influx, jwt, mqtt, websocket
│   │   ├── handlers/                # MQTT → InfluxDB + WebSocket
│   │   └── services/                # auth, station, telemetry, observations
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/[locale]/            # Pages (login, register, orgs, stations, ...)
│   │   ├── components/              # visualization/, data-management/, layout/, ui/
│   │   ├── contexts/                # auth, station, observation sets
│   │   ├── hooks/                   # useTracking, useWebSocket, useExport, ...
│   │   └── lib/                     # API wrapper, stations, tracking
│   ├── messages/                    # i18n (en.json, bg.json)
│   └── Dockerfile
├── broker/config/mosquitto.conf
├── docker-compose.yaml
└── .env.example
```

## Roadmap

The current Bun + Elysia backend is a working proof of concept. The long-term plan is to rewrite the backend on the **BEAM VM**:

- 🔜 **Elixir/OTP** backend — leveraging lightweight processes, fault tolerance and built-in distribution for handling hundreds of concurrent station connections
- 🔜 **EMQX** replacing Mosquitto — clustered MQTT broker with native Elixir integration, rule engine and better scalability
- 🔜 **LiveView** or Phoenix Channels for real-time UI updates without a separate WebSocket layer

The frontend (Next.js + Three.js) and the InfluxDB time-series storage will remain as-is.

## License
GPL v3 — see [LICENSE](LICENSE) for details.
