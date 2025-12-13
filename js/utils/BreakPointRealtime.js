/**
 * BreakPointRealtime
 * WebSocket client for real-time multiplayer rooms with Cloudflare Durable Objects
 *
 * Usage:
 *   const rt = new BreakPointRealtime({
 *     apiBaseUrl: "http://localhost:8787",
 *     roomId: "ABC12345",
 *     profile: { clientId: "user123", displayName: "Alice", avatar: "👩", busy: false }
 *   });
 *
 *   rt.addEventListener("state", (e) => console.log("Room state:", e.detail.state));
 *   rt.addEventListener("member_upsert", (e) => console.log("Member joined:", e.detail.member));
 *   await rt.connect();
 */

export class BreakPointRealtime extends EventTarget {
  #apiBaseUrl;
  #roomId;
  #profile;
  #ws = null;
  #closedByUser = false;
  #retry = 0;

  constructor({ apiBaseUrl, roomId, profile }) {
    super();
    if (!apiBaseUrl) throw new Error("apiBaseUrl required");
    if (!roomId) throw new Error("roomId required");
    if (!profile?.clientId) throw new Error("profile.clientId required");
    this.#apiBaseUrl = apiBaseUrl.replace(/\/+$/, "");
    this.#roomId = roomId;
    this.#profile = profile;
  }

  /**
   * Connect to the room and start listening for events
   */
  async connect() {
    this.#closedByUser = false;
    await this.#connectInternal();
  }

  /**
   * Close connection (user initiated)
   */
  close() {
    this.#closedByUser = true;
    if (this.#ws) {
      try { this.#ws.close(1000, "client_close"); } catch { }
    }
  }

  /**
   * Send a message to the server
   * @param {object} msg - Message object with { v: 1, t: "type", ...data }
   * @returns {boolean} - True if sent successfully
   */
  send(msg) {
    if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) return false;
    this.#ws.send(JSON.stringify(msg));
    return true;
  }

  /**
   * Create a new room (returns roomId)
   * @returns {Promise<{roomId: string}>}
   */
  async createRoom() {
    const res = await fetch(`${this.#apiBaseUrl}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}"
    });
    if (!res.ok) throw new Error(`createRoom failed: ${res.status}`);
    return res.json();
  }

  /**
   * Send "set_busy" message
   * @param {boolean} busy
   */
  setBusy(busy) {
    return this.send({ v: 1, t: "set_busy", busy });
  }

  /**
   * Start a new activity
   * @param {object} activity - { id, kind, status, createdBy, createdAt, payload }
   */
  startActivity(activity) {
    return this.send({ v: 1, t: "activity_start", activity });
  }

  /**
   * Update activity payload
   * @param {string} activityId
   * @param {object} patch - Partial payload to merge
   */
  updateActivity(activityId, patch) {
    return this.send({ v: 1, t: "activity_update", activityId, patch });
  }

  /**
   * Cast a vote
   * @param {string} activityId
   * @param {object} vote - Your vote data
   */
  vote(activityId, vote) {
    return this.send({ v: 1, t: "vote", activityId, vote });
  }

  /**
   * Add an option to the poll
   * @param {string} activityId
   * @param {object} option - { id, name, emoji, ... }
   */
  addPollOption(activityId, option) {
    return this.send({ v: 1, t: "add_poll_option", activityId, option });
  }

  /**
   * Request server-side spin (for wheel activities)
   * @param {string} activityId
   */
  spin(activityId) {
    return this.send({ v: 1, t: "spin", activityId });
  }

  /**
   * Close an activity
   * @param {string} activityId
   * @param {object} [result] - Optional final result
   */
  closeActivity(activityId, result) {
    return this.send({ v: 1, t: "activity_close", activityId, result });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  /**
   * Check if connected
   * @returns {boolean}
   */
  get isConnected() {
    return this.#ws && this.#ws.readyState === WebSocket.OPEN;
  }

  async #connectInternal() {
    const wsUrl = this.#toWsUrl(`${this.#apiBaseUrl}/api/rooms/${this.#roomId}/ws`);
    const ws = new WebSocket(wsUrl);
    this.#ws = ws;

    return new Promise((resolve, reject) => {
      const onOpen = () => {
        this.#retry = 0;
        this.dispatchEvent(new CustomEvent("open"));

        // Send hello message with profile
        ws.send(JSON.stringify({
          v: 1,
          t: "hello",
          clientId: this.#profile.clientId,
          displayName: this.#profile.displayName,
          avatar: this.#profile.avatar,
          busy: Boolean(this.#profile.busy)
        }));

        // Remove temp listeners to avoid duplicates if we kept them
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        resolve();
      };

      const onError = (e) => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        reject(new Error('WebSocket connection failed'));
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);

      // Persistent listeners
      ws.onmessage = (ev) => {
        if (typeof ev.data !== "string") return;
        if (ev.data === "pong") return;

        let msg;
        try { msg = JSON.parse(ev.data); } catch { return; }
        if (!msg || msg.v !== 1 || !msg.t) return;

        // Dispatch specific event type (e.g., "state", "member_upsert")
        this.dispatchEvent(new CustomEvent(msg.t, { detail: msg }));

        // Also dispatch generic "message" event
        this.dispatchEvent(new CustomEvent("message", { detail: msg }));
      };

      ws.onclose = () => {
        this.dispatchEvent(new CustomEvent("close"));
        if (!this.#closedByUser) this.#scheduleReconnect();
      };

      // Note: ws.onerror is also used by the promise rejector, but for later errors:
      // ws.onerror assignment overwrites addEventListener? No.
      // But for clarity, we don't assign ws.onerror here to avoid conflict with the reject logic during connect.
      // After connect, we can let onclose handle it, or just rely on onmessage/onclose.
    });
  }

  #scheduleReconnect() {
    this.#retry = Math.min(this.#retry + 1, 8);
    const backoffMs = Math.min(1000 * (2 ** this.#retry), 15000);
    setTimeout(() => {
      if (this.#closedByUser) return;
      this.#connectInternal().catch(() => this.#scheduleReconnect());
    }, backoffMs);
  }

  #toWsUrl(httpUrl) {
    const u = new URL(httpUrl);
    u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
    return u.toString();
  }
}

/**
 * Helper: Generate or retrieve stable clientId from localStorage
 * @returns {string}
 */
export function getOrCreateClientId() {
  const k = "bp_clientId";
  let v = localStorage.getItem(k);
  if (!v) {
    try {
      // Try using crypto.randomUUID first
      if (crypto && crypto.randomUUID) {
        v = crypto.randomUUID().replace(/-/g, "");
      } else {
        throw new Error('crypto.randomUUID not available');
      }
    } catch (err) {
      // Fallback for insecure contexts (http://IP) or older browsers
      console.log('Using fallback UUID generator');
      v = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    localStorage.setItem(k, v);
  }
  return v;
}
