# HabitPulse — Progressive Web App (PWA)

A responsive, production-quality **Habit Tracker Progressive Web App (PWA)** built with pure **HTML5, CSS3, and Vanilla JavaScript**. Designed to help users cultivate daily routines, track consistency, and maintain discipline.

---

## ✨ Features & Highlights

- **Installable PWA**: Complies with the Web App Manifest specification with full offline caching via Service Worker.
- **100% Offline & Private**: Zero external backend, no databases, no logins, and no third-party tracking. All your habit records and history live securely in your browser's `localStorage` and `CacheStorage`.
- **Intelligent Streak Engine**: Schedule-aware streak calculation that respects everyday, weekday (Mon–Fri), and custom day schedules without falsely penalizing unselected days.
- **Dynamic Dashboard**:
  - Animated SVG circular progress ring displaying today's completion percentage.
  - Active streak flame metrics and all-time record counters.
  - Interactive 7-day weekly activity bar chart with completion ratios.
  - Curated motivational quote generator with an on-demand shuffle button.
  - Day navigator allowing you to step into yesterday or past dates to record historical completions.
  - Real-time search and category filters (Health, Fitness, Study, Coding, Personal Growth, Other).
- **Comprehensive Habit Management (CRUD)**:
  - Create, customize, edit, and delete habits.
  - Select custom accent colors and icon presets (⚡, 💻, 📖, 🏃, 💧, 🌙, 🧘, 🍎).
  - Schedule flexibility: Everyday, Weekdays (Mon–Fri), or Custom Days of the week.
  - Optional daily targets (e.g. `2 problems`, `20 mins`, `8 glasses`).
  - Preloaded with 6 sample routines ready to track or customize:
    1. *Solve 2 DSA problems* (Coding)
    2. *Read for 20 minutes* (Study)
    3. *Exercise for 30 minutes* (Fitness)
    4. *Drink enough water* (Health)
    5. *Practice coding* (Coding)
    6. *Sleep on time* (Health)
- **Calendar & Consistency Heatmap**:
  - Full monthly calendar grid with visual status badges (100% Perfect, Partial, Missed, Scheduled).
  - 90-Day GitHub-style contribution heatmap with 5 intensity levels.
  - Day Inspector drawer: click any day to inspect and toggle completions for historical dates.
- **Analytics & Insights**:
  - 30-day completion rate, all-time total completions, current best streak, and best-performing routine highlight.
  - Detailed breakdown table with completion percentage per routine.
- **Sensory Feedback (Offline-Ready)**:
  - **Synthesized Audio**: Web Audio API two-tone bell chime on completion (`C5` 523Hz $\to$ `G5` 784Hz) with exponential gain decay. No external audio files required.
  - **Celebration Confetti**: Lightweight HTML5 canvas particle engine that triggers celebratory bursts on milestones and 100% daily completion.
- **Data Portability**:
  - Export full JSON backup (`habitpulse-backup-YYYY-MM-DD.json`).
  - Import JSON backup with schema validation and summary preview before restore.
  - Two-step safety confirmation for resetting or wiping data.
- **Browser Routine Reminders**:
  - Integration with the browser `Notification` API with explicit user permission and test notification support.

---

## 📁 Project Structure

```text
habit-tracker/
├── index.html              # Semantic HTML5 app shell, modals, and views
├── style.css               # Modern CSS with dark/light themes, grid, and animations
├── app.js                  # Modular Vanilla JS: Store, Streak Engine, Audio, Confetti, UI
├── manifest.webmanifest    # PWA Web App Manifest (display: standalone, icons, shortcuts)
├── service-worker.js       # Service worker caching core assets with cache-first strategy
├── assets/
│   └── icons/
│       ├── icon-192.png    # 192x192 PWA icon
│       ├── icon-512.png    # 512x512 PWA & maskable icon
│       ├── icon.svg        # Scalable vector application logo
│       └── favicon.svg     # Browser tab favicon
├── test_app.py             # Automated asset, manifest, and HTTP server tests
├── test_logic.py           # Automated unit tests for streak algorithms
└── README.md               # Documentation and setup instructions
```

---

## 🚀 Running the App Locally

Because Service Workers and PWA installation require a secure origin (`https://` or `http://localhost`), serve the files using a local HTTP server:

### Option 1: Python Built-in Server (Recommended)
Open a terminal in the `habit tracker` directory:

```bash
# Start a local web server on port 8000
python -m http.server 8000
```

Now open your browser and navigate to:
**[http://localhost:8000](http://localhost:8000)**

---

## 📱 Testing PWA Installation

### On Desktop (Google Chrome, Microsoft Edge, Brave)
1. Navigate to `http://localhost:8000`.
2. Look at the right side of the address bar: an **Install HabitPulse** icon $(\oplus$ or a computer monitor with a download arrow) will appear.
3. Alternatively, click the **"Install App"** button located in the sidebar or top header.
4. Click **Install**. The app will open in its own dedicated, chromeless standalone window just like a native desktop app.

### On Mobile (Android / Chrome)
1. Open Chrome on Android and navigate to your hosted URL or local IP address.
2. Tap the three dots menu $(\vdots) \to$ **"Add to Home screen"** or **"Install app"**.
3. The app will install with its high-resolution icon and launch in full-screen standalone mode.

### On iOS (Safari)
1. Open Safari and navigate to the application URL.
2. Tap the **Share** button $(\uparrow)$ at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.

---

## 🔌 Testing Offline Functionality

To verify that the application continues to operate without internet connectivity:

1. Open `http://localhost:8000` in Google Chrome or Microsoft Edge.
2. Press `F12` or `Ctrl + Shift + I` to open **Developer Tools**.
3. Go to the **Application** tab:
   - Click **Service Workers** under the "Application" sidebar. Confirm that `service-worker.js` is **activated and running**.
   - Click **Cache Storage** $\to$ `habit-tracker-v1.0.0`. Notice that `index.html`, `style.css`, `app.js`, `manifest.webmanifest`, and icons are cached.
4. Go to the **Network** tab:
   - Change the throttling dropdown from **"No throttling"** to **"Offline"**.
5. Reload the page (`Ctrl + R` or `F5`):
   - Notice that the application loads instantly from the service worker cache!
   - An amber **"You are currently offline"** banner will appear.
   - Mark habits as complete or create new routines: all data continues to save and update seamlessly in `localStorage`.

---

## 🧮 Streak Calculation Engine

The streak calculation algorithm is schedule-aware:

1. **Current Streak**:
   - Walks backwards starting from today.
   - If today is scheduled and completed: streak starts at 1 and continues backwards.
   - If today is scheduled but *not yet completed*: today is still in progress, so the streak checks yesterday. If yesterday was completed, the active streak remains intact.
   - For habits on a **Weekdays (Mon–Fri)** schedule: weekends (Saturday and Sunday) do not break the streak chain.
2. **Longest Streak**:
   - Evaluates historical records across scheduled days and preserves the highest consecutive completed run.
3. **Historical Editing**:
   - Clicking any day on the Calendar allows you to inspect past records and toggle completions. The streak engine automatically recomputes metrics.

---

## 💾 Backup & Data Portability

- **Exporting**: Click **Settings** $\to$ **Export JSON**. A JSON file containing all habits, completion timestamps, and settings will download.
- **Importing**: Click **Settings** $\to$ **Import Backup** and select your `.json` file. A confirmation modal will display the habits count and completion records before safely restoring.
- **Resetting**: Use the **"Restore Default Habits"** button to restore sample routines, or use the **"Clear All Data"** danger zone with verification confirmation.

---

## 🛠️ Modifying & Extending the Code

- **Adding new habit categories**: Edit the `<select id="habit-category-select">` options in `index.html` and the category filter pills.
- **Adjusting colors and themes**: Edit the CSS custom properties in `style.css` (`:root[data-theme="dark"]` and `:root[data-theme="light"]`).
- **Sound adjustments**: Edit the frequency and gain values in `playCompletionChime()` inside `app.js`.
