```markdown
# 🖥️ Aegis Watch — Frontend Dashboard

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black)

**Live Demo:** website-detector-frontend.vercel.app
**Backend Source Code:** [https://github.com/Harshpandey3007/website-detector](https://github.com/Harshpandey3007/website-detector)
**Backend API:** https://website-detector-151j.onrender.com
A premium, dark-mode dashboard for the Aegis Watch Website Change Detector. Built to look and feel like a modern SaaS application (inspired by Vercel and Linear).

## 🏗️ Full-Stack Architecture

```mermaid
graph LR
    Client[Next.js Frontend] -->|REST + API Key| API[Express API]
    API -->|Enqueue Jobs| Queue[(Redis + BullMQ)]
    API -->|Read/Write| DB[(SQLite + Prisma)]
    Queue -->|Process| Worker[Playwright Worker]
    Worker -->|Fetch| Web[Target Websites]
    Worker -->|Hash & Diff| Engine[Diff & Noise Engine]
    Worker -->|AI Summary| Gemini[Google Gemini AI]
    Engine -->|Save Snapshot| DB
    Engine -->|Trigger Alert| Alerts[Discord / Email]
✨ Features
Real-time Dashboard: View total monitors, healthy endpoints, and recent alerts.

Monitor Management: Create, check, and delete monitors directly from the UI.

Skeleton Loading: Beautiful loading states while fetching data.

Responsive Design: Fully functional on mobile and desktop.

Toast Notifications: Instant feedback on API actions.

🚀 Setup & Installation
npm install

Create a .env.local file in the root:

env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_KEY=your-super-secure-api-key
npm run dev

Open http://localhost:3000 in your browser.

📄 License
MIT