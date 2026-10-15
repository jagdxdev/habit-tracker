/**
 * HabitPulse PWA - Core Application Logic
 * Modular, clean, production-grade Vanilla JavaScript.
 * Persistent localStorage, reliable streak engine, calendar heatmap,
 * offline PWA caching, Web Audio feedback, and responsive navigation.
 */

'use strict';

// ============================================================================
// 1. CONSTANTS & DEFAULT SAMPLE DATA
// ============================================================================

const STORAGE_KEYS = {
  HABITS: 'habitpulse_habits_v1',
  COMPLETIONS: 'habitpulse_completions_v1',
  SETTINGS: 'habitpulse_settings_v1',
  APP_INITIALIZED: 'habitpulse_initialized_v1'
};

const MOTIVATIONAL_QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear (Atomic Habits)" },
  { text: "Small disciplines repeated with consistency every day lead to great achievements gained slowly over time.", author: "John C. Maxwell" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "Action precedes motivation. Do the thing first, and the enthusiasm will follow.", author: "Marcus Aurelius" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "It is not what we do once in a while that shapes our lives. It is what we do consistently.", author: "Tony Robbins" },
  { text: "The secret of your future is hidden in your daily routine.", author: "Mike Murdock" }
];

// 6 Default Habits as explicitly requested
const DEFAULT_HABITS = [
  {
    id: 'habit-dsa',
    name: 'Solve 2 DSA problems',
    description: 'Master data structures, algorithms, and problem solving',
    category: 'Coding',
    icon: '💻',
    color: '#3b82f6',
    scheduleType: 'everyday',
    customDays: [0, 1, 2, 3, 4, 5, 6],
    target: '2 problems',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'habit-read',
    name: 'Read for 20 minutes',
    description: 'Read non-fiction, engineering books, or essays',
    category: 'Study',
    icon: '📖',
    color: '#8b5cf6',
    scheduleType: 'everyday',
    customDays: [0, 1, 2, 3, 4, 5, 6],
    target: '20 mins',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'habit-exercise',
    name: 'Exercise for 30 minutes',
    description: 'Gym, calisthenics, running, or high-intensity cardio',
    category: 'Fitness',
    icon: '🏃',
    color: '#10b981',
    scheduleType: 'weekdays',
    customDays: [1, 2, 3, 4, 5],
    target: '30 mins',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'habit-water',
    name: 'Drink enough water',
    description: 'Stay hydrated with at least 8 glasses throughout the day',
    category: 'Health',
    icon: '💧',
    color: '#06b6d4',
    scheduleType: 'everyday',
    customDays: [0, 1, 2, 3, 4, 5, 6],
    target: '8 glasses',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'habit-code',
    name: 'Practice coding',
    description: 'Build projects, ship features, or learn new syntax',
    category: 'Coding',
    icon: '⚡',
    color: '#f59e0b',
    scheduleType: 'everyday',
    customDays: [0, 1, 2, 3, 4, 5, 6],
    target: '1 hour',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  },
  {
    id: 'habit-sleep',
    name: 'Sleep on time',
    description: 'Turn off screens by 10:30 PM and sleep before 11 PM',
    category: 'Health',
    icon: '🌙',
    color: '#ec4899',
    scheduleType: 'everyday',
    customDays: [0, 1, 2, 3, 4, 5, 6],
    target: 'By 11:00 PM',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString()
  }
];

// ============================================================================
// 2. HELPER FUNCTIONS & DATE UTILITIES
// ============================================================================

function toLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDateString(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDisplayDate(dateStr) {
  const date = parseLocalDateString(dateStr);
  const options = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

function getDayOfWeek(dateStr) {
  return parseLocalDateString(dateStr).getDay(); // 0 is Sunday, 6 is Saturday
}

function isHabitScheduledForDate(habit, dateStr) {
  const day = getDayOfWeek(dateStr);
  if (habit.scheduleType === 'everyday') return true;
  if (habit.scheduleType === 'weekdays') return day >= 1 && day <= 5;
  if (habit.scheduleType === 'custom' && Array.isArray(habit.customDays)) {
    return habit.customDays.includes(day);
  }
  return true;
}

function generateId() {
  return 'habit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
}

// ============================================================================
// 3. AUDIO SYNTHESIS & CELEBRATION (Zero external dependencies)
// ============================================================================

class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playCompletionChime() {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      // Tone 1: C5 (523.25 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.18, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Tone 2: G5 (783.99 Hz) slightly delayed
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.08);
      gain2.gain.setValueAtTime(0.22, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.45);
    } catch (e) {
      console.warn('Audio playback not allowed or failed:', e);
    }
  }
}

// Lightweight particle confetti canvas engine
class ConfettiManager {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animId = null;

    if (this.canvas) {
      window.addEventListener('resize', () => this.resize());
      this.resize();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    if (!this.canvas || !this.ctx) return;
    this.resize();

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#38bdf8', '#a855f7'];
    const particleCount = 75;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        size: 5 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        life: 0.98 + Math.random() * 0.015
      });
    }

    if (!this.animId) {
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22; // gravity
      p.vx *= 0.98; // air resistance
      p.rotation += p.rotSpeed;
      p.opacity *= 0.965;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.3);
      this.ctx.restore();

      if (p.opacity < 0.05 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
      }
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// ============================================================================
// 4. DATA STORE & STREAK ENGINE
// ============================================================================

class HabitStore {
  constructor() {
    this.habits = [];
    this.completions = {}; // key: "habitId_YYYY-MM-DD" -> { completed: true, timestamp: ISOString }
    this.settings = {
      theme: 'dark',
      sound: true,
      confetti: true,
      userName: 'Champion',
      reminderTime: '20:00',
      notificationEnabled: false
    };
    this.load();
  }

  load() {
    try {
      const storedHabits = localStorage.getItem(STORAGE_KEYS.HABITS);
      const storedCompletions = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const isInitialized = localStorage.getItem(STORAGE_KEYS.APP_INITIALIZED);

      if (storedHabits) {
        this.habits = JSON.parse(storedHabits);
      }

      if (storedCompletions) {
        this.completions = JSON.parse(storedCompletions);
      }

      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }

      // If opening app for the first time, seed default habits and realistic sample completions
      if (!isInitialized || !storedHabits || this.habits.length === 0) {
        this.seedDefaults();
      }
    } catch (e) {
      console.error('Failed to load data from localStorage:', e);
      this.seedDefaults();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.HABITS, JSON.stringify(this.habits));
      localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(this.completions));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.APP_INITIALIZED, 'true');
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  seedDefaults() {
    this.habits = JSON.parse(JSON.stringify(DEFAULT_HABITS));
    this.completions = {};

    // Seed realistic past 10 days of completions
    const today = new Date();
    for (let i = 1; i <= 10; i++) {
      const pastDate = new Date(today);
      pastDate.setDate(today.getDate() - i);
      const dateStr = toLocalDateString(pastDate);

      this.habits.forEach((habit) => {
        if (isHabitScheduledForDate(habit, dateStr)) {
          // 85% completion probability for realistic demonstration
          if (Math.random() < 0.85) {
            this.completions[`${habit.id}_${dateStr}`] = {
              completed: true,
              timestamp: pastDate.toISOString()
            };
          }
        }
      });
    }

    this.save();
  }

  // --- Habit CRUD ---
  addHabit(habitData) {
    const habit = {
      id: generateId(),
      name: habitData.name.trim(),
      description: habitData.description.trim(),
      category: habitData.category || 'Other',
      icon: habitData.icon || '⚡',
      color: habitData.color || '#6366f1',
      scheduleType: habitData.scheduleType || 'everyday',
      customDays: habitData.customDays || [0, 1, 2, 3, 4, 5, 6],
      target: habitData.target.trim() || '',
      createdAt: new Date().toISOString()
    };
    this.habits.unshift(habit);
    this.save();
    return habit;
  }

  updateHabit(id, habitData) {
    const idx = this.habits.findIndex(h => h.id === id);
    if (idx === -1) return null;
    this.habits[idx] = {
      ...this.habits[idx],
      name: habitData.name.trim(),
      description: habitData.description.trim(),
      category: habitData.category || 'Other',
      icon: habitData.icon || '⚡',
      color: habitData.color || '#6366f1',
      scheduleType: habitData.scheduleType || 'everyday',
      customDays: habitData.customDays || [0, 1, 2, 3, 4, 5, 6],
      target: habitData.target.trim() || ''
    };
    this.save();
    return this.habits[idx];
  }

  deleteHabit(id) {
    this.habits = this.habits.filter(h => h.id !== id);
    // Remove completion records for this habit
    const prefix = `${id}_`;
    Object.keys(this.completions).forEach(key => {
      if (key.startsWith(prefix)) {
        delete this.completions[key];
      }
    });
    this.save();
  }

  // --- Completion Toggle ---
  isCompleted(habitId, dateStr) {
    const key = `${habitId}_${dateStr}`;
    return Boolean(this.completions[key] && this.completions[key].completed);
  }

  toggleCompletion(habitId, dateStr) {
    const key = `${habitId}_${dateStr}`;
    if (this.completions[key] && this.completions[key].completed) {
      delete this.completions[key];
      this.save();
      return false; // now incomplete
    } else {
      this.completions[key] = {
        completed: true,
        timestamp: new Date().toISOString()
      };
      this.save();
      return true; // now complete
    }
  }

  // --- Streak Calculations (Schedule-Aware) ---
  calculateHabitStreaks(habitId) {
    const habit = this.habits.find(h => h.id === habitId);
    if (!habit) return { currentStreak: 0, longestStreak: 0, totalCompletions: 0 };

    const todayStr = toLocalDateString(new Date());
    let currentStreak = 0;
    let longestStreak = 0;
    let totalCompletions = 0;

    // Count all-time completions for this habit
    const prefix = `${habitId}_`;
    Object.keys(this.completions).forEach(key => {
      if (key.startsWith(prefix) && this.completions[key].completed) {
        totalCompletions++;
      }
    });

    // 1. Calculate Current Streak:
    // Check backwards day by day starting from today
    let checkDate = new Date();
    let isToday = true;

    while (true) {
      const dateStr = toLocalDateString(checkDate);
      const isScheduled = isHabitScheduledForDate(habit, dateStr);

      if (isScheduled) {
        const completed = this.isCompleted(habitId, dateStr);
        if (completed) {
          currentStreak++;
        } else {
          // If today is scheduled and not completed, streak is not broken yet (day is still active!)
          if (!isToday) {
            break; // Past scheduled day missed -> streak chain ends
          }
        }
      }

      isToday = false;
      // Step backwards 1 day
      checkDate.setDate(checkDate.getDate() - 1);

      // Stop checking if we're further back than habit creation (or max 365 days)
      const diffDays = Math.floor((new Date() - checkDate) / 86400000);
      if (diffDays > 365) break;
    }

    // 2. Calculate Longest Streak:
    // Iterate from 120 days ago forward to today
    let tempStreak = 0;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120);

    const endDate = new Date();
    let iterDate = new Date(startDate);

    while (iterDate <= endDate) {
      const dStr = toLocalDateString(iterDate);
      if (isHabitScheduledForDate(habit, dStr)) {
        if (this.isCompleted(habitId, dStr)) {
          tempStreak++;
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
        } else {
          // Only break if this day is strictly in the past (not today)
          if (dStr !== todayStr) {
            tempStreak = 0;
          }
        }
      }
      iterDate.setDate(iterDate.getDate() + 1);
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { currentStreak, longestStreak, totalCompletions };
  }

  // --- Aggregate Statistics ---
  getAggregateStats() {
    let maxCurrentStreak = 0;
    let maxLongestStreak = 0;
    let totalCompletionsCount = 0;
    let bestHabit = null;
    let bestScore = -1;

    this.habits.forEach(h => {
      const streaks = this.calculateHabitStreaks(h.id);
      if (streaks.currentStreak > maxCurrentStreak) maxCurrentStreak = streaks.currentStreak;
      if (streaks.longestStreak > maxLongestStreak) maxLongestStreak = streaks.longestStreak;
      totalCompletionsCount += streaks.totalCompletions;

      // Score for best habit: streak * 3 + totalCompletions
      const score = streaks.currentStreak * 3 + streaks.totalCompletions;
      if (score > bestScore) {
        bestScore = score;
        bestHabit = {
          habit: h,
          streak: streaks.currentStreak,
          total: streaks.totalCompletions
        };
      }
    });

    // 30-Day Completion Rate
    let scheduledSlots30 = 0;
    let completedSlots30 = 0;
    const now = new Date();

    for (let i = 0; i < 30; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dStr = toLocalDateString(d);

      this.habits.forEach(h => {
        if (isHabitScheduledForDate(h, dStr)) {
          scheduledSlots30++;
          if (this.isCompleted(h.id, dStr)) {
            completedSlots30++;
          }
        }
      });
    }

    const rate30 = scheduledSlots30 > 0 ? Math.round((completedSlots30 / scheduledSlots30) * 100) : 0;

    return {
      maxCurrentStreak,
      maxLongestStreak,
      totalCompletionsCount,
      rate30,
      bestHabit
    };
  }

  // Day metrics for a specific date
  getDayMetrics(dateStr) {
    const scheduled = this.habits.filter(h => isHabitScheduledForDate(h, dateStr));
    const completed = scheduled.filter(h => this.isCompleted(h.id, dateStr));
    const total = scheduled.length;
    const done = completed.length;
    const remaining = total - done;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      scheduled,
      completed,
      total,
      done,
      remaining,
      percentage
    };
  }
}

// ============================================================================
// 5. APPLICATION UI CONTROLLER
// ============================================================================

class HabitApp {
  constructor() {
    this.store = new HabitStore();
    this.sound = new SoundManager();
    this.confetti = new ConfettiManager('confetti-canvas');

    this.currentView = 'dashboard';
    this.selectedDateStr = toLocalDateString(new Date());
    this.activeCategoryFilter = 'all';
    this.searchQuery = '';

    // Calendar navigation state
    const today = new Date();
    this.calendarYear = today.getFullYear();
    this.calendarMonth = today.getMonth(); // 0 to 11

    // Pending delete or modal targets
    this.habitToDeleteId = null;
    this.pendingImportData = null;

    this.init();
  }

  init() {
    this.applyTheme(this.store.settings.theme);
    this.initNavigation();
    this.initHeaderAndGreetings();
    this.initQuoteCard();
    this.initHabitFormModal();
    this.initModals();
    this.initSettingsView();
    this.initPWA();
    this.initDateNavigation();
    this.initCalendarControls();

    // Render initial views
    this.render();

    // Auto-update greeting and date
    setInterval(() => this.updateHeaderGreeting(), 60000);
  }

  // --- Theming ---
  applyTheme(theme) {
    let activeTheme = theme;
    if (theme === 'system') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = prefersDark ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', activeTheme);
    this.store.settings.theme = theme;
    this.store.save();

    // Update settings buttons if present
    document.querySelectorAll('.theme-select-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeVal === theme);
    });
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.applyTheme(newTheme);
    this.showToast(`Switched to ${newTheme} mode`, 'info');
  }

  // --- Navigation & View Switching ---
  initNavigation() {
    const switchTab = (tabName) => {
      this.currentView = tabName;

      // Update sidebar nav items
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
      });

      // Update mobile nav items
      document.querySelectorAll('.mobile-nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tabName);
      });

      // Switch active view panel
      document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `view-${tabName}`);
      });

      // Close mobile drawer if open
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.remove('mobile-open');

      this.render();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Sidebar navigation listeners
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile navigation bar listeners
    document.querySelectorAll('.mobile-nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuToggle && sidebar) {
      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
      });
    }

    // Theme toggle button in header
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Quick add buttons
    const quickAddBtn = document.getElementById('btn-quick-add');
    const mobileQuickAdd = document.getElementById('btn-mobile-quick-add');
    const manageCreateBtn = document.getElementById('btn-create-habit-top');
    const emptyAddBtn = document.getElementById('btn-empty-add-habit');

    [quickAddBtn, mobileQuickAdd, manageCreateBtn, emptyAddBtn].forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.openHabitModal());
    });
  }

  // --- Header & Greeting ---
  initHeaderAndGreetings() {
    this.updateHeaderGreeting();
  }

  updateHeaderGreeting() {
    const greetingEl = document.getElementById('header-greeting');
    const dateEl = document.getElementById('header-date');
    const now = new Date();
    const hour = now.getHours();

    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) {
      timeGreeting = 'Good afternoon';
    } else if (hour >= 17 || hour < 5) {
      timeGreeting = 'Good evening';
    }

    const userName = this.store.settings.userName || 'Champion';
    if (greetingEl) {
      greetingEl.textContent = `${timeGreeting}, ${userName}!`;
    }

    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }

  // --- Quote Card ---
  initQuoteCard() {
    const shuffleBtn = document.getElementById('btn-shuffle-quote');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => this.renderRandomQuote());
    }
    this.renderRandomQuote();
  }

  renderRandomQuote() {
    const quoteText = document.getElementById('daily-quote-text');
    const quoteAuthor = document.getElementById('daily-quote-author');
    if (!quoteText || !quoteAuthor) return;

    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    const quote = MOTIVATIONAL_QUOTES[randomIndex];
    quoteText.textContent = `"${quote.text}"`;
    quoteAuthor.textContent = `— ${quote.author}`;
  }

  // --- Date Navigation on Dashboard ---
  initDateNavigation() {
    const prevBtn = document.getElementById('btn-prev-day');
    const nextBtn = document.getElementById('btn-next-day');
    const todayBtn = document.getElementById('btn-jump-today');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const d = parseLocalDateString(this.selectedDateStr);
        d.setDate(d.getDate() - 1);
        this.selectedDateStr = toLocalDateString(d);
        this.renderDashboard();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const d = parseLocalDateString(this.selectedDateStr);
        d.setDate(d.getDate() + 1);
        this.selectedDateStr = toLocalDateString(d);
        this.renderDashboard();
      });
    }

    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        this.selectedDateStr = toLocalDateString(new Date());
        this.renderDashboard();
      });
    }

    // Search input listener
    const searchInput = document.getElementById('dashboard-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderDashboardHabits();
      });
    }

    // Category filter pills listener
    const filterContainer = document.getElementById('dashboard-category-filters');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('cat-pill')) {
          filterContainer.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          this.activeCategoryFilter = e.target.dataset.category;
          this.renderDashboardHabits();
        }
      });
    }

    // Manage view search & category filters
    const manageSearch = document.getElementById('manage-search-input');
    if (manageSearch) {
      manageSearch.addEventListener('input', () => this.renderManageHabits());
    }

    const manageFilters = document.getElementById('manage-category-filters');
    if (manageFilters) {
      manageFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('cat-pill')) {
          manageFilters.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
          e.target.classList.add('active');
          this.renderManageHabits();
        }
      });
    }
  }

  // --- Calendar Controls ---
  initCalendarControls() {
    const prevMonthBtn = document.getElementById('btn-cal-prev-month');
    const nextMonthBtn = document.getElementById('btn-cal-next-month');
    const calTodayBtn = document.getElementById('btn-cal-today');

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        this.calendarMonth--;
        if (this.calendarMonth < 0) {
          this.calendarMonth = 11;
          this.calendarYear--;
        }
        this.renderCalendar();
      });
    }

    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        this.calendarMonth++;
        if (this.calendarMonth > 11) {
          this.calendarMonth = 0;
          this.calendarYear++;
        }
        this.renderCalendar();
      });
    }

    if (calTodayBtn) {
      calTodayBtn.addEventListener('click', () => {
        const today = new Date();
        this.calendarYear = today.getFullYear();
        this.calendarMonth = today.getMonth();
        this.selectedDateStr = toLocalDateString(today);
        this.renderCalendar();
      });
    }
  }

  // --- Habit Form Modal ---
  initHabitFormModal() {
    const modalBackdrop = document.getElementById('habit-modal-backdrop');
    const form = document.getElementById('habit-form');
    const closeBtn = document.getElementById('btn-close-habit-modal');
    const cancelBtn = document.getElementById('btn-cancel-habit-form');

    const closeModal = () => {
      modalBackdrop.classList.remove('open');
      modalBackdrop.setAttribute('aria-hidden', 'true');
      form.reset();
      document.getElementById('habit-form-id').value = '';
      document.getElementById('habit-name-error').parentElement.classList.remove('has-error');
    };

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeModal();
    });

    // Color Swatches Selection
    const colorSwatches = document.getElementById('color-palette-options');
    const colorInput = document.getElementById('habit-color-input');
    if (colorSwatches && colorInput) {
      colorSwatches.addEventListener('click', (e) => {
        const btn = e.target.closest('.color-swatch-btn');
        if (!btn) return;
        colorSwatches.querySelectorAll('.color-swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        colorInput.value = btn.dataset.color;
      });
    }

    // Preset Icons Picker
    const presetWrap = document.querySelector('.preset-icons-dropdown');
    const iconInput = document.getElementById('habit-icon-input');
    const iconPreview = document.getElementById('selected-icon-preview');

    if (presetWrap && iconInput && iconPreview) {
      presetWrap.addEventListener('click', (e) => {
        const btn = e.target.closest('.preset-icon-btn');
        if (!btn) return;
        const icon = btn.dataset.icon;
        iconInput.value = icon;
        iconPreview.textContent = icon;
      });

      iconInput.addEventListener('input', () => {
        iconPreview.textContent = iconInput.value || '⚡';
      });
    }

    // Schedule radio listener
    const scheduleRadios = document.querySelectorAll('input[name="scheduleType"]');
    const customDaysContainer = document.getElementById('custom-days-selector');
    scheduleRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (customDaysContainer) {
          customDaysContainer.style.display = radio.value === 'custom' && radio.checked ? 'flex' : 'none';
        }
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('habit-name-input');
      const name = nameInput.value.trim();

      if (!name) {
        nameInput.parentElement.classList.add('has-error');
        nameInput.focus();
        return;
      }

      const habitId = document.getElementById('habit-form-id').value;
      const description = document.getElementById('habit-desc-input').value;
      const category = document.getElementById('habit-category-select').value;
      const icon = document.getElementById('habit-icon-input').value || '⚡';
      const color = document.getElementById('habit-color-input').value || '#6366f1';
      const scheduleType = document.querySelector('input[name="scheduleType"]:checked').value;
      const target = document.getElementById('habit-target-input').value;

      let customDays = [0, 1, 2, 3, 4, 5, 6];
      if (scheduleType === 'custom') {
        customDays = Array.from(document.querySelectorAll('input[name="customDay"]:checked')).map(cb => Number(cb.value));
        if (customDays.length === 0) customDays = [1, 2, 3, 4, 5]; // fallback weekdays
      }

      if (habitId) {
        // Edit existing
        this.store.updateHabit(habitId, { name, description, category, icon, color, scheduleType, customDays, target });
        this.showToast('Habit updated successfully!', 'success');
      } else {
        // Create new
        this.store.addHabit({ name, description, category, icon, color, scheduleType, customDays, target });
        this.showToast('New habit created! Let\'s build discipline.', 'success');
      }

      closeModal();
      this.render();
    });
  }

  openHabitModal(habitId = null) {
    const modalBackdrop = document.getElementById('habit-modal-backdrop');
    const modalTitle = document.getElementById('habit-modal-title');
    const idInput = document.getElementById('habit-form-id');
    const nameInput = document.getElementById('habit-name-input');
    const descInput = document.getElementById('habit-desc-input');
    const catSelect = document.getElementById('habit-category-select');
    const iconInput = document.getElementById('habit-icon-input');
    const iconPreview = document.getElementById('selected-icon-preview');
    const colorInput = document.getElementById('habit-color-input');
    const colorSwatches = document.querySelectorAll('.color-swatch-btn');
    const targetInput = document.getElementById('habit-target-input');
    const customDaysContainer = document.getElementById('custom-days-selector');

    if (habitId) {
      const habit = this.store.habits.find(h => h.id === habitId);
      if (!habit) return;
      modalTitle.textContent = 'Edit Habit';
      idInput.value = habit.id;
      nameInput.value = habit.name;
      descInput.value = habit.description || '';
      catSelect.value = habit.category || 'Other';
      iconInput.value = habit.icon || '⚡';
      iconPreview.textContent = habit.icon || '⚡';
      colorInput.value = habit.color || '#6366f1';
      targetInput.value = habit.target || '';

      // Set schedule radio
      const radio = document.querySelector(`input[name="scheduleType"][value="${habit.scheduleType}"]`);
      if (radio) radio.checked = true;

      // Custom days
      if (customDaysContainer) {
        customDaysContainer.style.display = habit.scheduleType === 'custom' ? 'flex' : 'none';
        document.querySelectorAll('input[name="customDay"]').forEach(cb => {
          cb.checked = Array.isArray(habit.customDays) && habit.customDays.includes(Number(cb.value));
        });
      }
    } else {
      modalTitle.textContent = 'Create New Habit';
      idInput.value = '';
      nameInput.value = '';
      descInput.value = '';
      catSelect.value = 'Health';
      iconInput.value = '⚡';
      iconPreview.textContent = '⚡';
      colorInput.value = '#6366f1';
      targetInput.value = '';
      document.getElementById('radio-everyday').checked = true;
      if (customDaysContainer) customDaysContainer.style.display = 'none';
    }

    // Sync active color swatch
    colorSwatches.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color.toLowerCase() === colorInput.value.toLowerCase());
    });

    modalBackdrop.classList.add('open');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    nameInput.focus();
  }

  // --- Delete & Confirmation Modals ---
  initModals() {
    // Delete Confirmation Modal
    const deleteBackdrop = document.getElementById('delete-modal-backdrop');
    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    const btnCloseDelete = document.getElementById('btn-close-delete-modal');
    const btnConfirmDelete = document.getElementById('btn-confirm-delete');

    const closeDeleteModal = () => {
      deleteBackdrop.classList.remove('open');
      this.habitToDeleteId = null;
    };

    if (btnCancelDelete) btnCancelDelete.addEventListener('click', closeDeleteModal);
    if (btnCloseDelete) btnCloseDelete.addEventListener('click', closeDeleteModal);

    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', () => {
        if (this.habitToDeleteId) {
          this.store.deleteHabit(this.habitToDeleteId);
          this.showToast('Habit and history deleted.', 'info');
          closeDeleteModal();
          this.render();
        }
      });
    }

    // Import Confirmation Modal
    const importBackdrop = document.getElementById('import-modal-backdrop');
    const btnCancelImport = document.getElementById('btn-cancel-import');
    const btnCloseImport = document.getElementById('btn-close-import-modal');
    const btnConfirmImport = document.getElementById('btn-confirm-import');

    const closeImportModal = () => {
      importBackdrop.classList.remove('open');
      this.pendingImportData = null;
    };

    if (btnCancelImport) btnCancelImport.addEventListener('click', closeImportModal);
    if (btnCloseImport) btnCloseImport.addEventListener('click', closeImportModal);

    if (btnConfirmImport) {
      btnConfirmImport.addEventListener('click', () => {
        if (this.pendingImportData) {
          this.store.habits = this.pendingImportData.habits;
          this.store.completions = this.pendingImportData.completions || {};
          if (this.pendingImportData.settings) {
            this.store.settings = { ...this.store.settings, ...this.pendingImportData.settings };
          }
          this.store.save();
          this.showToast('Backup restored successfully!', 'success');
          closeImportModal();
          this.render();
        }
      });
    }

    // Reset All Data Modal
    const resetBackdrop = document.getElementById('reset-modal-backdrop');
    const btnCancelReset = document.getElementById('btn-cancel-reset');
    const btnCloseReset = document.getElementById('btn-close-reset-modal');
    const btnConfirmReset = document.getElementById('btn-confirm-reset');
    const resetInput = document.getElementById('reset-confirm-input');

    const closeResetModal = () => {
      resetBackdrop.classList.remove('open');
      if (resetInput) resetInput.value = '';
      if (btnConfirmReset) btnConfirmReset.disabled = true;
    };

    if (btnCancelReset) btnCancelReset.addEventListener('click', closeResetModal);
    if (btnCloseReset) btnCloseReset.addEventListener('click', closeResetModal);

    if (resetInput && btnConfirmReset) {
      resetInput.addEventListener('input', () => {
        btnConfirmReset.disabled = resetInput.value.trim() !== 'RESET';
      });

      btnConfirmReset.addEventListener('click', () => {
        localStorage.clear();
        this.store.habits = [];
        this.store.completions = {};
        this.store.save();
        this.showToast('All habit tracker data has been wiped.', 'error');
        closeResetModal();
        this.render();
      });
    }
  }

  openDeleteModal(habitId) {
    const habit = this.store.habits.find(h => h.id === habitId);
    if (!habit) return;
    this.habitToDeleteId = habitId;
    document.getElementById('delete-habit-name').textContent = `"${habit.name}"`;
    document.getElementById('delete-modal-backdrop').classList.add('open');
  }

  // --- Settings View Initializer ---
  initSettingsView() {
    // Sound toggle
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.checked = Boolean(this.store.settings.sound);
      soundToggle.addEventListener('change', () => {
        this.store.settings.sound = soundToggle.checked;
        this.store.save();
        this.showToast(`Sound feedback ${soundToggle.checked ? 'enabled' : 'disabled'}`, 'info');
      });
    }

    // Confetti toggle
    const confettiToggle = document.getElementById('setting-confetti-toggle');
    if (confettiToggle) {
      confettiToggle.checked = Boolean(this.store.settings.confetti);
      confettiToggle.addEventListener('change', () => {
        this.store.settings.confetti = confettiToggle.checked;
        this.store.save();
        this.showToast(`Celebration confetti ${confettiToggle.checked ? 'enabled' : 'disabled'}`, 'info');
      });
    }

    // Username input
    const usernameInput = document.getElementById('setting-username-input');
    const saveUsernameBtn = document.getElementById('btn-save-username');
    if (usernameInput && saveUsernameBtn) {
      usernameInput.value = this.store.settings.userName || 'Champion';
      saveUsernameBtn.addEventListener('click', () => {
        const val = usernameInput.value.trim() || 'Champion';
        this.store.settings.userName = val;
        this.store.save();
        this.updateHeaderGreeting();
        this.showToast('Name updated successfully!', 'success');
      });
    }

    // Theme selector buttons
    document.querySelectorAll('.theme-select-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const themeVal = btn.dataset.themeVal;
        this.applyTheme(themeVal);
        this.showToast(`Theme changed to ${themeVal}`, 'info');
      });
    });

    // Browser Notification Setup
    this.initNotifications();

    // Export Backup JSON
    const exportBtn = document.getElementById('btn-export-backup');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportBackup());
    }

    // Import Backup JSON
    const importInput = document.getElementById('import-file-input');
    if (importInput) {
      importInput.addEventListener('change', (e) => this.handleImportFile(e));
    }

    // Restore Defaults Button
    const restoreBtn = document.getElementById('btn-restore-defaults');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', () => {
        if (confirm('Restore default habits and sample streaks? Your custom records will be replaced with sample routines.')) {
          this.store.seedDefaults();
          this.showToast('Default habits restored.', 'success');
          this.render();
        }
      });
    }

    // Clear All Data Danger Button
    const resetAllBtn = document.getElementById('btn-reset-all-data');
    if (resetAllBtn) {
      resetAllBtn.addEventListener('click', () => {
        document.getElementById('reset-modal-backdrop').classList.add('open');
      });
    }
  }

  // --- Browser Notifications API ---
  initNotifications() {
    const badge = document.getElementById('notification-perm-badge');
    const reqBtn = document.getElementById('btn-request-notification');
    const testBtn = document.getElementById('btn-test-notification');
    const hint = document.getElementById('notification-perm-hint');

    const updateStatus = () => {
      if (!('Notification' in window)) {
        if (badge) badge.textContent = 'Notifications Not Supported in this browser';
        if (reqBtn) reqBtn.disabled = true;
        if (testBtn) testBtn.disabled = true;
        return;
      }

      if (Notification.permission === 'granted') {
        if (badge) {
          badge.textContent = 'Permission: Enabled';
          badge.className = 'status-badge text-success';
        }
        if (hint) hint.textContent = 'Daily discipline reminders are ready to fire.';
        if (reqBtn) {
          reqBtn.textContent = 'Notifications Active';
          reqBtn.disabled = true;
        }
        if (testBtn) testBtn.disabled = false;
      } else if (Notification.permission === 'denied') {
        if (badge) {
          badge.textContent = 'Permission: Blocked in Browser Settings';
          badge.className = 'status-badge text-danger';
        }
        if (hint) hint.textContent = 'Please enable notifications in your browser site permissions.';
        if (reqBtn) reqBtn.disabled = true;
        if (testBtn) testBtn.disabled = true;
      } else {
        if (badge) {
          badge.textContent = 'Permission: Not Requested';
          badge.className = 'status-badge';
        }
        if (hint) hint.textContent = 'Click below to allow daily routine notifications.';
        if (reqBtn) reqBtn.disabled = false;
        if (testBtn) testBtn.disabled = true;
      }
    };

    updateStatus();

    if (reqBtn) {
      reqBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
          this.showToast('Browser notifications are not supported.', 'error');
          return;
        }
        const perm = await Notification.requestPermission();
        updateStatus();
        if (perm === 'granted') {
          this.showToast('Notification reminders enabled!', 'success');
        } else {
          this.showToast('Notification permission was not granted.', 'warning');
        }
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (Notification.permission === 'granted') {
          new Notification('HabitPulse Routine Reminder', {
            body: 'Consistency is your superpower! Time to check off today\'s habits.',
            icon: 'assets/icons/icon-192.png',
            tag: 'habit-daily-reminder'
          });
          this.showToast('Test notification sent!', 'success');
        } else {
          this.showToast('Please enable notifications first.', 'warning');
        }
      });
    }
  }

  // --- Export & Import Backup ---
  exportBackup() {
    const backupData = {
      app: 'HabitPulse',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      habits: this.store.habits,
      completions: this.store.completions,
      settings: this.store.settings
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = toLocalDateString(new Date());
    a.href = url;
    a.download = `habitpulse-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.showToast('Data exported successfully!', 'success');
  }

  handleImportFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        // Validate structure
        if (!parsed || !Array.isArray(parsed.habits)) {
          throw new Error('Invalid backup file. Missing habits array.');
        }

        this.pendingImportData = parsed;

        // Show confirmation summary in modal
        const listEl = document.getElementById('import-summary-list');
        if (listEl) {
          const habitCount = parsed.habits.length;
          const completionCount = parsed.completions ? Object.keys(parsed.completions).length : 0;
          listEl.innerHTML = `
            <li><strong>Habits count:</strong> ${habitCount}</li>
            <li><strong>Completion records:</strong> ${completionCount}</li>
            <li><strong>Exported date:</strong> ${parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleDateString() : 'Unknown'}</li>
          `;
        }

        document.getElementById('import-modal-backdrop').classList.add('open');
      } catch (err) {
        this.showToast(`Failed to parse backup: ${err.message}`, 'error');
      } finally {
        event.target.value = ''; // Reset input
      }
    };
    reader.readAsText(file);
  }

  // --- Progressive Web App & Service Worker ---
  initPWA() {
    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered:', reg.scope);
            const swLabel = document.getElementById('sw-status-label');
            if (swLabel) swLabel.textContent = 'Active & Caching (v1.0.0)';
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
            const swLabel = document.getElementById('sw-status-label');
            if (swLabel) swLabel.textContent = 'Unavailable in current environment';
          });
      });
    }

    // 2. Online / Offline network status listener
    const updateNetworkStatus = () => {
      const isOnline = navigator.onLine;
      const indicator = document.getElementById('network-status-indicator');
      const offlineBanner = document.getElementById('offline-banner');

      if (indicator) {
        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('.status-text');
        if (isOnline) {
          dot.className = 'status-dot online';
          text.textContent = 'Online';
        } else {
          dot.className = 'status-dot offline';
          text.textContent = 'Offline (Cached)';
        }
      }

      if (offlineBanner) {
        offlineBanner.style.display = isOnline ? 'none' : 'flex';
      }
    };

    window.addEventListener('online', () => {
      updateNetworkStatus();
      this.showToast('You are back online!', 'success');
    });

    window.addEventListener('offline', () => {
      updateNetworkStatus();
      this.showToast('You are offline. Full local support is active.', 'warning');
    });

    updateNetworkStatus();

    // 3. Native install prompt handling
    let deferredPrompt = null;
    const sidebarInstallBtn = document.getElementById('btn-sidebar-install');
    const headerInstallBtn = document.getElementById('btn-header-install');

    // Check if running in standalone PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

    if (!isStandalone) {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (sidebarInstallBtn) sidebarInstallBtn.style.display = 'inline-flex';
        if (headerInstallBtn) headerInstallBtn.style.display = 'inline-flex';
      });

      const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          this.showToast('Thank you for installing HabitPulse!', 'success');
        }
        deferredPrompt = null;
        if (sidebarInstallBtn) sidebarInstallBtn.style.display = 'none';
        if (headerInstallBtn) headerInstallBtn.style.display = 'none';
      };

      if (sidebarInstallBtn) sidebarInstallBtn.addEventListener('click', handleInstallClick);
      if (headerInstallBtn) headerInstallBtn.addEventListener('click', handleInstallClick);
    }

    window.addEventListener('appinstalled', () => {
      this.showToast('HabitPulse installed successfully as a PWA!', 'success');
      if (sidebarInstallBtn) sidebarInstallBtn.style.display = 'none';
      if (headerInstallBtn) headerInstallBtn.style.display = 'none';
    });
  }

  // --- Toast Notification Helper ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `${iconSvg}<span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

  // ==========================================================================
  // 6. MAIN RENDER PIPELINE
  // ==========================================================================

  render() {
    // Update sidebar habits count badge
    const badge = document.getElementById('sidebar-habits-count');
    if (badge) badge.textContent = this.store.habits.length;

    if (this.currentView === 'dashboard') {
      this.renderDashboard();
    } else if (this.currentView === 'habits') {
      this.renderManageHabits();
    } else if (this.currentView === 'calendar') {
      this.renderCalendar();
    } else if (this.currentView === 'stats') {
      this.renderStatistics();
    }
  }

  // --- Render Dashboard ---
  renderDashboard() {
    const todayStr = toLocalDateString(new Date());
    const isToday = this.selectedDateStr === todayStr;

    // 1. Date navigator title & sub
    const navTitle = document.getElementById('date-nav-title');
    const navSub = document.getElementById('date-nav-sub');
    if (navTitle && navSub) {
      if (isToday) {
        navTitle.textContent = 'Today';
      } else {
        const d = parseLocalDateString(this.selectedDateStr);
        navTitle.textContent = d.toLocaleDateString(undefined, { weekday: 'short' });
      }
      navSub.textContent = formatDisplayDate(this.selectedDateStr);
    }

    // 2. Day metrics for selected date
    const metrics = this.store.getDayMetrics(this.selectedDateStr);

    // Update Circular Progress Ring
    const circle = document.getElementById('dashboard-progress-circle');
    const percentEl = document.getElementById('dashboard-progress-percent');
    if (circle && percentEl) {
      const radius = 66;
      const circumference = 2 * Math.PI * radius; // ~414.69
      const offset = circumference - (metrics.percentage / 100) * circumference;
      circle.style.strokeDashoffset = offset;
      percentEl.textContent = `${metrics.percentage}%`;

      if (metrics.percentage === 100 && metrics.total > 0) {
        circle.style.stroke = 'var(--success)';
      } else {
        circle.style.stroke = 'var(--primary)';
      }
    }

    // Update Counter Stats
    const completedCountEl = document.getElementById('stat-completed-count');
    const remainingCountEl = document.getElementById('stat-remaining-count');
    const totalCountEl = document.getElementById('stat-total-count');
    const counterDesc = document.getElementById('hero-counter-desc');
    const heroTitle = document.getElementById('hero-encouragement');
    const heroBadge = document.getElementById('hero-status-badge');

    if (completedCountEl) completedCountEl.textContent = metrics.done;
    if (remainingCountEl) remainingCountEl.textContent = metrics.remaining;
    if (totalCountEl) totalCountEl.textContent = metrics.total;

    if (counterDesc) {
      counterDesc.textContent = `${metrics.done} of ${metrics.total} habits completed for this date.`;
    }

    if (heroTitle && heroBadge) {
      if (metrics.total === 0) {
        heroBadge.textContent = 'No routines scheduled';
        heroTitle.textContent = 'Rest and recharge day!';
      } else if (metrics.percentage === 100) {
        heroBadge.textContent = 'Flawless discipline! 🌟';
        heroTitle.textContent = 'All routines completed today!';
      } else if (metrics.percentage >= 50) {
        heroBadge.textContent = 'Great momentum!';
        heroTitle.textContent = 'More than halfway done!';
      } else {
        heroBadge.textContent = 'Build your streak';
        heroTitle.textContent = 'Ready to crush your goals?';
      }
    }

    // 3. Aggregate Streaks
    const agg = this.store.getAggregateStats();
    const curStreakEl = document.getElementById('dashboard-current-streak');
    const longStreakEl = document.getElementById('dashboard-longest-streak');
    if (curStreakEl) curStreakEl.textContent = `${agg.maxCurrentStreak} d`;
    if (longStreakEl) longStreakEl.textContent = `${agg.maxLongestStreak} d`;

    // 4. Weekly Activity Mini Chart
    this.renderWeeklyChart();

    // 5. Habits Cards Grid
    this.renderDashboardHabits();
  }

  // --- Render Weekly Activity Chart ---
  renderWeeklyChart() {
    const container = document.getElementById('weekly-bars-container');
    if (!container) return;

    const days = [];
    const today = new Date();

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }

    const todayStr = toLocalDateString(today);

    container.innerHTML = days.map(d => {
      const dStr = toLocalDateString(d);
      const metrics = this.store.getDayMetrics(dStr);
      const dayName = d.toLocaleDateString(undefined, { weekday: 'narrow' });
      const isCurrentDay = dStr === todayStr;
      const isSelectedDay = dStr === this.selectedDateStr;
      const isPerfect = metrics.percentage === 100 && metrics.total > 0;

      return `
        <div class="weekly-bar-col ${isCurrentDay ? 'today' : ''} ${isSelectedDay ? 'selected' : ''}" 
             title="${formatDisplayDate(dStr)}: ${metrics.done}/${metrics.total} completed (${metrics.percentage}%)"
             style="cursor: pointer;"
             onclick="window.habitApp.selectDate('${dStr}')">
          <div class="bar-ratio">${metrics.done}/${metrics.total}</div>
          <div class="bar-track">
            <div class="bar-fill ${isPerfect ? 'perfect' : ''}" style="height: ${metrics.percentage}%;"></div>
          </div>
          <div class="bar-label">${dayName}</div>
        </div>
      `;
    }).join('');
  }

  selectDate(dateStr) {
    this.selectedDateStr = dateStr;
    this.render();
  }

  // --- Render Dashboard Habits List ---
  renderDashboardHabits() {
    const listContainer = document.getElementById('dashboard-habits-list');
    const emptyState = document.getElementById('dashboard-empty-state');
    if (!listContainer) return;

    // Filter habits scheduled for this date
    let habitsForDate = this.store.habits.filter(h => isHabitScheduledForDate(h, this.selectedDateStr));

    // Apply category filter
    if (this.activeCategoryFilter && this.activeCategoryFilter !== 'all') {
      habitsForDate = habitsForDate.filter(h => h.category === this.activeCategoryFilter);
    }

    // Apply search query
    if (this.searchQuery) {
      habitsForDate = habitsForDate.filter(h =>
        h.name.toLowerCase().includes(this.searchQuery) ||
        (h.description && h.description.toLowerCase().includes(this.searchQuery))
      );
    }

    if (habitsForDate.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    listContainer.innerHTML = habitsForDate.map(habit => {
      const isDone = this.store.isCompleted(habit.id, this.selectedDateStr);
      const streaks = this.store.calculateHabitStreaks(habit.id);
      const accentColor = habit.color || '#6366f1';

      return `
        <div class="habit-card ${isDone ? 'completed' : ''}" style="--habit-accent: ${accentColor};">
          <div class="habit-header-row">
            <div class="habit-icon-and-title">
              <div class="habit-icon-badge" style="background-color: ${accentColor}20; color: ${accentColor};">
                ${habit.icon || '⚡'}
              </div>
              <div>
                <h4 class="habit-name">${this.escapeHtml(habit.name)}</h4>
                ${habit.description ? `<p class="habit-desc">${this.escapeHtml(habit.description)}</p>` : ''}
              </div>
            </div>
            <div class="habit-actions-dropdown">
              <button type="button" class="btn-icon btn-sm" onclick="window.habitApp.openHabitModal('${habit.id}')" title="Edit habit" aria-label="Edit habit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button type="button" class="btn-icon btn-sm text-danger" onclick="window.habitApp.openDeleteModal('${habit.id}')" title="Delete habit" aria-label="Delete habit">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          <div class="habit-meta-row">
            <span class="habit-cat-badge">${habit.category}</span>
            ${habit.target ? `<span class="habit-target-badge">🎯 ${this.escapeHtml(habit.target)}</span>` : ''}
            <span class="habit-streak-pill" title="Current consecutive scheduled streak">
              🔥 ${streaks.currentStreak} ${streaks.currentStreak === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div class="habit-card-footer">
            <button type="button" class="habit-check-btn" onclick="window.habitApp.toggleHabit('${habit.id}')" aria-label="Toggle completion">
              <span class="habit-check-circle">
                ${isDone ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
              </span>
              <span>${isDone ? 'Completed' : 'Mark Done'}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Toggle Habit Completion Action ---
  toggleHabit(habitId) {
    const isNowComplete = this.store.toggleCompletion(habitId, this.selectedDateStr);

    if (isNowComplete) {
      // Sound feedback
      if (this.store.settings.sound) {
        this.sound.playCompletionChime();
      }

      // Check if all today's habits are now complete
      const metrics = this.store.getDayMetrics(this.selectedDateStr);
      if (metrics.percentage === 100 && metrics.total > 0 && this.store.settings.confetti) {
        this.confetti.burst();
        this.showToast('🎉 All habits completed! Phenomenal consistency!', 'success');
      } else {
        this.showToast('Habit marked complete! Streak updated.', 'success');
      }
    } else {
      this.showToast('Habit marked incomplete.', 'info');
    }

    this.render();
  }

  // --- Render Habit Management View ---
  renderManageHabits() {
    const container = document.getElementById('manage-habits-list');
    if (!container) return;

    const search = document.getElementById('manage-search-input');
    const query = search ? search.value.toLowerCase().trim() : '';
    const activeCatBtn = document.querySelector('#manage-category-filters .cat-pill.active');
    const activeCat = activeCatBtn ? activeCatBtn.dataset.category : 'all';

    let list = this.store.habits;

    if (activeCat && activeCat !== 'all') {
      list = list.filter(h => h.category === activeCat);
    }

    if (query) {
      list = list.filter(h =>
        h.name.toLowerCase().includes(query) ||
        (h.description && h.description.toLowerCase().includes(query))
      );
    }

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card card" style="grid-column: 1 / -1;">
          <div class="empty-icon">🔍</div>
          <h3>No matching habits found</h3>
          <p>Try adjusting your search query or create a new habit.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = list.map(habit => {
      const streaks = this.store.calculateHabitStreaks(habit.id);
      const accent = habit.color || '#6366f1';

      let scheduleText = 'Everyday';
      if (habit.scheduleType === 'weekdays') scheduleText = 'Mon - Fri';
      if (habit.scheduleType === 'custom') {
        const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        scheduleText = habit.customDays.map(d => daysMap[d]).join(', ');
      }

      return `
        <div class="manage-habit-card card" style="border-top: 4px solid ${accent};">
          <div class="habit-header-row">
            <div class="habit-icon-and-title">
              <div class="habit-icon-badge" style="background-color: ${accent}20; color: ${accent};">
                ${habit.icon || '⚡'}
              </div>
              <div>
                <h4 class="habit-name">${this.escapeHtml(habit.name)}</h4>
                <p class="habit-desc">${this.escapeHtml(habit.description || 'No description provided')}</p>
              </div>
            </div>
          </div>

          <div class="habit-meta-row mt-2">
            <span class="habit-cat-badge">${habit.category}</span>
            <span class="habit-target-badge">📅 ${scheduleText}</span>
            ${habit.target ? `<span class="habit-target-badge">🎯 ${this.escapeHtml(habit.target)}</span>` : ''}
          </div>

          <div class="manage-stats-grid">
            <div class="m-stat-box">
              <div class="m-stat-val text-warning">🔥 ${streaks.currentStreak}</div>
              <div class="m-stat-lbl">Active Streak</div>
            </div>
            <div class="m-stat-box">
              <div class="m-stat-val text-info">🏆 ${streaks.longestStreak}</div>
              <div class="m-stat-lbl">Best Streak</div>
            </div>
            <div class="m-stat-box">
              <div class="m-stat-val text-success">✓ ${streaks.totalCompletions}</div>
              <div class="m-stat-lbl">Total Done</div>
            </div>
          </div>

          <div class="manage-actions-row">
            <button type="button" class="btn btn-outline btn-sm" style="flex: 1;" onclick="window.habitApp.openHabitModal('${habit.id}')">
              Edit Routine
            </button>
            <button type="button" class="btn btn-outline btn-sm text-danger" onclick="window.habitApp.openDeleteModal('${habit.id}')">
              Delete
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // --- Render Calendar & Heatmap View ---
  renderCalendar() {
    const monthLabel = document.getElementById('calendar-month-year-label');
    const grid = document.getElementById('calendar-days-grid');
    if (!grid || !monthLabel) return;

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    monthLabel.textContent = `${monthNames[this.calendarMonth]} ${this.calendarYear}`;

    // Get first day of month and total days
    const firstDayIndex = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(this.calendarYear, this.calendarMonth, 0).getDate();

    const todayStr = toLocalDateString(new Date());

    let html = '';

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      html += `<div class="cal-day-cell other-month"><span class="cal-day-number">${dayNum}</span></div>`;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentMonthStr = String(this.calendarMonth + 1).padStart(2, '0');
      const currentDayStr = String(day).padStart(2, '0');
      const cellDateStr = `${this.calendarYear}-${currentMonthStr}-${currentDayStr}`;

      const metrics = this.store.getDayMetrics(cellDateStr);
      const isToday = cellDateStr === todayStr;
      const isSelected = cellDateStr === this.selectedDateStr;

      let statusClass = '';
      if (cellDateStr <= todayStr && metrics.total > 0) {
        if (metrics.percentage === 100) statusClass = 'status-perfect';
        else if (metrics.percentage > 0) statusClass = 'status-partial';
        else statusClass = 'status-missed';
      }

      html += `
        <div class="cal-day-cell ${statusClass} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
             onclick="window.habitApp.inspectCalendarDate('${cellDateStr}')"
             title="${formatDisplayDate(cellDateStr)}: ${metrics.done}/${metrics.total} completed">
          <span class="cal-day-number">${day}</span>
          <div class="cal-day-dots">
            ${metrics.done > 0 ? `<span class="cal-dot" style="background-color: ${metrics.percentage === 100 ? 'var(--success)' : 'var(--primary)'};"></span>` : ''}
          </div>
        </div>
      `;
    }

    grid.innerHTML = html;

    // Render 90-day Heatmap
    this.renderHeatmap();

    // Render Inspector for selected date
    this.renderDateInspector();
  }

  inspectCalendarDate(dateStr) {
    this.selectedDateStr = dateStr;
    this.renderCalendar();
  }

  // --- Render 90-Day Heatmap ---
  renderHeatmap() {
    const matrix = document.getElementById('heatmap-matrix');
    if (!matrix) return;

    const daysCount = 91; // ~13 weeks
    const today = new Date();
    let html = '';

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dStr = toLocalDateString(d);
      const metrics = this.store.getDayMetrics(dStr);

      let lvl = 0;
      if (metrics.total > 0) {
        if (metrics.percentage === 100) lvl = 4;
        else if (metrics.percentage >= 67) lvl = 3;
        else if (metrics.percentage >= 34) lvl = 2;
        else if (metrics.percentage > 0) lvl = 1;
      }

      html += `
        <div class="heat-box lvl-${lvl}" 
             title="${formatDisplayDate(dStr)}: ${metrics.percentage}% completed (${metrics.done}/${metrics.total})"
             onclick="window.habitApp.inspectCalendarDate('${dStr}')"
             style="cursor: pointer;"></div>
      `;
    }

    matrix.innerHTML = html;
  }

  // --- Render Day Inspector Drawer ---
  renderDateInspector() {
    const titleEl = document.getElementById('inspector-date-title');
    const subEl = document.getElementById('inspector-date-subtitle');
    const pillEl = document.getElementById('inspector-rate-pill');
    const listEl = document.getElementById('inspector-habits-list');

    if (!titleEl || !listEl) return;

    const metrics = this.store.getDayMetrics(this.selectedDateStr);
    titleEl.textContent = formatDisplayDate(this.selectedDateStr);
    subEl.textContent = `${metrics.done} of ${metrics.total} habits completed`;
    pillEl.textContent = `${metrics.percentage}%`;

    if (metrics.scheduled.length === 0) {
      listEl.innerHTML = '<p class="text-sm text-muted">No habits scheduled for this day.</p>';
      return;
    }

    listEl.innerHTML = metrics.scheduled.map(habit => {
      const isDone = this.store.isCompleted(habit.id, this.selectedDateStr);
      return `
        <div class="inspector-item ${isDone ? 'completed' : ''}">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span>${habit.icon || '⚡'}</span>
            <span class="inspector-item-title">${this.escapeHtml(habit.name)}</span>
          </div>
          <button type="button" class="btn btn-sm ${isDone ? 'btn-primary' : 'btn-outline'}" 
                  onclick="window.habitApp.toggleHabit('${habit.id}')">
            ${isDone ? '✓ Completed' : 'Mark Done'}
          </button>
        </div>
      `;
    }).join('');
  }

  // --- Render Statistics View ---
  renderStatistics() {
    const agg = this.store.getAggregateStats();

    // Top quad values
    const rateEl = document.getElementById('stats-completion-rate-30');
    const curStreakEl = document.getElementById('stats-current-streak-val');
    const longStreakEl = document.getElementById('stats-longest-streak-val');
    const totalDoneEl = document.getElementById('stats-total-completions');

    if (rateEl) rateEl.textContent = `${agg.rate30}%`;
    if (curStreakEl) curStreakEl.textContent = `${agg.maxCurrentStreak} days`;
    if (longStreakEl) longStreakEl.textContent = `${agg.maxLongestStreak} days`;
    if (totalDoneEl) totalDoneEl.textContent = agg.totalCompletionsCount;

    // Best habit card
    const bestCard = document.getElementById('best-habit-card');
    const bestName = document.getElementById('best-habit-name');
    const bestDesc = document.getElementById('best-habit-desc');
    const bestRate = document.getElementById('best-habit-rate');
    const bestStreak = document.getElementById('best-habit-streak');
    const bestTotal = document.getElementById('best-habit-total');

    if (agg.bestHabit && agg.bestHabit.habit) {
      if (bestCard) bestCard.style.display = 'block';
      if (bestName) bestName.textContent = agg.bestHabit.habit.name;
      if (bestDesc) bestDesc.textContent = agg.bestHabit.habit.description || 'Highest consistency routine';
      if (bestRate) bestRate.textContent = `${agg.rate30}%`;
      if (bestStreak) bestStreak.textContent = `${agg.bestHabit.streak} days`;
      if (bestTotal) bestTotal.textContent = agg.bestHabit.total;
    } else {
      if (bestCard) bestCard.style.display = 'none';
    }

    // Breakdown Table Body
    const tbody = document.getElementById('stats-habits-table-body');
    if (!tbody) return;

    tbody.innerHTML = this.store.habits.map(habit => {
      const streaks = this.store.calculateHabitStreaks(habit.id);
      let scheduleText = 'Everyday';
      if (habit.scheduleType === 'weekdays') scheduleText = 'Mon - Fri';
      if (habit.scheduleType === 'custom') scheduleText = 'Custom';

      return `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.6rem;">
              <span>${habit.icon || '⚡'}</span>
              <strong>${this.escapeHtml(habit.name)}</strong>
            </div>
          </td>
          <td><span class="habit-cat-badge">${habit.category}</span></td>
          <td>${scheduleText}</td>
          <td><span class="text-warning">🔥 ${streaks.currentStreak} d</span></td>
          <td><span class="text-info">🏆 ${streaks.longestStreak} d</span></td>
          <td>${streaks.totalCompletions}</td>
          <td>
            <span class="badge" style="background-color: var(--success);">${Math.min(100, Math.round((streaks.totalCompletions / 30) * 100))}%</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // --- Utility: Safe HTML Escape ---
  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

// Instantiate and expose globally for inline HTML click handlers
window.addEventListener('DOMContentLoaded', () => {
  window.habitApp = new HabitApp();
});
