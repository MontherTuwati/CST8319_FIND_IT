# FindIt – Campus Lost & Found Tracker

A web application for college campuses that helps students report lost items, post found items, and safely connect to return property to its owner.

## Live URL

> Coming soon — will be deployed to Vercel.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Auth:** Firebase Authentication (Google Sign-In)
- **Database:** Cloud Firestore
- **Storage:** Firebase Storage (item photos)
- **Hosting:** Vercel

## Project Structure

```
CST8319_FIND_IT/
├── public/                     Static assets
├── src/
│   ├── auth/                   Auth utilities (Google Sign-In)
│   │   └── googleSignIn.ts
│   ├── components/             Reusable UI components
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── contexts/               React contexts
│   │   └── AuthContext.tsx
│   ├── pages/                  Page components (one per route)
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── CreatePost.tsx
│   │   ├── PostDetail.tsx
│   │   ├── EditPost.tsx
│   │   └── AdminDashboard.tsx
│   ├── types.ts                TypeScript interfaces
│   ├── firebase.ts             Firebase config (reads from env vars)
│   ├── App.tsx                 Root component with routing
│   ├── main.tsx                Entry point
│   └── index.css               Tailwind import
├── .env.local.example          Template for env vars (no real keys)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Setup (for team members)

1. Clone the repo:
   ```bash
   git clone https://github.com/vickypede/CST8319_FIND_IT.git
   cd CST8319_FIND_IT
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` from the example and fill in Firebase config values:
   ```bash
   cp .env.local.example .env.local
   ```

4. Push to `main` to deploy via Vercel (auto-deploys on every push).

## Team Members

1. Victor Onipede
2. Mursal Aden
3. Monther Tuwati
4. Ayub Ali
5. Tarek Mohammed

## Course

CST8319 – Software Development Project (Algonquin College)
