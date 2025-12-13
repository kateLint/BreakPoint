# BreakPoint Realtime Worker

Real-time multiplayer backend using Cloudflare Workers + Durable Objects.

## 🚀 Quick Start (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Worker:**
   ```bash
   npm run dev
   ```

   Worker runs on `http://localhost:8787`

3. **Test the API:**
   ```bash
   # Create a room
   curl -X POST http://localhost:8787/api/rooms

   # Response: {"roomId":"ABC12345"}
   ```

4. **Connect from frontend:**
   - Set `window.BREAKPOINT_API_BASE_URL = "http://localhost:8787"` in your HTML
   - Frontend will automatically connect via WebSocket

---

## 📦 Deploy to Production (FREE!)

1. **Login to Cloudflare:**
   ```bash
   npx wrangler login
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Update frontend:**
   - Change `ALLOWED_ORIGINS` in `wrangler.jsonc` to your production domain
   - Update `BREAKPOINT_API_BASE_URL` in frontend to your Worker URL

---

## 🏗️ Architecture

### Durable Objects (Room Isolation)

Each room gets its own Durable Object instance:
- **1 room = 1 DO = 1 WebSocket hub**
- Rooms are identified by short codes (e.g., "ABC12345")
- Automatic cleanup after 24h of inactivity

### WebSocket API

**Client → Server Messages:**
- `hello` - Join room with profile
- `set_busy` - Update busy status
- `activity_start` - Host starts a new activity
- `activity_update` - Host updates activity state
- `vote` - Cast a vote
- `spin` - Request server-side wheel spin
- `activity_close` - Close activity

**Server → Client Messages:**
- `welcome` - Connection established
- `state` - Full room state
- `member_upsert` - Member joined/updated
- `member_offline` - Member left
- `activity_upsert` - Activity created/updated
- `activity_result` - Activity result ready
- `error` - Error occurred

### Activity Types

1. **drink_wheel** - Spin for coffee/drinks
2. **food_wheel** - Spin for restaurants
3. **quick_poll** - Vote on options
4. **swipe_match** - Tinder-style voting

---

## 🔐 Security

- CORS protection (only allowed origins)
- Host-only mutations (only room creator can start activities)
- Auto-kick on duplicate connections
- Input validation on all messages
- Rate limiting via Cloudflare (100k requests/day free)

---

## 📊 Free Tier Limits

✅ **100,000 requests/day** (Worker)
✅ **1 million Durable Object requests/day**
✅ **5GB storage** (Durable Objects)
✅ **Unlimited WebSocket connections** (with hibernation)

**Typical usage for 10-person team:**
- 10 rooms/day × 100 requests/room = 1,000 requests/day
- **99% within free tier!**

---

## 🐛 Debugging

View logs during development:
```bash
npm run dev
```

View production logs:
```bash
npx wrangler tail
```

---

## 📝 Configuration

Edit `wrangler.jsonc`:
- `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend origins
- `compatibility_date` - Cloudflare Workers API version

Edit `.dev.vars` for local development environment variables.
