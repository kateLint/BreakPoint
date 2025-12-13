# BreakPoint TODO List

Track the progress of features, enhancements, and bug fixes for the BreakPoint app.

## 🚧 In Progress (High Priority)

These features are currently being worked on or are next in line for development.

- [ ] **Frontend Integration**: Connect UI to real-time backend (WebSocket client ready!)
- [ ] **Push Notifications**: Notify users when a decision is made or a lobby is closing.
- [ ] **User Authentication**: Allow users to save preferences and history.
- [ ] **Time-based Nudges**: "It's 11:30 AM, time to plan lunch!" notifications.

## 🔮 Future Enhancements (Backlog)

Ideas for Phase 2 and beyond.

- [ ] **Menu Integration**: Pull in real-time menus from restaurant APIs.
- [ ] **"Payer Roulette"**: A fun mode to decide who pays for the coffee run.
- [ ] **Achievement Badges**: Gamify the experience (e.g., "Coffee Mayor", "Early Bird").
- [ ] **Calendar Integration**: Sync decided events with Google/Outlook calendars.
- [ ] **Slack/Teams Integration**: Slash commands to start a BreakPoint session directly from chat.
- [ ] **Order Tracking**: Simple status updates for the group (Ordering -> Pickup -> Delivered).
- [ ] **Dietary Preferences**: Store and automatically filter options based on team needs (Vegan, GF, etc.).
- [ ] **Cost Splitting**: simple calculator or integration with payment apps.
- [ ] **Office Presence**: Sync "Busy Mode" across devices via per-user state in the room.
- [ ] **Fast Joining**: One link per decision with a short room code + QR code.
- [ ] **Abuse Controls**: Rate limits per client + room admin token to prevent spam invites.

## ✅ Completed

- [x] **Core UI & Design System**: Vibrant, responsive, glassmorphism design.
- [x] **Drink Wheel**: Animated spinning wheel for drink selection.
- [x] **Food Wheel Mode**: Spin the wheel to decide on a food category or specific restaurant.
- [x] **Swipe Voting**: Tinder-style interface for restaurant selection.
- [x] **Poll Voting**: Simple majority vote system with timer.
- [x] **Custom Option Voting**: Users can add their own restaurant options to polls!
- [x] **Dynamic Wheel/Card Updates**: Winning custom options automatically added to Food Wheel and Swipe Cards.
- [x] **Live Lobby**: Visual representation of team members joining.
- [x] **Notifications**: Basic system for app alerts.
- [x] **Busy Mode**: Ability to opt-out of notifications.
- [x] **Service Worker**: PWA support for offline access.
- [x] **Cloudflare Workers Backend**: Real-time multiplayer with Durable Objects (100% FREE!)
- [x] **WebSocket Client Library**: BreakPointRealtime.js ready for integration.
- [x] **Backend Infrastructure**: Complete Worker + Durable Object setup with WebSocket support.
