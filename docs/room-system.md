# Room System Documentation

## Overview

BreakPoint uses a three-tier room access system:

1. **Public Directory** - Browse all active rooms
2. **Request-to-Join** - Social approval flow for joining rooms
3. **Invite Links** - Direct access via shareable links/QR codes

## For Users

### Joining a Room

**Option 1: Request to Join**
1. Click "Browse Active Rooms"
2. Select a room from the list
3. Click "Request to Join"
4. Wait for host approval
5. You'll auto-join when approved

**Option 2: Invite Link**
1. Get an invite link from someone in the room
2. Click the link or scan QR code
3. You'll auto-join immediately

### Sharing Your Room

As a member of a room:
1. Click "Share Room" button
2. Copy the invite link or show the QR code
3. Anyone with this link can join directly

### As a Host

When someone requests to join your room:
1. You'll see a notification in the lobby
2. Click "Approve" to let them in
3. Click "Deny" to reject the request

## Technical Details

### Architecture

**Room Registry**
- Singleton Durable Object tracks all active rooms
- Updates when members join/leave
- Auto-removes empty rooms
- Cleanup interval: 5 minutes (stale rooms removed)

**Invite Tokens**
- 16-character cryptographically secure tokens
- Generated via `crypto.randomUUID()`
- Optional expiration (default: no expiry, one-time tokens expire in 5 min)
- Rate limited: 10 per room per hour

**Join Requests**
- Stored in room state
- Broadcast to all members
- Rate limited: 5 per user per hour
- Duplicate detection prevents spam

### API Endpoints

**GET /api/rooms/list**
- Returns array of active rooms
- Each room includes: roomId, onlineCount, hostName
- CORS enabled for frontend access
- Automatically cleans up stale rooms (not updated in 5 minutes)

**Response Format:**
```json
{
  "rooms": [
    {
      "roomId": "ROOM1",
      "onlineCount": 3,
      "hostName": "Alice",
      "lastUpdated": 1702656000000
    }
  ]
}
```

### WebSocket Messages

**Client → Server**
- `generate_invite` - Request new invite token
- `request_join` - Request to join room
- `approve_join` - Approve pending request (host only)
- `deny_join` - Deny pending request (host only)
- `hello` (modified) - Now accepts optional `invite` parameter

**Server → Client**
- `invite_generated` - New token created (includes URL)
- `join_request` - New join request pending
- `join_approved` - Request approved with token
- `join_denied` - Request denied
- `needs_invite` error - Room requires invite
- `invalid_invite` error - Token not found/expired

### Message Examples

**Generate Invite (Client → Server):**
```json
{
  "v": 1,
  "t": "generate_invite"
}
```

**Invite Generated (Server → Client):**
```json
{
  "v": 1,
  "t": "invite_generated",
  "token": "abc123xyz7890def",
  "url": "http://localhost:8000/?room=ROOM1&invite=abc123xyz7890def"
}
```

**Request Join (Client → Server):**
```json
{
  "v": 1,
  "t": "request_join",
  "roomId": "ROOM1",
  "clientId": "user-123",
  "displayName": "Bob",
  "avatar": "😊"
}
```

**Join Request Notification (Server → Client):**
```json
{
  "v": 1,
  "t": "join_request",
  "request": {
    "clientId": "user-123",
    "displayName": "Bob",
    "avatar": "😊",
    "requestedAt": 1702656123456
  }
}
```

**Approve Join (Client → Server - Host only):**
```json
{
  "v": 1,
  "t": "approve_join",
  "requesterId": "user-123"
}
```

**Join Approved (Server → Client):**
```json
{
  "v": 1,
  "t": "join_approved",
  "roomId": "ROOM1",
  "inviteToken": "xyz789abc1234def"
}
```

**Hello with Invite (Client → Server):**
```json
{
  "v": 1,
  "t": "hello",
  "clientId": "user-456",
  "displayName": "Charlie",
  "avatar": "🎉",
  "busy": false,
  "invite": "abc123xyz7890def"
}
```

### Security

**Token Generation**
- Uses `crypto.randomUUID()` for secure randomness
- 16 alphanumeric characters
- Validated server-side with regex: `/^[a-zA-Z0-9]{16}$/`
- Tokens are single-use when generated for approval (5-minute expiry)

**Input Validation**
- Room IDs: `/^[A-Z0-9_-]{3,16}$/`
- Invite tokens: `/^[a-zA-Z0-9]{16}$/`
- Display names: 1-50 chars, HTML escaped on frontend
- Client IDs: 1-64 chars, alphanumeric + underscore + dash
- Avatars: 1-8 chars (emoji support)

**Rate Limiting**
| Action | Limit | Window |
|--------|-------|--------|
| Generate invite | 10 per room | 1 hour |
| Request join | 5 per user | 1 hour |

**Authorization**
- Only host can approve/deny requests
- Verified server-side before processing
- Invite tokens bypass host approval
- Host is first member to join room

**CORS Configuration**
- Allowed origins configured via `ALLOWED_ORIGINS` env var
- Default: `http://localhost:8000,http://localhost:3000`
- Production: Set to actual domain(s)

### State Management

**RoomState Type:**
```typescript
type RoomState = {
  roomId: string;
  hostClientId?: string;
  members: Record<string, Member>;
  activity?: Activity;
  promotedOptions: JsonObject[];
  updatedAt: number;

  // Invite system
  inviteTokens: InviteToken[];
  joinRequests: JoinRequest[];
};
```

**InviteToken Type:**
```typescript
type InviteToken = {
  token: string;           // 16-char crypto random
  createdBy: string;       // clientId who generated it
  createdAt: number;       // timestamp ms
  expiresAt?: number;      // optional expiration
};
```

**JoinRequest Type:**
```typescript
type JoinRequest = {
  clientId: string;        // requester's clientId
  displayName: string;     // requester's name
  avatar: string;          // requester's emoji
  requestedAt: number;     // timestamp ms
};
```

**RoomInfo Type (Registry):**
```typescript
type RoomInfo = {
  roomId: string;
  onlineCount: number;
  hostName: string;
  lastUpdated: number;
};
```

### Data Flow

**Browse & Request Flow:**
```
1. User clicks "Browse Active Rooms"
   → Frontend: GET /api/rooms/list
   → Registry: Returns active rooms

2. User clicks "Request to Join"
   → Frontend: Opens WebSocket to room
   → Sends request_join message
   → Backend: Stores request, broadcasts to members

3. Host sees notification
   → Clicks "Approve"
   → Frontend: Sends approve_join message
   → Backend: Generates one-time token, broadcasts join_approved

4. Requester receives join_approved
   → Frontend: Auto-reconnects with invite token
   → Backend: Validates token, adds to room
```

**Invite Link Flow:**
```
1. User clicks "Share Room"
   → Frontend: Sends generate_invite message
   → Backend: Creates token, returns URL

2. Frontend displays:
   → Link with token in URL params
   → QR code encoding the full URL

3. Recipient opens link
   → URL params: ?room=ROOM1&invite=abc123
   → Frontend: Parses params, auto-joins room
   → Sends hello with invite parameter
   → Backend: Validates token, adds to room
```

**Registry Reporting Flow:**
```
1. Member joins room (onHello)
   → Backend: Calls reportToRegistry()
   → Registry: Updates room info

2. Member leaves room (webSocketClose)
   → Backend: Calls reportToRegistry()
   → Registry: Updates or removes room

3. Frontend requests list
   → Registry: Cleans stale rooms (>5 min)
   → Returns fresh room list
```

## Error Handling

**Error Codes:**

| Code | When | User Action |
|------|------|-------------|
| `needs_invite` | Joining room without invite/membership | Get invite link or request to join |
| `invalid_invite` | Token not found | Request new invite link |
| `invite_expired` | Token past expiration | Request new invite link |
| `bad_invite` | Invalid token format | Check link and try again |
| `rate_limit` | Too many requests | Wait and try again later |
| `duplicate_request` | Already have pending request | Wait for host approval |
| `not_host` | Non-host tries to approve/deny | Only host can manage requests |
| `request_not_found` | Request already processed | Request may have been handled |

**Frontend Error Display:**
- `needs_invite` → Alert: "This room requires an invite to join"
- `invalid_invite` → Alert: "Invalid or expired invite link"
- `join_denied` → Alert: "Your request to join was denied by the host"
- All errors → Return to room selection view

## Frontend Integration

**Required Files:**
- `js/utils/qrcode.js` - QR code generation utility
- `js/app.js` - Main application logic
- `js/utils/BreakPointRealtime.js` - WebSocket client

**Key Functions:**
- `fetchActiveRooms()` - Get room list from API
- `showActiveRoomsModal()` - Display browse UI
- `requestJoinRoom(roomId)` - Send join request
- `generateInviteLink()` - Create shareable link
- `showJoinRequestNotification(request)` - Display host notification
- `approveJoinRequest(requesterId)` - Host approves request
- `denyJoinRequest(requesterId)` - Host denies request
- `handleInviteLink()` - Parse URL params for auto-join

**Event Listeners:**
- `invite_generated` - Invite token created
- `join_request` - New request received (host)
- `join_approved` - Request approved (requester)
- `join_denied` - Request denied (requester)
- `error` - Handle invite/auth errors

## Testing

### Manual Testing Steps

**Test 1: Browse & Request Flow**
1. Browser A: Create room ROOM1
2. Browser B: Click "Browse Active Rooms"
3. Verify: ROOM1 appears in list
4. Browser B: Click "Request to Join"
5. Browser A: See notification
6. Browser A: Click "Approve"
7. Browser B: Should auto-join room
8. Verify: Both users see each other in room

**Test 2: Invite Link Flow**
1. Browser A: In ROOM1, click "Share Room"
2. Verify: See invite link and QR code
3. Browser A: Copy invite link
4. Browser C: Paste link in address bar
5. Verify: Auto-joins room immediately
6. Verify: No approval needed

**Test 3: Error Cases**
1. Browser D: Try joining room without invite
   - Verify: See "needs invite" error
2. Browser D: Use invalid token
   - Verify: See "invalid invite" error
3. Browser B: Request join twice
   - Verify: See "duplicate request" error

**Test 4: Registry Cleanup**
1. All browsers: Leave room
2. Wait 5+ minutes
3. GET /api/rooms/list
4. Verify: Room removed from registry

### Automated Testing

Currently requires manual browser testing. Future improvements:
- Playwright/Puppeteer tests for full flow
- WebSocket integration tests
- Rate limiting verification
- Token expiration tests

## Performance Considerations

**Registry Performance:**
- Single Durable Object for all rooms (global registry)
- Acceptable for up to ~10,000 active rooms
- For larger scale: Shard by geographic region

**Room Performance:**
- Each room is separate Durable Object
- Scales independently
- No cross-room communication overhead

**Token Storage:**
- Tokens stored in room state
- Cleanup on expiration check (lazy)
- Consider periodic cleanup for very active rooms

## Future Enhancements

### Short-term:
- [ ] Push notifications for join requests (Web Push API)
- [ ] Token expiration settings UI
- [ ] Revoke specific invite links
- [ ] Room visibility settings (public/unlisted)

### Medium-term:
- [ ] Block list for banned users
- [ ] Invite usage analytics
- [ ] Room capacity limits
- [ ] Multi-host support (co-hosts)

### Long-term:
- [ ] Room categories/tags
- [ ] Search and filter rooms
- [ ] Room discovery by interests
- [ ] Scheduled rooms (calendar integration)

## Troubleshooting

**Problem: Rooms not appearing in list**
- Check: Is frontend using correct API URL?
- Check: Are CORS headers properly set?
- Check: Has room been active in last 5 minutes?

**Problem: Invite link not working**
- Check: Token format (16 alphanumeric chars)
- Check: Token exists in room state
- Check: Token not expired (if has expiresAt)
- Check: URL parameters correctly formatted

**Problem: Join requests not showing for host**
- Check: Is user actually the host?
- Check: WebSocket connection established?
- Check: Event listener registered for join_request?

**Problem: "Forbidden origin" error**
- Check: ALLOWED_ORIGINS environment variable
- Check: Origin header matches allowed list
- Development: Should include localhost:8000

## Support

For issues or questions:
1. Check this documentation
2. Review testing report: `docs/testing-report-2025-12-15.md`
3. Check implementation plan: `docs/plans/2025-12-15-room-discovery-invites-implementation.md`
4. Review code comments in `worker/src/index.ts`
