# BreakPoint Setup Guide

Complete guide to get your real-time multiplayer BreakPoint app running locally and deploying to production (100% FREE!).

---

## 🎯 What You're Building

A real-time Progressive Web App where teams can:
- **Spin the Drink Wheel** - Decide what coffee/drink to get
- **Spin the Food Wheel** - Pick a restaurant category
- **Swipe to Vote** - Tinder-style restaurant voting
- **Team Poll** - Quick polls for group decisions
- **Live Lobby** - See who's joining in real-time

All powered by **Cloudflare Workers + Durable Objects** (completely FREE, no credit card required!).

---

## 📋 Prerequisites

✅ **Node.js** (v18 or later) - [Download here](https://nodejs.org/)
✅ **Python 3** (for local frontend server) - Usually pre-installed on Mac/Linux
✅ **Modern Browser** - Chrome, Firefox, Safari, or Edge
✅ **Cloudflare Account** (free) - [Sign up here](https://dash.cloudflare.com/sign-up)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Install Worker Dependencies

```bash
cd worker
npm install
```

This installs:
- `wrangler` - Cloudflare CLI for deploying Workers
- `typescript` - For type checking
- `@cloudflare/workers-types` - TypeScript definitions

### Step 2: Start the Worker (Terminal 1)

```bash
npm run dev
```

You should see:
```
⛅️ wrangler 3.x.x
-------------------
⎔ Starting local server...
⎔ Ready on http://localhost:8787
```

✅ **Worker is running!**

### Step 3: Start the Frontend (Terminal 2)

Open a new terminal in the project root:

```bash
python3 -m http.server 8000
```

You should see:
```
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```

✅ **Frontend is running!**

### Step 4: Open in Browser

Navigate to:
```
http://localhost:8000
```

You should see the BreakPoint home screen with:
- ☕ **Quick Coffee** button
- 🍴 **Team Lunch** button

### Step 5: Test It!

1. Click "Quick Coffee"
2. Click "SPIN IT!"
3. Watch the wheel spin and see the result!

🎉 **You're running BreakPoint locally!**

---

## 🔌 Connecting Frontend to Backend

Currently, the frontend runs in **offline mode** (mock data). To enable real-time multiplayer:

### Add this to `index.html` (before `</head>`):

```html
<script>
  // Dev mode: local Worker
  window.BREAKPOINT_API_BASE_URL = "http://localhost:8787";

  // Production mode (after deploying):
  // window.BREAKPOINT_API_BASE_URL = "https://breakpoint-realtime.YOUR-SUBDOMAIN.workers.dev";
</script>
```

### Test the Connection:

Open browser console (F12) and run:

```javascript
import { BreakPointRealtime } from '/js/utils/BreakPointRealtime.js';

const rt = new BreakPointRealtime({
  apiBaseUrl: "http://localhost:8787",
  roomId: "TEST1234",
  profile: {
    clientId: crypto.randomUUID(),
    displayName: "Test User",
    avatar: "👤",
    busy: false
  }
});

rt.addEventListener("welcome", (e) => console.log("Connected!", e.detail));
rt.addEventListener("state", (e) => console.log("Room state:", e.detail.state));
rt.addEventListener("error", (e) => console.error("Error:", e.detail));

await rt.connect();
```

If you see `Connected!` and `Room state:` logs, the backend is working! 🎉

---

## 🌐 Deploy to Production (100% FREE)

### Step 1: Login to Cloudflare

```bash
cd worker
npx wrangler login
```

This will open your browser for authorization. Click "Allow" to grant access.

### Step 2: Deploy the Worker

```bash
npm run deploy
```

You should see:
```
✨ Built successfully
Published breakpoint-realtime (X.XX sec)
  https://breakpoint-realtime.YOUR-SUBDOMAIN.workers.dev
Current Deployment ID: xxxx-xxxx-xxxx
```

✅ **Your Worker is live!** Copy the URL.

### Step 3: Update CORS Settings

Edit `worker/wrangler.jsonc`:

```jsonc
"vars": {
  "ALLOWED_ORIGINS": "https://YOUR-FRONTEND-DOMAIN.pages.dev,http://localhost:8000"
}
```

Redeploy:
```bash
npm run deploy
```

### Step 4: Deploy Frontend to Cloudflare Pages

Two options:

**Option A: Drag & Drop**
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Pages → Create a project → Upload assets
3. Drag your project folder (exclude `worker/` and `node_modules/`)
4. Deploy!

**Option B: Connect to Git**
1. Push your repo to GitHub
2. Pages → Create a project → Connect to Git
3. Select your repository
4. Build settings:
   - Build command: (leave empty)
   - Build output directory: `/`
5. Deploy!

### Step 5: Update API URL

Edit `index.html` and change:

```html
<script>
  window.BREAKPOINT_API_BASE_URL = "https://breakpoint-realtime.YOUR-SUBDOMAIN.workers.dev";
</script>
```

Redeploy your frontend (drag & drop again or push to Git).

🚀 **You're live in production!**

---

## 🧪 Testing Guide

### Test Drink Wheel:
1. Open app → Click "Quick Coffee"
2. Click "SPIN IT!"
3. Verify wheel spins and shows result
4. Click "Spin Again" to reset

### Test Food Wheel:
1. Open app → Click "Team Lunch"
2. Click "Spin the Wheel"
3. Click "SPIN IT!"
4. Verify result shows a restaurant

### Test Swipe Voting:
1. Click "Team Lunch" → "Swipe to Vote"
2. Drag cards left/right
3. Click ✗ or ✓ buttons
4. Verify cards animate away

### Test Team Poll:
1. Click "Team Lunch" → "Team Poll"
2. Click any restaurant to vote
3. Verify percentage bar updates
4. Click "See Winner"

### Test Real-time Multiplayer:
1. Open app in **two browser windows**
2. Both connect to same room
3. One person spins the wheel
4. Both should see the same result!

---

## 🐛 Troubleshooting

### Worker won't start:
```bash
# Make sure you're in the worker directory
cd worker

# Clear cache and reinstall
rm -rf node_modules .wrangler
npm install
npm run dev
```

### Frontend shows "can't connect":
- Check that `BREAKPOINT_API_BASE_URL` is set
- Verify Worker is running on `localhost:8787`
- Check browser console for CORS errors
- Make sure `ALLOWED_ORIGINS` includes `http://localhost:8000`

### Buttons don't work:
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check browser console (F12) for JavaScript errors
- Make sure Python server is running on port 8000

### Deploy fails:
```bash
# Make sure you're logged in
npx wrangler whoami

# If not logged in:
npx wrangler login

# Try deploying again
npm run deploy
```

---

## 📊 Free Tier Limits

Your app runs **100% FREE** on Cloudflare:

✅ **100,000 Worker requests/day**
✅ **1 million Durable Object requests/day**
✅ **5GB Durable Object storage**
✅ **Unlimited WebSocket connections** (with hibernation)
✅ **Unlimited bandwidth** (Cloudflare Pages)

**Typical usage for 10-person team:**
- 10 rooms/day × 100 requests/room = **1,000 requests/day**
- **99% within free tier!** 🎉

---

## 📝 Next Steps

Now that you have the backend running:

1. **Integrate real-time lobby** - Show live member avatars
2. **Add room codes** - Create/join rooms with short codes
3. **Add push notifications** - Alert users when decisions are made
4. **Add authentication** - Save user preferences
5. **Add QR codes** - Quick joining via QR scan

Check [TODO.md](TODO.md) for the full roadmap!

---

## 🎓 Learn More

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [WebSocket API Guide](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)

---

**Have fun building! ☕🍕🎉**
