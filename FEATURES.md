# BreakPoint Features Guide

Complete guide to all features including the new **Custom Option Voting** system!

---

## ✨ **NEW: Custom Option Voting**

### What It Does

Users can now add their own restaurant options during Team Poll voting. If a custom option wins, it's automatically added to:
- 🎡 **Food Wheel** - Appears as a new spinning option
- 🃏 **Swipe Cards** - Added to the Tinder-style voting deck

### How to Use

1. Click **"Team Lunch"** → **"Team Poll"**
2. You'll see 5 default options (Pizza Palace, Burger Joint, etc.)
3. At the top, there's an **"Add Your Own Option"** section
4. Type a restaurant name (e.g., "Falafel House", "Ramen Bar")
5. Click **"Add"** or press **Enter**
6. Your custom option appears in the poll with a **"Custom"** badge
7. Everyone votes normally
8. Click **"See Winner"** to finish the poll

### What Happens When Custom Option Wins

```
🎉 Winner: 🍽️ Falafel House with 5 votes!
🏆 Custom option won! Adding "Falafel House" to food options...
✅ Added "Falafel House" to Food Wheel!
✅ Added "Falafel House" to Swipe Cards!
✨ "Falafel House" has been added to Food Wheel and Swipe Cards!
```

Now when you:
- **Spin the Food Wheel** → "Falafel House" is one of the options
- **Swipe to Vote** → You'll see a "Falafel House" card

---

## 📊 **Team Poll (Enhanced)**

### Features

✅ Vote on 5 default restaurant options
✅ Add unlimited custom options
✅ Real-time vote percentages
✅ Visual progress bars
✅ "Custom" badge for user-added options
✅ Duplicate detection (can't add same restaurant twice)
✅ Auto-reset after winner announced

### UI Elements

- **Default Options:** Pizza Palace 🍕, Burger Joint 🍔, Sushi Bar 🍣, Taco Spot 🌮, Healthy Bowl 🥗
- **Custom Input:** Text field + "Add" button
- **Vote Cards:** Show emoji, name, percentage, progress bar, vote count
- **Custom Badge:** Purple badge marks user-added options

---

## 🎡 **Food Wheel**

### Original Features

- Spin to randomly select a food category
- 8 default categories: Pizza, Burgers, Sushi, Thai, Mexican, Chinese, Healthy, BBQ
- Visual wheel with emojis and colors
- Smooth 4-second spin animation
- Shows random restaurant from selected category

### NEW: Custom Categories

- Custom poll winners are added to the wheel
- Appear as new slices on the wheel
- Use 🍽️ emoji and green color
- Can be spun and selected like any other category

---

## 🃏 **Swipe Voting**

### Original Features

- Tinder-style card swiping
- 6 default restaurants
- Swipe right to LIKE, left to PASS
- Drag cards with mouse/touch
- Visual "LIKE" and "NOPE" indicators

### NEW: Custom Restaurants

- Custom poll winners are added to the deck
- Appear as green cards with "Custom" type
- Labeled as "Team favorite!"
- Can be swiped like any other restaurant

---

## ☕ **Drink Wheel**

- Spin to select a drink (Coffee, Tea, Water, Soda, Surprise Me!)
- 5-second animated spin
- Shows specific drink variant (e.g., "Cappuccino", "Espresso")
- "Spin Again" to retry
- "Invite Team" to share with others

---

## 🔔 **Notifications & Lobby**

- Live lobby shows who's joining
- Avatar display for team members
- Countdown timer for session
- "Busy Mode" to opt-out
- Real-time updates

---

## 🎯 **User Flows**

### Flow 1: Quick Coffee Decision (2 min)

```
Home → Quick Coffee → SPIN IT! → [Result] → Invite Team → Lobby → Let's Go!
```

### Flow 2: Team Lunch with Custom Option

```
Home → Team Lunch → Team Poll
→ Type "Ramen Bar" → Add
→ Vote for "Ramen Bar"
→ See Winner → "Ramen Bar wins!"
→ Automatic: Added to Food Wheel + Swipe Cards
→ Next time: Spin wheel or swipe, "Ramen Bar" appears!
```

### Flow 3: Food Wheel After Custom Addition

```
Team Lunch → Spin the Wheel → SPIN IT!
→ Lands on "Ramen Bar" (custom option from previous poll)
→ Shows "Ramen Bar" as result
```

### Flow 4: Swipe Voting with Custom Cards

```
Team Lunch → Swipe to Vote
→ Swipe through cards
→ See "Ramen Bar" card (green, "Custom" badge)
→ Swipe right to LIKE or left to PASS
```

---

## 🛠️ **Technical Details**

### Custom Option Storage

```javascript
// Poll restaurants with custom flag
{
  id: 'custom-100',
  name: 'Ramen Bar',
  emoji: '🍽️',
  votes: 5,
  isCustom: true  // <-- Marks as custom
}
```

### Food Wheel Integration

```javascript
addCategoryToFoodWheel({
  id: 'custom-100',
  name: 'Ramen Bar',
  icon: '🍽️',
  color: '#10B981'  // Green color
});
```

### Swipe Cards Integration

```javascript
addRestaurantToSwipeCards({
  id: 'custom-100',
  name: 'Ramen Bar',
  description: 'Team favorite!',
  category: 'Custom',
  type: 'Custom',
  price: '$$',
  color: 'bg-green-100'
});
```

---

## 🎨 **Visual Design**

### Custom Option Badge

```
┌─────────────────────────────────────┐
│  🍽️  Ramen Bar   [Custom]          │  <-- Purple badge
│       ████████ 60%                   │  <-- Progress bar
│       5 votes                        │
└─────────────────────────────────────┘
```

### Food Wheel with Custom

```
      ┌─────────┐
      │ Pointer │
      └────▼────┘
   ┌──────────────┐
   │   Ramen Bar  │  <-- Custom (green)
   │   🍽️         │
   ├──────────────┤
   │   Pizza 🍕   │
   ├──────────────┤
   │   Burger 🍔  │
   └──────────────┘
```

---

## 🧪 **Testing Custom Options**

### Test Case 1: Add Custom Option

1. Go to Team Poll
2. Type "Test Restaurant" in input
3. Click "Add"
4. ✅ Should appear in poll with "Custom" badge
5. ✅ Can vote on it
6. ✅ Shows in vote count

### Test Case 2: Duplicate Detection

1. Add "Pizza Palace" (already exists)
2. ✅ Should show alert: "This option already exists!"
3. ✅ Should NOT be added again

### Test Case 3: Custom Option Wins

1. Add "Winner Restaurant"
2. Vote for it (make sure it wins)
3. Click "See Winner"
4. ✅ Should show: "Winner: 🍽️ Winner Restaurant"
5. ✅ Should show: "Added to Food Wheel and Swipe Cards!"

### Test Case 4: Verify Integration

1. After custom wins, go to "Spin the Wheel"
2. ✅ Wheel should have new slice for "Winner Restaurant"
3. Spin it multiple times
4. ✅ Can land on custom option
5. Go to "Swipe to Vote"
6. ✅ Should see "Winner Restaurant" card
7. ✅ Card should be green with "Custom" type

---

## 📱 **Mobile Experience**

All features work on mobile:
- ✅ Touch-friendly custom option input
- ✅ Swipe gestures on cards
- ✅ Responsive poll layout
- ✅ Wheel spins smoothly on mobile
- ✅ Tap to vote on poll options

---

## 🔮 **Future Enhancements**

Based on your TODO.md:

### In Progress
- [ ] Real-time multiplayer (all users see same votes)
- [ ] WebSocket integration for live updates
- [ ] Push notifications when decisions are made

### Backlog
- [ ] Custom emoji picker for added options
- [ ] Photo upload for custom restaurants
- [ ] Ratings and reviews for custom options
- [ ] "Recently Added" section showing custom winners
- [ ] Export custom list to share with team
- [ ] Import restaurant lists from CSV/JSON

---

## 🎉 **Best Practices**

### For Users

1. **Be specific** with custom names ("Ramen Bar on 5th Ave" vs "Ramen")
2. **Check duplicates** before adding
3. **Vote honestly** - the winner gets added permanently!
4. **Review custom options** periodically to keep list fresh

### For Developers

1. Custom options persist in memory (session-based)
2. Reset happens after "See Winner" is clicked
3. IDs start from 100 to avoid conflicts with default IDs (1-5)
4. Custom options use 🍽️ emoji if no emoji provided
5. Food Wheel color for custom: `#10B981` (green)
6. Swipe card color for custom: `bg-green-100`

---

**Enjoy the enhanced voting experience! ☕🍕🎉**
