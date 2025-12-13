# BreakPoint Quick Start Guide

Get your app running in 2 minutes and test the new custom voting feature!

---

## 🚀 **Start the App (Right Now!)**

### **Step 1: Check Server is Running**

Open your terminal and run:

```bash
# Make sure you're in the project directory
cd /Users/kerenlint/Projects/MyProjects/BreakPoint

# Start the server
python3 -m http.server 8000
```

You should see:
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

### **Step 2: Open in Browser**

Open your browser and go to:
```
http://localhost:8000
```

You should see the BreakPoint home screen! ✨

---

## 🎮 **Test Custom Voting (NEW!)**

### **Try It Now:**

1. Click **"Team Lunch"** (blue button)
2. Click **"Team Poll"** (purple button)
3. You'll see the poll screen with an **"Add Your Own Option"** box at the top
4. Type "**Shawarma King**" in the input field
5. Click **"Add"** or press **Enter**

**What happens:**
- ✅ "Shawarma King" appears in the poll with a purple **"Custom"** badge
- ✅ You can vote on it like any other option
- ✅ The vote counter updates in real-time

6. Click on "**Shawarma King**" to vote for it
7. Vote a few more times to make it win (or add more custom options!)
8. Click **"See Winner"** button at the bottom

**What happens:**
```
🎉 Winner: 🍽️ Shawarma King with 1 votes!
🏆 Custom option won! Adding "Shawarma King" to food options...
✅ Added "Shawarma King" to Food Wheel!
✅ Added "Shawarma King" to Swipe Cards!
✨ "Shawarma King" has been added to Food Wheel and Swipe Cards!
```

9. Click **OK** on all the alerts
10. Go back to **"Team Lunch"**
11. Click **"Spin the Wheel"**
12. Click **"SPIN IT!"**

**Look for "Shawarma King"** - it's now on the wheel! 🎡

13. Go back again and click **"Swipe to Vote"**
14. Swipe through the cards

**You'll see a green "Shawarma King" card!** 🃏

---

## 🎯 **What You Just Tested**

✅ **Custom option input** - Add any restaurant name
✅ **Duplicate detection** - Try adding "Pizza Palace" (it won't let you!)
✅ **Vote counting** - Real-time vote percentages
✅ **Custom badge** - Purple badge marks your additions
✅ **Winner detection** - Automatically finds the most voted option
✅ **Dynamic integration** - Winner added to Food Wheel
✅ **Card generation** - Winner added to Swipe Cards
✅ **Persistent options** - Custom option stays until reset

---

## 🧪 **More Tests to Try**

### **Test 1: Multiple Custom Options**

1. Go to Team Poll
2. Add "Ramen Bar"
3. Add "Falafel House"
4. Add "Pho Restaurant"
5. Vote on different ones
6. See percentages update
7. Check which one wins!

### **Test 2: Duplicate Detection**

1. Go to Team Poll
2. Type "pizza palace" (lowercase)
3. Click Add
4. ✅ Should show: "This option already exists!"

### **Test 3: Empty Input**

1. Go to Team Poll
2. Leave input blank
3. Click Add
4. ✅ Should show: "Please enter a restaurant name!"

### **Test 4: Enter Key**

1. Go to Team Poll
2. Type "Burger Haven"
3. Press **Enter** (don't click Add button)
4. ✅ Should add the option!

---

## 📱 **Test on Mobile**

1. Find your computer's local IP:
   ```bash
   # On Mac:
   ifconfig | grep "inet "

   # Look for something like: 192.168.1.100
   ```

2. On your phone's browser, go to:
   ```
   http://YOUR-IP:8000
   ```
   Example: `http://192.168.1.100:8000`

3. Try all the features on touch screen!

---

## 🎨 **Visual Guide**

### **What You'll See:**

```
┌────────────────────────────────────────┐
│ ← Team Poll                            │
├────────────────────────────────────────┤
│                                        │
│   Vote for Lunch!                      │
│   Tap your favorite or add your own   │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ + Add Your Own Option            │  │
│ ├──────────────────────────────────┤  │
│ │ [Ramen Bar____] [Add]            │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 🍕 Pizza Palace        40%       │  │
│ │ ████████                         │  │
│ │ 2 votes                          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 🍽️ Ramen Bar [Custom]  60%      │  │
│ │ ████████████                     │  │
│ │ 3 votes                          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [See Winner]                           │
└────────────────────────────────────────┘
```

---

## 🔧 **Troubleshooting**

### **"Connection Refused" Error**

**Problem:** Can't access localhost:8000

**Solution:**
```bash
# Stop the server (Ctrl+C)
# Start again
python3 -m http.server 8000
```

### **"Buttons Don't Work"**

**Problem:** Clicking buttons does nothing

**Solution:**
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Open Console (F12) and check for errors
3. Make sure all files are in the right place

### **"Custom Options Don't Appear"**

**Problem:** Added option doesn't show in poll

**Solution:**
1. Check browser console (F12) for errors
2. Make sure you clicked "Add" or pressed Enter
3. Try refreshing the page

---

## 🎉 **Next Steps**

Now that custom voting works, you can:

1. ✅ **Use it with your team** - Share the localhost URL
2. ✅ **Add Backend** - Follow [SETUP.md](SETUP.md) to enable real-time multiplayer
3. ✅ **Deploy** - Follow [README.md](README.md) to deploy for free on Cloudflare
4. ✅ **Customize** - Change colors, add more default options, etc.

---

## 📚 **Learn More**

- **[FEATURES.md](FEATURES.md)** - Complete feature documentation
- **[SETUP.md](SETUP.md)** - Backend setup guide
- **[README.md](README.md)** - Project overview
- **[TODO.md](TODO.md)** - What's next

---

**Enjoy your enhanced BreakPoint app! ☕🍕🎉**

*Have questions? Check the console (F12) for helpful debug messages!*
