# express-ts

A single Express + TypeScript server that acts as the unified backend for multiple independent full-stack applications. Rather than maintaining separate servers per project, all apps share one codebase — with centralized auth, a shared DB connection, and modular, isolated route logic per application.

---

## Applications

- 🔐 **Auth** — Centralized authentication layer shared across all modules. Handles registration, login, and JWT issuance. Every other module sits behind this auth guard.

- 📓 **Blogs** — A blogging platform with a twist — users don't just publish individual posts, they create **Notebooks**: curated collections of blogs published together as a unit. Think of it as the difference between a tweet and a zine.

- 💬 **Chats** — Stateless, real-time group chat powered by **WebSockets**. No message history, no persistent rooms — just live conversations. The vibe is somewhere between Omegle's anonymity and Discord's group structure.

- 💸 **Expenses** — A personal expense tracker. Users log and categorize expenses, and the client renders charts and summaries for a visual breakdown of spending.

- 🧩 **Forms** — Users can build forms — including **nested forms** — configure their full structure and validation rules, and save the configuration to the database. A shareable link is generated per form; anyone with the link gets the form built entirely at runtime from the stored config. Responses are persisted to the DB.

- 🧾 **Invoices** *(Deprecated)* — A server-side PDF invoice generator. Shelved due to the lack of a library capable of producing authentic-looking output. May be revived in the future.

- 💼 **Jobs** — A fully functional mock job board covering the complete surface area of a real platform — job listings, company profiles, employer dashboards, and applicant flows.

---

## Tech Stack

| | |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| Real-time | WebSockets (chats), SSE (where applicable) |

---

## Structure & Patterns

Each module is self-contained with its own routes, controllers, services, and models. They share infrastructure (auth, DB, middleware) but are otherwise fully isolated — adding or removing a module has no side effects on others.

---

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Dev server with hot reload
npm run dev

# Production
npm run build && npm start
```

---

*This is a living project — modules get refined, new ones get added, and deprecated ones may yet make a comeback. Documentation will grow alongside it.*