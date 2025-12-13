# Quick Testing Guide - BreakPoint

Your local IP: **10.0.0.1**

---

## 🚀 Start Testing NOW (2 Steps)

### Step 1: Start the Server
```bash
cd /Users/kerenlint/Projects/MyProjects/BreakPoint
python3 -m http.server 8000
```

### Step 2: Open These URLs

**On Your Computer:**
```
http://localhost:8000
```

**On Your Phone (same WiFi):**
```
http://10.0.0.1:8000
```

**On Other Computers (same WiFi):**
```
http://10.0.0.1:8000
```

---

## 🎮 Test Custom Voting (3 Minutes)

### Window 1 (Your Computer):
1. Open `http://localhost:8000`
2. Click **Team Lunch** → **Team Poll**
3. Type "Shawarma King" in the input box
4. Click **Add**
5. Vote for "Shawarma King" (click on it)

### Window 2 (Your Phone or Another Browser):
1. Open `http://10.0.0.1:8000`
2. Click **Team Lunch** → **Team Poll**
3. Add "Ramen Bar"
4. Vote for "Ramen Bar"

### Back to Window 1:
1. Click **See Winner**
2. The winner will be added to:
   - 🎡 Food Wheel (Spin the Wheel)
   - 🃏 Swipe Cards (Swipe to Vote)

### Verify It Works:
1. Go to **Team Lunch** → **Spin the Wheel**
2. Click **SPIN IT!**
3. Look for the winner option on the wheel!
4. Go to **Team Lunch** → **Swipe to Vote**
5. Swipe through cards - you'll see the winner as a green card!

---

## 📱 Quick Mobile Test

1. **On your phone**, connect to the same WiFi as your computer
2. Open Safari or Chrome
3. Go to: `http://10.0.0.1:8000`
4. Try all the features:
   - Tap "Quick Coffee" → Spin the wheel
   - Tap "Team Lunch" → "Team Poll" → Add custom option
   - Swipe cards with touch gestures

---

## 🐛 If It Doesn't Work

### "Site can't be reached" on phone:
1. Make sure phone is on **same WiFi** as computer
2. Check firewall isn't blocking port 8000
3. Try: `http://10.0.0.1:8000` (use exact IP)

### Buttons don't work:
1. Hard refresh: Hold Shift and click Reload
2. Or press: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)

### Custom options don't appear:
1. Check browser console (press F12)
2. Look for any error messages
3. Try refreshing the page

---

## ✅ What Should Work

- ✅ Add custom restaurant options
- ✅ Vote on custom options
- ✅ Winner automatically added to Food Wheel
- ✅ Winner automatically added to Swipe Cards
- ✅ Custom options persist in poll (don't disappear after winning)
- ✅ Multiple users can test simultaneously
- ✅ Works on desktop, mobile, tablet

---

## 🎯 Test Scenarios

### Scenario 1: Simple Custom Vote
1. Add "Falafel House"
2. Vote for it 3 times
3. Click "See Winner"
4. ✅ Should add to wheel and cards

### Scenario 2: Multiple Custom Options
1. Add "Ramen Bar"
2. Add "BBQ Spot"
3. Add "Vegan Cafe"
4. Vote on different ones
5. Click "See Winner"
6. ✅ Winner should be added to wheel/cards

### Scenario 3: Duplicate Detection
1. Try adding "Pizza Palace" (already exists)
2. ✅ Should show: "This option already exists!"

### Scenario 4: Persistence Test
1. Add custom option and make it win
2. After winner announced, check poll
3. ✅ Custom option should still be in the poll
4. ✅ Can vote on it again in next round

---

**Ready? Start the server and test now!** 🚀

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000` or `http://10.0.0.1:8000`
