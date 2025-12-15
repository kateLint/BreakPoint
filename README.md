# BreakPoint 🎉

**Make office decisions fun, fast, and social!**

BreakPoint is a Progressive Web App (PWA) that helps coworkers simplify daily decisions like "Who wants coffee?" and "Where should we eat lunch?" using game-like elements including spinning wheels and swipe voting.

## ✨ Features

### 🎡 The Drink Wheel
- Spin a colorful wheel to choose your drink
- Customize options (Coffee, Tea, Water, Soda, Surprise Me!)
- Invite teammates instantly
- Live lobby shows who's joining in real-time

### 🍕 The Food Decider
Three fun ways to decide where to eat:

1. **Quick Poll** - Vote on a few options, majority wins
2. **Swipe to Match** - Tinder-style voting to find what everyone likes
3. **Spin the Wheel** - Let fate decide (coming soon!)

### 🔔 Smart Notifications
- One-tap join/decline from notifications
- Busy Mode to pause invitations
- Real-time updates when people join

## 🔐 Room System

### How Rooms Work

**Browse & Discover**
- View all active rooms in real-time
- See who's online and who's hosting
- Find your team's rooms instantly

**Join with Approval**
- Request to join any room
- Host approves or denies requests
- Instant notification system
- Social approval flow

**Share with Links**
- Generate invite links for your room
- QR codes for easy mobile sharing
- Anyone with the link can join directly
- No approval needed with invite link

**Privacy & Security**
- Cryptographically secure invite tokens
- Rate limiting prevents spam
- Host has full control over who joins
- Room-based access control

For complete technical details, see [Room System Documentation](docs/room-system.md).

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Node.js (for local development server)

### Installation

1. **Clone or download this repository**

2. **Start a local server**

   Using Python:
   ```bash
   python3 -m http.server 8000
   ```

   Using Node.js:
   ```bash
   npx http-server -p 8000
   ```

   Using PHP:
   ```bash
   php -S localhost:8000
   ```

3. **Open in browser**
   ```
   http://localhost:8000
   ```

4. **Install as PWA** (optional)
   - Click the install button in your browser's address bar
   - Or use "Add to Home Screen" on mobile

## 🎨 Design Philosophy

BreakPoint follows modern web design principles:

- **Vibrant Colors**: Purple-to-pink gradients for drinks, orange-to-red for food
- **Smooth Animations**: Micro-interactions make every action feel premium
- **Glassmorphism**: Frosted glass effects with backdrop blur
- **Dark Mode**: Sleek dark theme for comfortable viewing
- **Responsive**: Works beautifully on desktop, tablet, and mobile

## 📱 Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS + Custom design tokens
- **Fonts**: Google Fonts (Outfit, Inter)
- **PWA**: Service Worker for offline support
- **Backend**: Cloudflare Workers + Durable Objects (100% free, real-time WebSockets)
- **Hosting**: Cloudflare Pages (static frontend)

## 🏗️ Project Structure

```
BreakPoint/
├── index.html              # Main app entry
├── manifest.json           # PWA configuration
├── service-worker.js       # Offline support
├── js/
│   ├── app.js             # Main app controller
│   ├── components/
│   │   ├── DrinkWheel.js  # Drink wheel component
│   │   ├── FoodWheel.js   # Food wheel component
│   │   ├── FoodDecider.js # Poll voting component
│   │   └── SwipeVoting.js # Swipe voting component
│   └── utils/
│       ├── animations.js      # Animation utilities
│       └── BreakPointRealtime.js  # WebSocket client for real-time rooms
├── assets/
│   └── images/            # Food & drink images
└── worker/                # Cloudflare Worker (real-time backend)
    ├── package.json
    ├── wrangler.jsonc     # Cloudflare config
    ├── tsconfig.json
    └── src/
        └── index.ts       # Durable Object + WebSocket handler
```

## 🎯 Key User Flows

### Quick Coffee Break (< 2 minutes)
1. Open app → Tap "Get a Drink"
2. Spin the wheel → Lands on "Double Espresso"
3. Tap "Invite Team" → Select people
4. Set time & location → Send invitation
5. Watch live lobby as people join
6. Tap "Let's Go!" → Everyone gets notified

### Team Lunch Decision
1. Open app → Tap "Plan Lunch"
2. Choose decision mode (Poll or Swipe)
3. Everyone votes on their phones
4. App finds the match → Celebration with confetti! 🎉
5. Winner announced with meeting details

## 🔧 Development

### Current Status
✅ Core UI and design system
✅ Spinning wheel with animations
✅ Swipe voting (Tinder-style)
✅ Poll voting with timer
✅ Food wheel mode
✅ Live lobby with avatar animations
✅ Notification system
✅ Busy mode
✅ Service worker for offline support
✅ Real-time multiplayer with Cloudflare Workers
✅ Room discovery and browse system
✅ Invite links with QR codes
✅ Request-to-join with host approval

🚧 In Progress
- Push notifications
- User authentication
- Time-based nudge notifications

---

## 🌐 Backend Setup (Cloudflare Workers - 100% FREE)

### Why Cloudflare?

✅ **Free Forever** - No credit card required
✅ **100,000 requests/day** on free tier
✅ **Real-time WebSockets** with hibernation
✅ **Auto-scaling** and auto-cleanup
✅ **Global edge network** - Low latency worldwide
✅ **Perfect for ephemeral rooms** - Rooms auto-delete after 24h of inactivity

### Local Development (No Deployment Needed!)

1. **Install dependencies:**
   ```bash
   cd worker
   npm install
   ```

2. **Start the Worker (Terminal 1):**
   ```bash
   npm run dev
   ```
   Worker runs on `http://localhost:8787`

3. **Start the Frontend (Terminal 2):**
   ```bash
   cd ..
   python3 -m http.server 8000
   ```
   Frontend runs on `http://localhost:8000`

4. **Open your browser:**
   ```
   http://localhost:8000
   ```

The frontend will automatically connect to your local Worker for real-time features!

---

### Deploying to Production (FREE!)

1. **Sign up for Cloudflare** (free, no credit card):
   ```bash
   cd worker
   npx wrangler login
   ```

2. **Deploy the Worker:**
   ```bash
   npm run deploy
   ```

3. **Deploy the Frontend to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Pages → Create a project → Connect to Git
   - Or drag & drop your project folder

4. **Update API URL:**
   - Edit `index.html` and set `BREAKPOINT_API_BASE_URL` to your Worker URL
   - Example: `https://breakpoint-realtime.YOUR-SUBDOMAIN.workers.dev`

---

### Running in Development

1. Start both servers (worker + frontend)
2. Open `http://localhost:8000` in your browser
3. Try the flows:
   - Click "Quick Coffee" to spin the drink wheel
   - Click "Team Lunch" → "Swipe to Vote" for card voting
   - Click "Team Lunch" → "Team Poll" for poll voting
   - Click "Team Lunch" → "Spin the Wheel" for food wheel

### Browser Console

Open the browser console (F12) to see:
- WebSocket connection status
- Real-time message events
- Component initialization

## 🎨 Customization

### Colors
Edit CSS variables in `css/main.css`:
```css
:root {
    --color-primary: #8B5CF6;
    --color-secondary: #EC4899;
    --gradient-drink: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
}
```

### Drink Options
Edit `DRINK_OPTIONS` in `js/components/DrinkWheel.js`

### Restaurant Options
Edit `MOCK_RESTAURANTS` in `js/components/SwipeVoting.js`

## 📝 Future Enhancements

See [TODO.md](./TODO.md) for the active roadmap and backlog.

## 🤝 Contributing

This is a prototype/demo application. Feel free to fork and customize for your team!

## 📄 License

MIT License - feel free to use this for your office!

## 🎉 Credits

Built with ❤️ for making office life more fun!

**Design Inspiration**: Modern web apps, Tinder, Slack
**Icons**: Emoji (built-in)
**Fonts**: Google Fonts

---

**Have fun making decisions! ☕🍕🎉**
