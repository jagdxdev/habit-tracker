import sys
import subprocess
import os

def push_with_token(token):
    token = token.strip()
    if not token:
        print("Error: Empty token provided.")
        return False

    git_exe = r"C:\Users\JAGDISH\AppData\Local\Programs\MinGit\cmd\git.exe"
    repo_url = f"https://jagdxdev:{token}@github.com/jagdxdev/habit-tracker.git"

    print("Setting remote origin with token...")
    subprocess.run([git_exe, "remote", "set-url", "origin", repo_url], check=True)

    print("Pushing to GitHub (main branch)...")
    result = subprocess.run([git_exe, "push", "-u", "origin", "main", "--force"], capture_output=True, text=True)

    # Clean up the token from remote url afterwards for security
    clean_url = "https://github.com/jagdxdev/habit-tracker.git"
    subprocess.run([git_exe, "remote", "set-url", "origin", clean_url], check=True)

    if result.returncode == 0:
        print("\n=======================================================")
        print("SUCCESS: Project pushed to https://github.com/jagdxdev/habit-tracker")
        print("=======================================================")
        return True
    else:
        print("Push failed with output:")
        print(result.stdout)
        print(result.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) > 1:
        token = sys.argv[1]
    else:
        token = input("Enter your GitHub Personal Access Token (starts with ghp_): ")
    push_with_token(token)
