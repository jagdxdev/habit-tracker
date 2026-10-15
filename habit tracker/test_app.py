import json
import os
import sys
import http.server
import socketserver
import threading
import urllib.request
import time

def test_manifest():
    print("Testing manifest.webmanifest...")
    assert os.path.exists("manifest.webmanifest"), "manifest.webmanifest missing"
    with open("manifest.webmanifest", "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["name"] == "Habit Tracker — Daily Routine & Discipline"
    assert data["short_name"] == "HabitTracker"
    assert data["display"] == "standalone"
    assert len(data["icons"]) >= 2
    for icon in data["icons"]:
        assert os.path.exists(icon["src"]), f"Icon file {icon['src']} does not exist on disk"
    print("[PASS] manifest.webmanifest is valid and icons exist!")

def test_assets():
    print("Testing core files...")
    required_files = [
        "index.html",
        "style.css",
        "app.js",
        "service-worker.js",
        "assets/icons/logo.png",
        "assets/icons/favicon.png",
        "assets/icons/icon-192.png",
        "assets/icons/icon-512.png",
        "assets/icons/icon.svg",
        "assets/icons/favicon.svg"
    ]
    for rf in required_files:
        assert os.path.exists(rf), f"Required file missing: {rf}"
        assert os.path.getsize(rf) > 0, f"File is empty: {rf}"
    print("[PASS] All required files exist and are non-empty!")

def test_http_server():
    print("Starting local HTTP server on port 8765 to test PWA serving...")
    PORT = 8765
    Handler = http.server.SimpleHTTPRequestHandler
    
    # Custom handler with silent logging for clean test output
    class QuietHandler(Handler):
        def log_message(self, format, *args):
            pass

    httpd = socketserver.TCPServer(("", PORT), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    time.sleep(0.5)

    urls = [
        f"http://localhost:{PORT}/index.html",
        f"http://localhost:{PORT}/style.css",
        f"http://localhost:{PORT}/app.js",
        f"http://localhost:{PORT}/manifest.webmanifest",
        f"http://localhost:{PORT}/service-worker.js",
        f"http://localhost:{PORT}/assets/icons/logo.png",
        f"http://localhost:{PORT}/assets/icons/favicon.png",
        f"http://localhost:{PORT}/assets/icons/icon-192.png",
        f"http://localhost:{PORT}/assets/icons/icon-512.png",
        f"http://localhost:{PORT}/assets/icons/icon.svg"
    ]

    for url in urls:
        req = urllib.request.urlopen(url)
        assert req.status == 200, f"Failed to fetch {url}, status: {req.status}"
        data = req.read()
        assert len(data) > 0, f"Empty response from {url}"
        print(f"[PASS] Fetched {url} (status 200, {len(data)} bytes)")

    httpd.shutdown()
    print("[PASS] Local HTTP server test passed flawlessly!")

if __name__ == "__main__":
    try:
        test_manifest()
        test_assets()
        test_http_server()
        print("\n=== ALL AUTOMATED CHECKS PASSED SUCCESSFULLY ===")
    except Exception as e:
        print(f"TEST FAILED: {e}", file=sys.stderr)
        sys.exit(1)
