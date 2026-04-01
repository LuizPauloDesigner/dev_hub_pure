# 🌌 Pure Dev Dashboard: Enterprise-Grade Workspace

## 🎯 Architecture Vision
A high-performance command center for modern developers, designed with a focus on **modular visual planning**, **local-first data persistence**, and **seamless cloud synchronization**. 

This system follows a **Hybrid Monolithic Architecture** with a clear separation between the reactive frontend and the secure SQLite-backed API.

---

## 🏗️ System Architecture

### 1. Frontend Layer (React + Vite)
- **State Management**: Context-based (`AppContext`) with high-frequency local state for canvas interactions.
- **Canvas Engine**: Custom-built `Mural Criativo` (Milanote Clone) using a coordinate-based rendering system with recursive board nesting.
- **UI System**: Built on `Radix UI` and `Shadcn/UI` for accessible, theme-aware components.
- **Persistence**: **IndexedDB Handoff**. Data is first stored locally for zero-latency UI updates and then synced with the backend.

### 2. Backend Layer (Node.js + Express)
- **API Strategy**: RESTful service with strictly typed Zod validation.
- **Security**: 
  - **Helmet**: Advanced CSP and HSTS headers.
  - **Rate Limiting**: Multi-level throttling (Global + Route-specific).
  - **Auth**: JWT-based stateless authentication with bcrypt password hashing.
- **Data Layer**: High-performance `Better-SQLite3` for atomic, low-overhead database operations.

---

## 📦 Project Structure
```text
.
├── src/                # Frontend Application
│   ├── components/     # UI Components & Mural Modules
│   ├── contexts/       # Global App State Logic
│   ├── lib/            # Shared Utilities (cn, auth-helpers)
│   └── services/       # API Connectors & IndexedDB Logic
├── server/             # Node.js Backend API
│   ├── src/
│   │   ├── routes/     # Entity and Logic routing
│   │   ├── middleware/ # Security, Auth & Maintenance logic
│   │   └── db.ts       # Database Initialization
│   └── database.sqlite # Persistent Storage
├── public/             # Static Assets
└── package.json        # Root workspace management
```

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite | UI Rendering & Fast Refresh |
| **Styling** | Tailwind CSS | Utility-first Design System |
| **Icons** | Lucide | Semantic Vector Graphics |
| **Backend** | Express (Node.js) | Request Handling & Routing |
| **Database** | SQLite3 | Local/Edge Database Persistence |
| **Security** | Helmet, Zod, JWT | Data Integrity & Protection |
| **CI/CD** | Render | Automated Deployment Pipeline |

---

## 🚀 Key Architectural Features

### 🧩 Recursive Board Nesting
The `Mural Criativo` module implements a recursive ID-traversal algorithm that allows creating boards within boards. Each element maintains its `parentId`, enabling infinite hierarchy without structural performance degradation.

### 🔄 Sync & Offline Resilience
The application uses a **local-first** approach. If the backend is unavailable, the frontend continues to operate using IndexedDB. Changes are queued and reconciled once connectivity is restored, ensuring no data loss.

### 🎨 Modular Theming
Uses a centralized CSS variable system defined in `src/index.css`, allowing instant switching between Elite Dark and Light modes across all custom canvas elements.

---

## 🛠️ Development & Deployment

### Local Setup
1. **Root Install**: `npm install`
2. **Server Install**: `cd server && npm install`
3. **Execution**: `npm run dev`

### Production Deployment (Render)
The project is optimized for hybrid deployment. The Node server serves both the API and the static `dist/` frontend bundle.
- **Build**: `npm run render-build`
- **Runtime**: `npm start`

---

## 📜 Roadmap
- [ ] **Phase 4**: Implementation of real-time collaborative editing (WebSockets).
- [ ] **Phase 5**: Mobile-responsive touch controls for the Mural Canvas.
- [ ] **Phase 6**: Advanced Export (PDF/Image) for visual boards.

---
**Architected with ☕ and Nerdzão Elite mindset.**
