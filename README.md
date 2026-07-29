# WASTEWISE — Autonomous Municipal Waste Route & Citizen Campaign

**Problem Statement Code:** SDGGAIP028  
**SDG Alignment:** SDG 11 (Sustainable Cities and Communities) & SDG 12 (Responsible Consumption and Production)

---

## 🌟 Overview

**WasteWise** is an autonomous, multi-agent municipal waste management platform designed for smart cities. Built for full software-only execution, WasteWise integrates computer vision bin density analytics, vehicle routing optimization (VRP), dynamic traffic and road closure rerouting, neighborhood recycling analytics, and automated bilingual (English & Tamil) civic campaign generation.

This prototype operates without physical hardware dependencies, simulating IoT camera streams, municipal truck fleets, road closures, and garbage accumulation in software across 6 zones in Coimbatore (Gandhipuram, RS Puram, Peelamedu, Saibaba Colony, Singanallur, Ukkadam).

---

## 🤖 Specialist Agents & Architecture

WasteWise features **four specialist AI agents** orchestrated in a stateful LlamaIndex-style workflow engine:

1. **Agent 1: Bin Density Analysis Agent**
   - Processes simulated camera/IoT sensor inputs or uploaded image descriptions.
   - Calculates fill percentage, classifies status (`EMPTY`, `NORMAL`, `MEDIUM`, `HIGH`, `CRITICAL`), assigns priority, and computes overflow risk.

2. **Agent 2: Logistics & Routing Agent**
   - Considers truck capacity, current load, real-time traffic congestion, and active road closures.
   - Invokes a capacity-constrained Vehicle Routing Problem (VRP) solver.
   - Generates proposed routes with operational reasoning for human dispatcher review.

3. **Agent 3: Recycling Analytics Agent**
   - Analyzes historical waste stream records by neighborhood.
   - Calculates landfill diversion rates, recycling rates, and waste breakdowns (plastic, organic, paper, glass, mixed).
   - Identifies high-risk zones (e.g. RS Puram 64% plastic contamination).

4. **Agent 4: Civic Campaign Agent**
   - Takes neighborhood analytics recommendations and leverages Gemini AI to generate hyper-local recycling education campaigns.
   - Produces side-by-side English and Tamil (தமிழ்) poster headlines, social media posts, citizen action items, and expected impact metrics.

---

## 🗺️ Interactive GIS Map & Control Center

- **GIS Leaflet Map**: Interactive map displaying 50 municipal bins color-coded by fill status, 10 garbage trucks, active route polylines, and road closures.
- **Human-In-The-Loop Dispatch**: AI generated routes require dispatcher approval, modification (bin order/truck reassignment), or re-optimization before execution.
- **Live Agent Observability**: Operational reasoning feeds, latency metrics, and tool execution logs.
- **1-Click Demo Mode Walkthrough**: Automatically demonstrates critical bin overflow, agent detection, route generation, dispatcher approval, route execution, and campaign publishing in 6 scannable steps.

---

## 💻 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Leaflet GIS, Recharts, Lucide Icons, Motion
- **Backend**: Node.js, Express REST API, Full-stack dev server
- **AI Engine**: `@google/genai` (Gemini 2.5 Flash) with fallback template engines
- **Optimization**: Capacity-constrained VRP solver (Nearest Neighbor + Priority scoring + Traffic weights)
- **Database**: Persistent JSON/File-backed database store (`data/store.json`) with seed data

---

## 🔌 API Endpoints

- `GET /api/bins` - Retrieve 50 municipal bins
- `POST /api/bins/simulate` - Simulate fill changes or overflow
- `POST /api/bins/scan` - Process simulated computer vision scan
- `GET /api/trucks` - Retrieve truck fleet status
- `GET /api/routes` - Retrieve active collection routes
- `POST /api/routes/optimize` - Trigger multi-agent VRP route solver
- `POST /api/routes/:id/approve` - Dispatcher approve AI route
- `POST /api/routes/:id/reject` - Dispatcher reject route
- `POST /api/routes/:id/modify` - Dispatcher modify bin sequence or truck
- `POST /api/routes/:id/reoptimize` - Re-evaluate route for new traffic/closures
- `GET /api/analytics` - System metrics & neighborhood diversion summaries
- `GET /api/campaigns` - Campaign list
- `POST /api/campaigns/generate` - Generate bilingual English & Tamil campaign
- `GET /api/agents/status` & `GET /api/agents/events` - Agent status & reasoning logs
- `POST /api/simulation/demo-step` - Execute 1-click automated demo walkthrough

---

## 🚀 Running the Platform

1. **Development Mode**:
   ```bash
   npm run dev
   ```
2. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 🔮 Future Hardware Ready

While this version runs entirely in software, the REST APIs (`POST /api/bins/scan`, `POST /api/bins/simulate`) are designed to accept JSON payloads directly from real IoT ultrasonic sensors or edge cameras (Raspberry Pi / ESP32-CAM) without modifying the backend architecture.
