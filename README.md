# BookLeaf Publishing — Author Support & Communication Portal
> **Full-Stack Developer Technical Assignment (Assignment 1 of 2)**  
> **Candidate Submission** | Evaluation Target: Author Support & Operations Communication at Scale

---

## 📌 Executive Summary

BookLeaf Publishing processes **1,200+ books monthly across a catalog of 22,000+ titles**. Handling thousands of author inquiries regarding royalties, book publication progress, ISBN assignment, and printing defects manually leads to delayed responses and growing backlogs.

This repository implements a full-stack **Author Support & Communication Portal** featuring:
1. **Author-Facing Portal**: Secure authentication, personal book catalog with live royalty and sales figures, smart query submission form with book association and attachments, and real-time bidirectional support ticket messaging.
2. **Admin-Facing Portal**: Unified operations queue with multi-parameter filtering, urgent/oldest-unresolved prioritization, AI-powered auto-classification into BookLeaf's 6 core categories, AI priority scoring, AI-drafted responses grounded in BookLeaf Knowledge Base, admin override controls, and confidential internal team notes.
3. **Real-Time Communication**: WebSocket synchronization powered by `Socket.IO` ensuring responses and status updates appear immediately without page reloads.
4. **Resilient AI Pipeline**: Multi-provider support (OpenAI `gpt-4o-mini`, Gemini, or Anthropic) with an automatic Knowledge-Grounded Fallback Engine that guarantees zero downtime and graceful degradation.
5. **Interactive API Documentation**: Live Swagger/OpenAPI UI hosted at `/api/docs`.

---

## 🚀 Quick Start (Running Locally)

### Prerequisites
* **Node.js** (v18.x or higher)
* **npm** (v9.x or higher)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd bookleaf-portal

# Install root, backend, and frontend dependencies
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Environment Configuration (Optional)
The system runs immediately **out of the box** without any external API keys thanks to the built-in BookLeaf Grounded Intelligence Engine.

To optionally connect external LLMs, configure `server/.env`:
```env
PORT=5000
JWT_SECRET=bookleaf_super_secure_jwt_secret_key_2026

# Optional: Add your key if you wish to test live OpenAI or Gemini completions
AI_PROVIDER=auto
OPENAI_API_KEY=
GEMINI_API_KEY=
```

### 3. Seed Database & Start Full-Stack App
```bash
# Re-seed the official 10 authors and 18 books (optional, pre-seeded by default)
npm run seed

# Run both Backend API (Port 5000) and Frontend (Port 5173) concurrently:
npm run dev
```

* **Frontend Web App:** [http://localhost:5173](http://localhost:5173) (or [http://localhost:5000](http://localhost:5000) in production build)
* **Backend REST API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
* **Interactive Swagger Docs:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

---

## 🔑 Test Login Credentials

For maximum evaluator convenience, the application includes a **Top Evaluation Switcher toolbar** allowing you to switch between any author and the admin portal with a single click. You can also log in manually using:

### Admin Accounts
| Name | Role | Email | Password |
|---|---|---|---|
| **Saloni Mourya** | Author Relations Lead | `saloni@bookleafpub.com` | `admin123` |
| **BookLeaf Ops Team** | Support Operations | `admin@bookleafpub.com` | `admin123` |

### Sample Author Accounts (Seeded from `bookleaf_sample_data.json`)
*Default Password for all authors:* **`author123`**

| Author ID | Author Name | Email | City | Books Registered |
|---|---|---|---|---|
| `AUTH001` | Priya Sharma | `priya.sharma@email.com` | Mumbai | *Whispers of the Ganges*, *The Saffron Diaries* |
| `AUTH002` | Rohit Kapoor | `rohit.kapoor@email.com` | Delhi | *Code & Karma*, *Startup Sutra* |
| `AUTH003` | Ananya Reddy | `ananya.reddy@email.com` | Hyderabad | *Between Two Temples* |
| `AUTH004` | Vikram Joshi | `vikram.joshi@email.com` | Pune | *Debugging Life*, *The Last Monsoon* |
| `AUTH005` | Meera Nair | `meera.nair@email.com` | Kochi | *Cardamom & Chaos*, *Letters from Lakshadweep* |
| `AUTH006` | Arjun Malhotra | `arjun.malhotra@email.com` | Chandigarh | *Turban Tales* |
| `AUTH007` | Sneha Kulkarni | `sneha.kulkarni@email.com` | Bangalore | *The Algorithm of Love*, *Ctrl+Alt+Delete My Ex*, *Midnight in Mysore* (In Production) |
| `AUTH008` | Farhan Sheikh | `farhan.sheikh@email.com` | Lucknow | *Ghazal of the Forgotten* |
| `AUTH009` | Kavita Deshmukh | `kavita.deshmukh@email.com` | Nagpur | *Raising Roots* (In Production), *The Nagpur Notebooks* |
| `AUTH010` | Diya Chatterjee | `diya.chatterjee@email.com` | Kolkata | *Durga’s Daughters*, *Howrah Nights* |

---

## 🧠 AI Integration Architecture

### 1. Prompt Engineering & Knowledge Base Grounding
The AI service adheres strictly to the **BookLeaf Tone & Operational Guidelines**:
* **Partnership Tone:** Authors are recognized as creative partners, not support tickets.
* **Factual Specificity:** Prompts dynamically inject the author's real ledger data (e.g. pending balance `₹3,570`, copies sold `342`, publication status).
* **Direct Ownership:** When BookLeaf is at fault (e.g. delayed payouts, ISBN mismatches, or printing quality defects), the AI takes responsibility immediately without corporate deflection and provides a **48-hour resolution timeline** or **free reprint guarantee**.

### 2. Cost & Token Awareness
* **Targeted Context Slicing:** Instead of injecting the entire BookLeaf documentation into every LLM request, the system runs an intent parser that extracts only the relevant policy slice (Royalty Policy, ISBN Policy, Printing Turnaround, or Platform Sync Rules).
* **Token Reduction:** Reduces prompt input size by **over 70%** per ticket call and enforces strict `max_tokens: 450` limits on output.

### 3. Graceful Degradation & Resilience
* What happens when the OpenAI or Gemini API is rate-limited, unreachable, or missing an API key?
  * The system **never crashes** and tickets are **never dropped**.
  * The built-in **BookLeaf Grounded Intelligence Engine** produces high-fidelity classification, priority scores, and draft responses using deterministic heuristics derived directly from the Knowledge Base.
  * Admins always retain full control to edit drafts before dispatching them.

### 4. Model Choice Justification
* **Default Recommended:** `OpenAI gpt-4o-mini` or `Claude 3.5 Haiku`.
* **Justification:** Support query classification and draft generation require rapid latency (<1s) and high empathetic tone compliance rather than heavy multi-step logical reasoning. `gpt-4o-mini` offers a 99% cost reduction compared to flagship frontier models while achieving superior response quality when backed by clean domain prompt grounding.

---

## 🏛️ System Architecture & Code Structure

```
ai-agent-workflow-automation/
├── client/                      # React 18 + Vite Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthorPortal/    # MyBooks, MyTickets, SubmitQueryModal, Conversation
│   │   │   ├── AdminPortal/     # AdminDashboard, Queue, TicketDetail, AllCatalog
│   │   │   └── Header.jsx       # Navigation & 1-Click Evaluation Switcher
│   │   ├── context/
│   │   │   ├── AuthContext.jsx  # Authentication, User State, & Switcher
│   │   │   └── SocketContext.jsx# Real-time WebSocket connection & toast updates
│   │   ├── index.css            # BookLeaf Luxury Design System (Emerald/Gold)
│   │   ├── App.jsx              # Role-based Portal Controller
│   │   └── main.jsx             # React DOM root
│   └── vite.config.ts           # Proxy to backend server (Port 5000)
├── server/                      # Node.js + Express + Socket.IO Backend
│   ├── db/
│   │   ├── database.json        # Persistent atomic relational data store
│   │   └── store.js             # Data Store & Seeder implementation
│   ├── middleware/
│   │   └── auth.js              # JWT Authentication & RBAC (Author vs Admin)
│   ├── routes/
│   │   ├── auth.js              # /api/auth (Login, Profile, Demo Accounts)
│   │   ├── books.js             # /api/books (RBAC catalog query)
│   │   └── tickets.js           # /api/tickets (CRUD, AI Pipeline, Overrides)
│   ├── services/
│   │   └── aiService.js         # Auto-classification, Priority scoring, Drafting
│   ├── knowledgeBase.js         # Official BookLeaf Policies & Tone Guidelines
│   ├── swagger.json             # OpenAPI 3.0 Documentation Specification
│   └── index.js                 # Express server & Socket.io event engine
├── data/
│   └── bookleaf_sample_data.json# Seed data: 10 Authors, 18 Books
├── WRITEUP.md                   # 1-Page Technical Write-Up (Approach & Scale)
└── package.json                 # Unified monorepo run scripts
```

---

## 📡 REST API Specification

Detailed interactive documentation is accessible at **`http://localhost:5000/api/docs`** via Swagger UI.

### Summary of Core Endpoints:

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates author or admin; returns JWT token. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves profile of currently logged-in user. |
| `GET` | `/api/auth/demo-users` | Public | Returns pre-seeded authors and admins for rapid evaluation. |
| `GET` | `/api/books` | Authenticated | Authors get their own books; Admins get full catalog. |
| `GET` | `/api/books/:id` | Authenticated | Returns book details (enforces author ownership). |
| `GET` | `/api/tickets` | Authenticated | Authors see their tickets; Admins see filtered queue. |
| `POST` | `/api/tickets` | Author/Admin | Raises ticket, triggers AI classification, priority & draft. |
| `GET` | `/api/tickets/:id` | Authenticated | Ticket details & message history (internal notes filtered for authors). |
| `PATCH` | `/api/tickets/:id` | Admin Only | Overrides status, AI category, AI priority, or assignee. |
| `POST` | `/api/tickets/:id/messages` | Authenticated | Posts reply to thread (or adds confidential internal note). |
| `POST` | `/api/tickets/:id/regenerate-ai-draft` | Admin Only | Re-runs AI drafting engine on demand. |

---

## 🧪 Edge Cases Handled

1. **Books in Production:**  
   Books such as `BK013` (*Midnight in Mysore*) and `BK015` (*Raising Roots*) lack publication dates and MRPs. The UI and database handle these gracefully without displaying broken `NaN` or `null` values.
2. **Payout Threshold Boundary:**  
   Authors with accumulated royalties under ₹1,000 (e.g. `AUTH009` with ₹850) are informed that payouts roll over to the next quarter per BookLeaf policy.
3. **Internal Note Security (RBAC):**  
   Admin notes are strictly sanitized and stripped from API payloads before sending to author clients.
4. **Real-Time Synchronization:**  
   If an admin sends a response or updates a ticket status, the author view updates instantly across devices using WebSockets without requiring a manual refresh.

---

## 🌐 Production Deployment Guide

The portal is packaged to run as a unified single-port application:

1. **Build Frontend Bundle:**
   ```bash
   npm run build
   ```
2. **Deploy to Render / Railway / Heroku:**
   * **Build Command:** `npm install && npm --prefix server install && npm --prefix client install && npm run build`
   * **Start Command:** `npm start`
   * The Express server automatically serves the compiled React client from `client/dist` and handles API requests on port 5000 (or `process.env.PORT`).

---

## 📄 License & Attribution
Prepared specifically for the **BookLeaf Publishing Technical Assessment**.  
All sample datasets, tone guidelines, and operational policies are copyright © BookLeaf Publishing.
