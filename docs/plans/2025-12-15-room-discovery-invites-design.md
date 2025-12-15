# Room Discovery & Invite System Design

**Date:** 2025-12-15
**Status:** Approved
**Features:** Browse Active Rooms, Request to Join, Invite Links & QR Codes

## Overview

Add three interconnected features to make room discovery and joining easier while maintaining privacy control:

1. **Browse Active Rooms** - Public directory showing all rooms with online users
2. **Request to Join** - Social approval flow where users request access and hosts approve/deny
3. **Invite Links & QR Codes** - Anyone in a room can generate shareable invite links/QR codes that bypass the request flow

## Architecture

### High-Level Flow

```
Browse Rooms → Request to Join → Host Approves → User joins
                      OR
Share Link → Click Link → Auto-join (bypass request)
```

### Key Components

#### 1. Room Registry (Server)
- New `RoomRegistry` Durable Object (singleton)
- Tracks all active rooms: `{ roomId: string, onlineCount: number, hostName: string }`
- Rooms report their status when members join/leave
- Powers the `GET /api/rooms/list` endpoint

#### 2. Invite Token System (Server)
- Cryptographically secure random tokens (16 chars)
- Stored in room state: `inviteTokens: [{ token, createdBy, createdAt }]`
- Validated on WebSocket hello message
- Optional 24h expiration

#### 3. Join Request Queue (Server)
- Pending requests stored in room state: `joinRequests: [{ clientId, displayName, requestedAt }]`
- Host receives real-time notification via WebSocket
- Host can approve (generates one-time token) or deny

#### 4. Frontend UI (Client)
- "Browse Active Rooms" button on room selection screen
- Active rooms modal with "Request to Join" buttons
- "Share" button inside rooms (generates invite link + QR code)
- Join request notifications for hosts
- URL parameter handling: `?room=ROOM2&invite=abc123xyz`

## Data Structures

### Extended RoomState (TypeScript)

```typescript
type RoomState = {
  roomId: string;
  hostClientId?: string;
  members: Record<string, Member>;
  activity?: Activity;
  promotedOptions: JsonObject[];
  updatedAt: number;

  // NEW: Invite system
  inviteTokens: InviteToken[];
  joinRequests: JoinRequest[];
};

type InviteToken = {
  token: string;           // 16-char crypto random
  createdBy: string;       // clientId who generated it
  createdAt: number;       // timestamp
  expiresAt?: number;      // optional expiration
};

type JoinRequest = {
  clientId: string;        // requester's clientId
  displayName: string;     // requester's name
  avatar: string;          // requester's emoji
  requestedAt: number;     // timestamp
};
```

### RoomRegistry State

```typescript
type RegistryState = {
  rooms: Record<string, RoomInfo>;  // roomId → info
  updatedAt: number;
};

type RoomInfo = {
  roomId: string;
  onlineCount: number;
  hostName: string;         // displayName of host
  lastUpdated: number;
};
```

## API Changes

### New HTTP Endpoint

```
GET /api/rooms/list

Response:
{
  rooms: [
    { roomId: "ROOM1", onlineCount: 3, hostName: "Alice" },
    { roomId: "ROOM2", onlineCount: 1, hostName: "Bob" }
  ]
}
```

### New WebSocket Messages (Client → Server)

```typescript
// Generate invite token
{ v: 1, t: "generate_invite" }

// Request to join room (sent before connecting)
{ v: 1, t: "request_join", roomId: string, clientId: string, displayName: string, avatar: string }

// Approve join request (host only)
{ v: 1, t: "approve_join", requesterId: string }

// Deny join request (host only)
{ v: 1, t: "deny_join", requesterId: string }

// Modified hello: include invite token
{ v: 1, t: "hello", invite?: string, ... }
```

### New WebSocket Messages (Server → Client)

```typescript
// Invite token generated
{ v: 1, t: "invite_generated", token: string, url: string }

// Join request received (broadcast to all in room)
{ v: 1, t: "join_request", request: JoinRequest }

// Join request approved (sent to requester)
{ v: 1, t: "join_approved", roomId: string, inviteToken: string }

// Join request denied (sent to requester)
{ v: 1, t: "join_denied", roomId: string, reason?: string }

// Error: needs invite to join
{ v: 1, t: "error", code: "needs_invite", message: "This room requires an invite." }
```

## Security & Best Practices

### 1. Token Generation
- Use `crypto.randomUUID()` for cryptographic randomness
- 16-character alphanumeric tokens
- Store creation timestamp and creator ID

### 2. Input Validation (Server-side)
```typescript
// Validate all inputs
roomId: /^[A-Z0-9_-]{3,16}$/
inviteToken: /^[a-zA-Z0-9]{16}$/
displayName: 1-50 chars, sanitize HTML
clientId: 1-64 chars, alphanumeric + dash/underscore
```

### 3. Rate Limiting
- Max 5 join requests per clientId per hour
- Max 10 invite tokens per room per hour
- Track timestamps in room state

### 4. Token Expiration (Optional)
- Tokens expire after 24 hours
- Clean up expired tokens periodically

### 5. XSS Prevention
- Sanitize all user-provided display names
- Use `textContent` instead of `innerHTML` for user data
- Escape special characters in URLs

### 6. Authorization Checks
- Only host can approve/deny join requests
- Verify host status before processing approval
- Validate requester exists before approval

## UI Components

### 1. Browse Active Rooms Modal

```
┌─────────────────────────────────────┐
│ 🔍 Active Rooms                     │
│                                     │
│ 🟢 ROOM1                            │
│    3 people online · Host: Alice   │
│    [Request to Join]                │
│                                     │
│ 🟢 COFFEE-BREAK                     │
│    5 people online · Host: Bob     │
│    [Request to Join]                │
│                                     │
│ [Close]                             │
└─────────────────────────────────────┘
```

### 2. Invite Share Modal (Inside Room)

```
┌─────────────────────────────────────┐
│ 📤 Invite Friends to ROOM2          │
│                                     │
│ Share this link:                    │
│ ┌─────────────────────────────┐    │
│ │ https://breakpoint.app/     │ 📋 │
│ │ ?room=ROOM2&invite=abc123   │    │
│ └─────────────────────────────┘    │
│                                     │
│ Or scan QR code:                    │
│ ┌─────────────────┐                │
│ │  ███  ██ ▄  ███ │                │
│ │  ███ ▀▄█ ██ ███ │                │
│ │  █▀█▀ ▄ ▀█▄ █▀█ │                │
│ └─────────────────┘                │
│                                     │
│ [Close]                             │
└─────────────────────────────────────┘
```

### 3. Join Request Notification (For Host)

```
┌─────────────────────────────────────┐
│ 🔔 Alice 😊 wants to join           │
│ [Approve] [Deny]                    │
└─────────────────────────────────────┘
```

### 4. Waiting for Approval (For Requester)

```
⏳ Waiting for approval to join ROOM2...
```

### 5. Join Denied Message

```
❌ Your request to join ROOM2 was denied
```

## Implementation Steps

### Phase 1: Backend - Room Registry
1. Create `RoomRegistry` Durable Object class
2. Add `reportRoom()`, `removeRoom()`, `listActiveRooms()` methods
3. Add `GET /api/rooms/list` endpoint
4. Modify `BreakPointRoom` to report to registry on join/leave

### Phase 2: Backend - Invite Tokens
1. Add `inviteTokens` array to `RoomState`
2. Implement `generateInviteToken()` helper (crypto random)
3. Add `onGenerateInvite()` message handler
4. Modify `onHello()` to validate invite tokens
5. Add error response for missing invite

### Phase 3: Backend - Join Requests
1. Add `joinRequests` array to `RoomState`
2. Add `onRequestJoin()` message handler (stores request, broadcasts)
3. Add `onApproveJoin()` message handler (generates one-time token)
4. Add `onDenyJoin()` message handler (removes request)
5. Add authorization checks (only host can approve/deny)

### Phase 4: Frontend - Active Rooms Browser
1. Add "Browse Active Rooms" button to room selection view
2. Implement `fetchActiveRooms()` function (calls API)
3. Create active rooms modal HTML template
4. Implement `showActiveRoomsModal()` function
5. Add click handlers for "Request to Join" buttons

### Phase 5: Frontend - Invite Links & QR
1. Add QR code library (CDN or npm)
2. Add "Share" button to lobby view (inside room)
3. Implement `generateInviteLink()` function (sends WebSocket message)
4. Create invite share modal HTML template
5. Implement QR code generation
6. Add copy-to-clipboard functionality

### Phase 6: Frontend - Join Request Flow
1. Implement `requestJoinRoom()` function
2. Add WebSocket listener for `join_request` events
3. Create join request notification template
4. Add approve/deny button handlers
5. Add WebSocket listener for `join_approved` events
6. Handle auto-join after approval
7. Add error handling for `join_denied`

### Phase 7: Frontend - URL Parameter Handling
1. Add URL parsing on page load
2. Extract `room` and `invite` parameters
3. Auto-join room if invite token present
4. Show error if invalid invite

### Phase 8: Testing & Polish
1. Test full join request flow
2. Test invite link flow
3. Test QR code scanning
4. Test rate limiting
5. Test token expiration
6. Add loading states and error messages
7. Test multi-browser scenarios

## File Changes Summary

### Backend (worker/src/index.ts)
- Add `RoomRegistry` Durable Object class
- Add `InviteToken` and `JoinRequest` types
- Extend `RoomState` interface
- Add `GET /api/rooms/list` endpoint
- Add message handlers: `onGenerateInvite`, `onRequestJoin`, `onApproveJoin`, `onDenyJoin`
- Modify `onHello` to validate invite tokens
- Add registry reporting on member join/leave

### Frontend (js/app.js)
- Add `fetchActiveRooms()` function
- Add `showActiveRoomsModal()` function
- Add `requestJoinRoom()` function
- Add `generateInviteLink()` function
- Add WebSocket event listeners: `join_request`, `invite_generated`, `join_approved`, `join_denied`
- Add URL parameter parsing on page load
- Add approve/deny handlers for host

### Frontend (index.html)
- Add "Browse Active Rooms" button
- Add active rooms modal template
- Add invite share modal template
- Add join request notification template

### New Frontend File (js/utils/qrcode.js)
- QR code generation utility
- Use library like `qrcode-generator` or `qrcodejs`

## Success Criteria

- ✅ Users can browse all active rooms
- ✅ Users can request to join private rooms
- ✅ Hosts receive real-time join request notifications
- ✅ Hosts can approve or deny requests
- ✅ Anyone in a room can generate invite links
- ✅ Invite links include QR codes for mobile
- ✅ Invite links bypass the request flow
- ✅ All tokens are cryptographically secure
- ✅ Input validation prevents abuse
- ✅ Rate limiting prevents spam
- ✅ Join notifications appear in all connected browsers

## Future Enhancements

- Token expiration and cleanup
- Invite link usage tracking (single-use tokens)
- Block list (hosts can ban specific users)
- Room visibility settings (public vs unlisted)
- Invite link customization (custom URLs)
- Push notifications for join requests
