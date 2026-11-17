# Pokémon World PvP - Online Battle Arena

A full-stack, real-time multiplayer Pokémon PvP game engine powered by modern web technologies and animated Pokémon spritesheets from the **Deluxe Battle Kit / Generation 9 Pack**.

---

## 🏗️ Architecture Overview

The project is decoupled into two modular, production-ready applications:

```
pokemonworld/
├── backend/                       # Django 6.1 + ASGI Channels (WebSockets)
│   ├── accounts/                  # User accounts & Superuser initialization
│   ├── battle/                    # Battle Engine (Gen 9 Damage, Turns, WebSockets)
│   ├── pokedex/                   # Roster data, PBS metrics parser & Sprite serving
│   ├── pokemon_server/            # Django ASGI & settings configuration
│   ├── build.sh                   # Render deployment build script
│   ├── Procfile                   # Render process definition (Daphne ASGI)
│   ├── render.yaml                # Render Blueprint deployment configuration
│   └── requirements.txt
│
├── frontend/                      # React 18 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── battle/            # BattleArena, AnimatedPokemonSprite, StatusCard, ActionPanel
│   │   │   ├── matchmaking/       # Lobby (PvP room creation, join code, AI match)
│   │   │   └── team/              # TeamBuilder (6-party roster selector)
│   │   ├── hooks/                 # useBattle WebSocket hook
│   │   ├── types/                 # TypeScript interfaces (Pokemon, BattleState, Moves)
│   │   └── utils/                 # Gen 9 Type colors and calculations
│   └── vercel.json                # Vercel deployment configuration
│
├── Animated Pokemon Sprites/      # Front, Back, Shiny spritesheets (1,600+ species)
└── Animated Pokemon System/       # PBS files with positioning and scale metrics
```

---

## 🔑 Default Superuser

The backend comes pre-seeded with the required administrative superuser:

- **Username**: `joselm2490`
- **Email**: `joselm2490@gmail.com`
- **Password**: `Keiler2490`
- **Admin Panel**: `http://127.0.0.1:8080/admin/`

---

## ⚡ How the Animated Sprites Work

The sprites in `Animated Pokemon Sprites` are horizontal strip spritesheets where each frame is a square of `height × height`.
- The frontend canvas dynamic animator calculates:
  $$\text{totalFrames} = \text{Math.round}(\text{naturalWidth} / \text{naturalHeight})$$
- Each frame is rendered sequentially at 25–30 FPS onto an HTML5 Canvas with `imageSmoothingEnabled = false`, preserving authentic retro pixel art at any scale (2.5x, 3x).

---

## 🚀 Running Locally

### 1. Backend (Django ASGI with Daphne)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py init_admin
daphne -b 127.0.0.1 -p 8080 pokemon_server.asgi:application
```

### 2. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## ☁️ Deployment Guide

### Deploying the Backend to Render (Server)
1. Push your repository to GitHub or GitLab.
2. In [Render Dashboard](https://dashboard.render.com), create a new **Web Service** or use the included `backend/render.yaml` Blueprint.
3. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python`
   - **Build Command**: `./build.sh`
   - **Start Command**: `daphne -b 0.0.0.0 -p $PORT pokemon_server.asgi:application`
4. Set environment variable: `ALLOWED_HOSTS=*`.
5. Render will deploy your ASGI Django server with native WebSocket support!

### Deploying the Frontend to Vercel (Client)
1. In [Vercel Dashboard](https://vercel.com), import your repository.
2. Set **Root Directory** to `frontend`.
3. In Environment Variables, set:
   - `VITE_BACKEND_API_URL`: Your Render backend URL (e.g. `https://pokemon-battle-server.onrender.com`)
   - `VITE_BACKEND_WS_URL`: Your Render WebSocket URL (e.g. `wss://pokemon-battle-server.onrender.com`)
4. Click **Deploy**. Vercel will automatically build and publish your game globally via `vercel.json`!
