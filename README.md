# 🛰️ lms-controller

**Real-time satellite tracking control system with 3D visualization**

[![Live Demo](https://img.shields.io/badge/demo-lmsproject.space-00dc82?style=for-the-badge&logo=vercel&logoColor=white)](https://lmsproject.space)

[![Bun](https://img.shields.io/badge/runtime-Bun_1.3-f9f1e1?style=flat-square&logo=bun)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/frontend-Next.js_16-000?style=flat-square&logo=next.js)](https://nextjs.org)
[![Three.js](https://img.shields.io/badge/3D-Three.js-000?style=flat-square&logo=three.js)](https://threejs.org)
[![InfluxDB](https://img.shields.io/badge/TSDB-InfluxDB_2-22ADF6?style=flat-square&logo=influxdb&logoColor=white)](https://influxdata.com)
[![Docker](https://img.shields.io/badge/deploy-Docker_Compose-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License](https://img.shields.io/badge/license-GPL_v3-blue?style=flat-square)](LICENSE)

Backend, frontend and infrastructure for the [LMS](https://github.com/Didi0dum/LMS) mini SLR station.
Raspberry Pi station software: [lms-hardware](https://github.com/rangelovkiril/lms-hardware).

---

## Features

**Real-time 3D tracking:** WebGL scene, position updates up to 10 Hz, speed-colored trajectory trace and satellite model

**MQTT telemetry pipeline:** Station → Mosquitto → Backend → InfluxDB + WebSocket → Browser

**Multi-organization:** independent user accounts, invite-code groups, roles (owner / admin / member), station isolation per org

**Observation sets:** import, overlay and compare tracking sessions as colored traces in one 3D scene

**One-command deploy:** Docker Compose with InfluxDB, Mosquitto, Bun backend and Next.js frontend behind Caddy

## Architecture

```
                  ┌────────────────────────────────────────────────┐
                  │  Caddy (reverse proxy, TLS)                    │
                  │  :80/:443 → /api, /ws → :4000  else → :4001    │
                  └────────────┬─────────────────────┬─────────────┘
                               │                     │
┌─────────────┐         ┌──────▼──────┐       ┌──────▼──────┐
│  Raspberry  │  MQTT   │   Backend   │       │  Frontend   │
│  Pi Station │ ──────> │   (Elysia)  │       │  (Next.js)  │
└─────────────┘         │   :4000     │       │   :4001     │
                        └──┬──────┬───┘       └─────────────┘
                           │      │
                     ┌─────▼┐  ┌──▼──────┐
                     │Influx│  │  SQLite  │
                     │  DB  │  │  (Auth)  │
                     └──────┘  └──────────┘
```

**Data flow:** the backend converts polar→cartesian on ingest, writes to InfluxDB and pushes over WebSocket; the browser renders in Three.js. Commands flow in reverse.

## Quick Start

### Prerequisites

- Docker + Docker Compose
- [Caddy](https://caddyserver.com/docs/install) (on the host, not in Docker)
- Git

### 1. Clone and configure

```bash
git clone https://github.com/rangelovkiril/lms-controller.git
cd lms-controller
cp .env.example .env
```

Secrets for `.env`:

```bash
INFLUX_TOKEN=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
INTERNAL_KEY=$(openssl rand -hex 32)
INFLUX_ADMIN_PASSWORD=$(openssl rand -hex 16)

cat > .env << EOF
INFLUX_TOKEN=$INFLUX_TOKEN
INFLUX_ADMIN_PASSWORD=$INFLUX_ADMIN_PASSWORD
JWT_SECRET=$JWT_SECRET
INTERNAL_KEY=$INTERNAL_KEY
EOF
```

### 2. Start Docker services

```bash
docker compose up -d
```

First build takes 2-3 minutes. Service health:

```bash
docker compose ps
```

### 3. Start Caddy

**Local development:**

```bash
caddy run --config caddy/Caddyfile
```

Serves on `http://localhost`.

**Production (VPS):**

In `caddy/Caddyfile`, comment out the `:80` block and uncomment the production block:

```
lmsproject.space {
    handle /api/* {
        reverse_proxy localhost:4000
    }

    handle /ws {
        reverse_proxy localhost:4000
    }

    handle {
        reverse_proxy localhost:4001
    }
}
```

As a systemd service:

```bash
sudo cp caddy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

Caddy handles TLS via Let's Encrypt automatically.

### 4. Initial setup

1. Account registration at `http://localhost` or the deployed domain
2. Organization creation, or joining with an invite code
3. Station creation, returning a write-only token to save
4. Raspberry Pi configuration with the token, broker address and station ID
5. Hardware client start; data appears in the 3D view

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

Without Docker, the frontend needs `BACKEND_URL=http://localhost:3000` and Caddy the matching ports.

<details>
<summary><b>Environment variables reference</b></summary>

| Variable | Description |
|:--|:--|
| `INFLUX_TOKEN` | InfluxDB admin API token |
| `INFLUX_ADMIN_PASSWORD` | InfluxDB web UI password (min 8 chars) |
| `JWT_SECRET` | JWT signing key for user auth |
| `INTERNAL_KEY` | Server-to-server auth (Next.js SSR → Backend) |

</details>

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

- **Users**: independent accounts, email + password
- **Organizations**: groups with 8-character invite codes
- A user can belong to multiple organizations
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
├── caddy/Caddyfile                  # Reverse proxy config (local + production)
├── docker-compose.yaml
└── .env.example
```

## Roadmap

The Bun + Elysia backend is a proof of concept. Long-term plan: rewrite on the **BEAM VM**.

- **Elixir/OTP**: lightweight processes, fault tolerance and distribution for hundreds of concurrent station connections
- **EMQX** instead of Mosquitto: clustered broker, native Elixir integration, rule engine
- **LiveView** or Phoenix Channels for real-time UI without a separate WebSocket layer

Frontend (Next.js + Three.js) and InfluxDB storage stay as-is.

## License

GPL v3, see [LICENSE](LICENSE).
