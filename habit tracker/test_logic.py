import datetime

def is_habit_scheduled_for_date(schedule_type, custom_days, d):
    # d.weekday(): 0=Mon, ..., 6=Sun
    # In JS: 0=Sun, 1=Mon, ..., 6=Sat
    js_day = (d.weekday() + 1) % 7
    if schedule_type == 'everyday':
        return True
    elif schedule_type == 'weekdays':
        return js_day in [1, 2, 3, 4, 5]
    elif schedule_type == 'custom':
        return js_day in custom_days
    return True

def calculate_streaks(schedule_type, custom_days, completions_set, today):
    # completions_set has strings "YYYY-MM-DD"
    # Current streak
    current_streak = 0
    check_d = today
    is_today = True

    for _ in range(365):
        d_str = check_d.strftime("%Y-%m-%d")
        scheduled = is_habit_scheduled_for_date(schedule_type, custom_days, check_d)
        if scheduled:
            if d_str in completions_set:
                current_streak += 1
            else:
                if not is_today:
                    break
        is_today = False
        check_d -= datetime.timedelta(days=1)

    # Longest streak
    longest_streak = 0
    temp_streak = 0
    iter_d = today - datetime.timedelta(days=90)
    today_str = today.strftime("%Y-%m-%d")

    while iter_d <= today:
        d_str = iter_d.strftime("%Y-%m-%d")
        if is_habit_scheduled_for_date(schedule_type, custom_days, iter_d):
            if d_str in completions_set:
                temp_streak += 1
                if temp_streak > longest_streak:
                    longest_streak = temp_streak
            else:
                if d_str != today_str:
                    temp_streak = 0
        iter_d += datetime.timedelta(days=1)

    return current_streak, max(longest_streak, current_streak)

def test_streaks():
    print("Testing streak calculation logic...")
    today = datetime.date(2026, 10, 15) # Thursday
    
    # Case 1: Everyday habit, completed today, yesterday, and 2 days ago -> streak = 3
    completions = {"2026-10-15", "2026-10-14", "2026-10-13"}
    cur, longest = calculate_streaks('everyday', [], completions, today)
    assert cur == 3, f"Expected 3, got {cur}"
    assert longest == 3, f"Expected 3, got {longest}"

    # Case 2: Today not completed yet, but yesterday and day before completed -> streak = 2 (not broken yet!)
    completions = {"2026-10-14", "2026-10-13"}
    cur, longest = calculate_streaks('everyday', [], completions, today)
    assert cur == 2, f"Expected 2, got {cur}"

    # Case 3: Weekdays habit (Mon-Fri)
    # 2026-10-12 is Monday.
    # 2026-10-09 is Friday.
    # Weekend is 2026-10-10 (Sat) and 2026-10-11 (Sun).
    # If completed Fri (09) and Mon (12), streak across weekend is NOT broken!
    monday = datetime.date(2026, 10, 12)
    completions = {"2026-10-09", "2026-10-12"}
    cur, longest = calculate_streaks('weekdays', [], completions, monday)
    assert cur == 2, f"Expected 2, got {cur} (Weekend should not break weekday habit streak)"

    print("[PASS] Streak algorithm handles schedules, weekends, and active-day states correctly!")

if __name__ == "__main__":
    test_streaks()
    print("[PASS] All logic unit tests passed successfully!")
