# 🚀 BreakPoint Developer Workflow Guide

Complete guide for developing, testing, and deploying your BreakPoint app.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Testing the App](#testing-the-app)
- [How Rooms Work](#how-rooms-work)
- [Real-time Features](#real-time-features)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Quick Start

### 1. Start the Backend (Terminal 1)

```bash
cd worker
npm install
npm run dev
```

✅ Backend will run on `http://localhost:8787`

### 2. Start the Frontend (Terminal 2)

```bash
# From project root
python3 -m http.server 8000

# OR use Node.js
npx http-server -p 8000
```

✅ Frontend will run on `http://localhost:8000`

### 3. Open in Browser

Navigate to: **http://localhost:8000**

---

## 🛠️ Development Setup

### Prerequisites

- **Node.js** (v16 or later) - for the Cloudflare Worker
- **Python 3** or **Node.js http-server** - for serving the frontend
- **Modern browser** - Chrome, Firefox, Safari, or Edge

### Project Structure

```
BreakPoint/
├── index.html              # Main app entry point
├── js/
│   ├── app.js             # Main application logic
│   ├── components/        # UI components (wheels, voting, etc.)
│   └── utils/             # Utilities (WebSocket client, etc.)
├── css/                   # Stylesheets
├── worker/                # Cloudflare Worker backend
│   ├── src/index.ts      # Durable Object + WebSocket handler
│   └── package.json      # Backend dependencies
└── manifest.json         # PWA manifest
```

---

## 🧪 Testing the App

### Test Flow: Multi-User Polling

**Goal:** See real-time updates between users in the same room.

#### Step 1: Create a Room

1. Open **http://localhost:8000**
2. You'll see the **Room Selection** screen with purple gradient
3. Click on **ROOM1** (default room) to join
4. You're now in the room!

#### Step 2: Open Second Browser/Tab

1. Open a **new incognito/private window** (simulates another user)
2. Navigate to **http://localhost:8000**
3. Click on **ROOM1** to join the same room
4. Both users are now in ROOM1

#### Step 3: Start a Poll

**In Browser 1:**
1. Click **"Team Lunch"** button
2. Click **"Team Poll"**
3. You'll see default restaurant options (Pizza Palace, Burger Joint, etc.)

**In Browser 2:**
1. Click **"Team Lunch"** → **"Team Poll"**
2. You should see the **same poll**

#### Step 4: Test Real-time Voting

**In Browser 1:**
- Click on **"Pizza Palace"** to vote

**In Browser 2:**
- Watch the vote count update **in real-time**! 🎉
- The percentage bar should animate
- You'll see "1 vote" appear

#### Step 5: Add Custom Option

**In Browser 1:**
1. Type **"Taco Bell"** in the custom option input
2. Click **"Add"**

**In Browser 2:**
- The new option **"Taco Bell"** appears instantly! ✨

---

## 🏠 How Rooms Work

### Room Basics

- **Rooms** isolate different teams/groups
- Each room has its own:
  - Member list
  - Active polls/activities
  - Vote counts
  - Custom options

### Creating Rooms

**From Room Selection Screen:**
1. Enter a room name (e.g., "FLOOR3", "ENGINEERING")
2. Click **"Create"**
3. Room is saved to your browser's localStorage
4. You're automatically joined to the new room

**Room ID Rules:**
- 3-16 characters
- Letters, numbers, hyphens, underscores only
- Automatically converted to UPPERCASE

### Switching Rooms

1. Click **back arrow** (←) in the top left of any activity screen
2. You'll return to **Room Selection**
3. Click on any saved room to join
4. Your WebSocket connection will switch to the new room

### Example: Testing Multiple Rooms

**Browser 1:**
- Join **ROOM1**
- Start a poll, vote for Pizza

**Browser 2:**
- Create and join **ENGINEERING**
- Start a poll, vote for Burger

**Result:** Polls are completely separate! Room1 doesn't see ENGINEERING's votes.

---

## ⚡ Real-time Features

### What Syncs Automatically?

✅ **Poll Votes** - All users see votes in real-time
✅ **Custom Options** - New restaurants appear for everyone
✅ **Member Count** - See who's online
✅ **Activity Updates** - When someone starts a poll/wheel

### Backend Architecture

```
Frontend (Browser)
    ↓ WebSocket
Worker (Cloudflare)
    ↓
Durable Object (Per-Room State)
```

**Key Points:**
- Each room = 1 Durable Object instance
- Durable Objects persist state in-memory + storage
- WebSocket messages broadcast to all connected clients
- State survives server restarts

### Message Flow Example

**User A votes for Pizza:**

```
1. Browser A sends: { t: "vote", activityId: "poll-1", vote: { restaurantId: "1" } }
2. Durable Object receives vote
3. Updates state: votes["user-a"] = { restaurantId: "1" }
4. Broadcasts to ALL connected clients: { t: "activity_upsert", activity: {...} }
5. Browser A + Browser B both update UI
```

---

## 📝 Common Tasks

### Task 1: Check WebSocket Connection

**Browser Console (F12):**

```javascript
// Check connection status
console.log('Connected:', AppState.realtimeClient?.isConnected);

// Check current room
console.log('Room:', AppState.currentRoomId);

// Check room state
console.log('State:', AppState.realtimeClient?.state);
```

### Task 2: View Backend Logs

**Terminal 1 (Worker):**
- Watch for log messages when users connect/vote
- Example output:
  ```
  🔌 Connecting to room: ROOM1
  ✅ Connected to room: { roomId: 'ROOM1', isHost: true }
  📤 Syncing custom option to server: { name: 'Taco Bell', ... }
  ```

### Task 3: Reset Everything

**Clear Browser Data:**
```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

**Restart Backend:**
```bash
# In worker terminal
Ctrl+C  # Stop worker
npm run dev  # Restart
```

### Task 4: Add a New Restaurant (Frontend Only - Temporary)

**Edit:** [js/components/FoodDecider.js](js/components/FoodDecider.js)

```javascript
const DEFAULT_POLL_RESTAURANTS = [
    { id: '1', name: 'Pizza Palace', emoji: '🍕', votes: 0, isCustom: false },
    { id: '2', name: 'Burger Joint', emoji: '🍔', votes: 0, isCustom: false },
    // ADD NEW ONE HERE:
    { id: '6', name: 'Ramen House', emoji: '🍜', votes: 0, isCustom: false }
];
```

**Reload page** to see changes.

---

## 🐛 Troubleshooting

### Problem: "Connecting to room..." never completes

**Causes:**
1. Backend not running
2. Wrong port (should be 8787)
3. CORS issues

**Solutions:**
```bash
# Check if worker is running
curl http://localhost:8787

# Should return: {"ok":true,"endpoints":{...}}

# If not, restart worker:
cd worker
npm run dev
```

### Problem: Votes don't sync between browsers

**Check:**
1. Both browsers in **same room**?
2. Look for errors in **browser console** (F12)
3. Check **worker terminal** for connection logs

**Common Issue:** Both users joined different rooms!
- Go back to room selection
- Make sure both click **same room name**

### Problem: Custom options disappear

**Cause:** Currently stored client-side only

**Workaround:**
- Custom options persist in current session
- After page reload, they reset to defaults
- **Next Step:** Move to server-side storage (see TODO.md)

### Problem: Can't create room

**Check room name:**
- Must be 3-16 characters
- Only A-Z, 0-9, hyphens, underscores
- No spaces, special characters

**Error Messages:**
- "Room ID can only contain..." → Invalid characters
- "Room ID must be between..." → Too short/long

### Problem: Backend won't start

**Error:** `Cannot find module...`

**Solution:**
```bash
cd worker
rm -rf node_modules
npm install
npm run dev
```

**Error:** `Port 8787 already in use`

**Solution:**
```bash
# Find process using port
lsof -i :8787

# Kill it
kill -9 <PID>

# Or use different port
npx wrangler dev --port 8788
```

---

## 🚀 Next Steps

### Moving Hardcoded Data to Server

**Currently:**
- Restaurant lists in [js/components/FoodDecider.js](js/components/FoodDecider.js)
- Drink options in [js/components/DrinkWheel.js](js/components/DrinkWheel.js)

**Goal:**
- Store in Durable Object state
- Fetch on room join
- Admin can update centrally

**Implementation Plan:**
1. Add `restaurantOptions: []` to `RoomState` in [worker/src/index.ts](worker/src/index.ts)
2. Send options in `welcome` message
3. Update frontend to use server-provided options
4. Add admin endpoint to update options

### Testing on Mobile Devices

**Same WiFi Network:**

1. Get your computer's local IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. On mobile browser:
   - Navigate to `http://<YOUR_IP>:8000`
   - Example: `http://192.168.1.100:8000`

3. Make sure backend URL supports your IP:
   - [index.html](index.html) line 518 uses `window.location.hostname`
   - This automatically works with any IP!

---

## 📞 Need Help?

- **README.md** - Project overview and setup
- **TODO.md** - Current roadmap and completed features
- **Check browser console** - Most errors show there
- **Check worker logs** - Real-time debugging info

---

**Happy Coding! ☕🍕🎉**
