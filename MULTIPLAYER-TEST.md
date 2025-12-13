# BreakPoint Multiplayer Testing Guide

How to test your app with multiple users (friends, family, coworkers)!

---

## 🎮 **Method 1: Multiple Browser Windows (Easiest!)**

Perfect for quick testing on your own computer.

### **Step 1: Start the Server**

```bash
python3 -m http.server 8000
```

### **Step 2: Open Multiple Windows**

1. Open your browser (Chrome, Firefox, Safari, etc.)
2. Go to `http://localhost:8000`
3. **Open a NEW WINDOW** (not a tab!)
   - Mac: `Cmd+N`
   - Windows: `Ctrl+N`
4. In the new window, go to `http://localhost:8000` again
5. Repeat 2-3 more times!

**You now have 3-5 "users"!** 👥

### **Step 3: Test Custom Voting**

**Window 1 (Alice):**
1. Go to Team Lunch → Team Poll
2. Add "Ramen Bar"
3. Vote for "Ramen Bar"

**Window 2 (Bob):**
1. Go to Team Lunch → Team Poll
2. You should see "Ramen Bar" with 1 vote already!
3. Add "Shawarma King"
4. Vote for "Shawarma King"

**Window 3 (Charlie):**
1. Go to Team Lunch → Team Poll
2. You should see both custom options!
3. Vote for "Ramen Bar"

**Window 1 (Alice):**
1. Click "See Winner"
2. Ramen Bar wins! ✨

**All Windows:**
1. Go to Spin the Wheel → "Ramen Bar" is now on the wheel!
2. Go to Swipe to Vote → "Ramen Bar" card appears!

---

## 🌐 **Method 2: Local Network (Real Multiplayer!)**

Test with friends in the same room or on the same WiFi.

### **Step 1: Find Your Computer's IP Address**

**On Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**On Windows:**
```bash
ipconfig
```

**Look for something like:**
- `192.168.1.100` (home network)
- `10.0.0.50` (office network)

Let's say your IP is: `192.168.1.100`

### **Step 2: Start the Server**

```bash
python3 -m http.server 8000
```

### **Step 3: Share the URL**

Tell your friends to open:
```
http://192.168.1.100:8000
```

**Everyone on the same WiFi can now access your app!** 🎉

### **Step 4: Test Together**

**Person 1 (You):**
1. Team Lunch → Team Poll
2. Add "Falafel House"
3. Vote for it

**Person 2 (Friend #1):**
1. Team Lunch → Team Poll
2. Should see "Falafel House" already there
3. Add "Pho Restaurant"
4. Vote for "Pho Restaurant"

**Person 3 (Friend #2):**
1. Team Lunch → Team Poll
2. Should see both custom options
3. Vote for "Falafel House"

**Person 1:**
1. Click "See Winner"
2. "Falafel House" wins! 🎊

**Everyone:**
- Try spinning the wheel → "Falafel House" appears!
- Try swiping cards → "Falafel House" card shows up!

---

## 📱 **Method 3: Mobile + Desktop**

Test on your phone and computer together!

### **Step 1: Get Your IP** (see Method 2)

Example: `192.168.1.100`

### **Step 2: Start Server**

```bash
python3 -m http.server 8000
```

### **Step 3: On Your Phone**

1. Make sure phone is on **same WiFi** as your computer
2. Open Safari/Chrome on phone
3. Go to: `http://192.168.1.100:8000`
4. Bookmark it! 📱

### **Step 4: Test Cross-Device**

**On Desktop:**
- Add custom option "Burger Haven"
- Vote for it

**On Phone:**
- Open Team Poll
- "Burger Haven" should appear!
- Add another option "Taco Place"
- Vote for it

**Both devices:**
- Check the vote counts update
- See winner
- Custom options appear on wheels/cards

---

## 🚀 **Method 4: Deploy for Real (FREE!)**

Share with anyone, anywhere in the world!

### **Quick Deploy to Cloudflare Pages:**

1. **Sign up:** https://dash.cloudflare.com/sign-up (FREE!)

2. **Deploy:**
   - Go to Pages → Create a project
   - Upload your project folder
   - Wait 2 minutes
   - Get a URL like: `https://breakpoint.pages.dev`

3. **Share:**
   - Send link to friends
   - They can access from anywhere!
   - No server needed on your computer

**Full guide:** [SETUP.md](SETUP.md)

---

## 🧪 **What to Test**

### **Test 1: Collaborative Voting**

- [ ] Person A adds custom option
- [ ] Person B sees it immediately
- [ ] Person B adds another custom option
- [ ] Person A sees Person B's option
- [ ] Both vote
- [ ] Vote counts update correctly
- [ ] Winner is correct

### **Test 2: Custom Options Persist**

- [ ] Add custom option "Test Restaurant"
- [ ] Make it win
- [ ] Custom option stays in poll
- [ ] Can vote on it again in next round
- [ ] Appears on Food Wheel
- [ ] Appears in Swipe Cards

### **Test 3: Duplicate Detection**

- [ ] Person A adds "Ramen Bar"
- [ ] Person B tries to add "ramen bar" (lowercase)
- [ ] Should show: "This option already exists!"
- [ ] Person B tries "RAMEN BAR" (uppercase)
- [ ] Should also be rejected

### **Test 4: Cross-Device Features**

- [ ] Spin wheel on desktop → see result
- [ ] Spin wheel on mobile → see result
- [ ] Swipe cards on mobile → touch works
- [ ] Swipe cards on desktop → mouse works
- [ ] Poll voting on all devices

---

## 🎯 **Test Scenarios**

### **Scenario 1: Office Lunch Decision**

**Setup:** 5 people, same WiFi

1. **Person 1:** Creates poll, adds "New Thai Place"
2. **Person 2:** Adds "BBQ Spot"
3. **Person 3:** Adds "Vegan Cafe"
4. **Everyone:** Votes on their favorite
5. **Person 1:** Clicks "See Winner"
6. **Winner:** Gets added to wheels/cards
7. **Next time:** Winner option is available again

### **Scenario 2: Remote Team**

**Setup:** Deploy to Cloudflare Pages

1. **Team Lead:** Shares link via Slack
2. **Everyone:** Opens link on their devices
3. **Team members:** Add local restaurant suggestions
4. **Everyone:** Votes
5. **Winner:** Added to company's favorite spots
6. **Future polls:** Can vote on winners again

### **Scenario 3: Mobile-First**

**Setup:** Test on phones only

1. **User 1:** Opens on iPhone
2. **User 2:** Opens on Android
3. **Both:** Add custom options via touch keyboard
4. **Both:** Swipe cards (test touch gestures)
5. **Both:** Spin wheels (test touch on canvas)
6. **Verify:** All interactions work smoothly

---

## 🔍 **Debugging Tips**

### **Can't connect from other devices?**

**Check:**
1. Is server running? (`python3 -m http.server 8000`)
2. Are you on the same WiFi?
3. Is firewall blocking? (Try turning it off temporarily)
4. Using correct IP? (Not 127.0.0.1, use 192.168.x.x)

**Mac Firewall:**
```bash
# Allow Python through firewall
System Preferences → Security & Privacy → Firewall → Firewall Options → Add python3
```

### **Custom options not appearing?**

**Check:**
1. Open Console (F12) for errors
2. Hard refresh: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
3. Clear cache and reload
4. Make sure all devices use the same URL

### **Votes not syncing?**

**Current behavior:** In local mode, each browser window is independent

**To enable real-time sync:**
1. Start the Worker backend (see below)
2. All votes will sync automatically!

---

## 🌐 **Enable Real-Time Sync (Optional)**

Want votes to sync in real-time across all users?

### **Quick Setup:**

```bash
# 1. Install Worker dependencies
cd worker
npm install

# 2. Start Worker backend
npm run dev

# 3. Backend runs on localhost:8787
# 4. Frontend automatically connects!
```

Now when **Person A** votes, **Person B** sees it instantly! ⚡

**Full backend guide:** [SETUP.md](SETUP.md)

---

## 📊 **Expected Behavior**

### **Without Backend (Current):**
- ✅ Each user can add custom options
- ✅ Each user votes independently
- ✅ Custom winners add to wheels/cards **per user**
- ✅ Perfect for demos and local testing

### **With Backend (Real-Time):**
- ✅ All users see same custom options
- ✅ Votes sync in real-time
- ✅ One winner for everyone
- ✅ Custom winners add to wheels/cards **for all users**
- ✅ Production-ready multiplayer

---

## 🎉 **Testing Checklist**

Before declaring success, test:

- [ ] **Multiple browsers** - Chrome, Firefox, Safari
- [ ] **Multiple windows** - 3+ windows same browser
- [ ] **Mobile devices** - iPhone, Android
- [ ] **Desktop + Mobile** - Cross-device
- [ ] **Different WiFi networks** - Test connectivity
- [ ] **Custom options** - Add, vote, win
- [ ] **Persistence** - Winners stay in poll
- [ ] **Wheel integration** - Custom on Food Wheel
- [ ] **Card integration** - Custom in Swipe Cards
- [ ] **All voting modes** - Poll, Swipe, Wheels
- [ ] **Error handling** - Duplicates, empty inputs

---

## 💡 **Pro Tips**

1. **Use Private/Incognito windows** - Each window = different user
2. **Bookmark the IP URL** - Faster access from phone
3. **Test with real people** - Way more fun than solo!
4. **Take screenshots** - Document the multiplayer experience
5. **Share your URL** - Let friends try it out

---

## 🚀 **Next Steps**

Once local multiplayer testing works:

1. ✅ **Deploy backend** - Enable real-time sync ([SETUP.md](SETUP.md))
2. ✅ **Deploy frontend** - Make it public ([README.md](README.md))
3. ✅ **Share with team** - Get real user feedback
4. ✅ **Add more features** - Check [TODO.md](TODO.md)

---

**Ready to test? Start with Method 1 (Multiple Windows) - it's the easiest!** 🎮

*Questions? Open browser console (F12) - helpful debug messages are logged!*
