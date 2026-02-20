import sys
import threading
import time
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

SERVER_PORT = 8081

def start_server():
    # Serve from the current working directory (repo root)
    # This allows access to /web/index.html
    httpd = HTTPServer(('', SERVER_PORT), SimpleHTTPRequestHandler)
    print(f"Server started at http://localhost:{SERVER_PORT}")
    httpd.serve_forever()

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Set a large viewport to avoid mobile layout/media queries
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        console_errors = []
        # Capture console errors
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        # Capture unhandled exceptions
        page.on("pageerror", lambda exc: console_errors.append(str(exc)))

        url = f"http://localhost:{SERVER_PORT}/web/index.html"
        print(f"Navigating to {url}...")

        try:
            page.goto(url)
            # Wait for network idle to ensure modules are loaded
            page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return False

        if console_errors:
            print("Errors detected during load:")
            for err in console_errors:
                print(f"  [Console] {err}")
            return False

        # Verify UI Elements
        try:
            # Check Title
            title = page.title()
            print(f"Page Title: {title}")

            # Check Click Counter
            clicks_el = page.locator("#res-clicks")
            initial_text = clicks_el.inner_text()
            print(f"Initial Clicks: {initial_text}")

            if not initial_text.isdigit():
                print("Error: Click counter is not a number.")
                return False

            initial_val = int(initial_text)

            # Click Button
            btn = page.locator("#click-btn")
            if not btn.is_visible():
                print("Error: Click button not visible.")
                return False

            print("Clicking button...")
            btn.click()

            # Wait for UI update (game loop tick is 100ms)
            time.sleep(0.5)

            new_text = clicks_el.inner_text()
            print(f"New Clicks: {new_text}")

            if int(new_text) <= initial_val:
                print("Error: Clicks did not increase.")
                return False

        except Exception as e:
            print(f"Verification Logic Error: {e}")
            return False

        if console_errors:
            print("Errors detected during runtime:")
            for err in console_errors:
                print(f"  [Console] {err}")
            return False

        print("SUCCESS: Game loaded and basic interaction verified.")
        return True

if __name__ == "__main__":
    # Ensure we are in the repo root
    if not os.path.exists("web/index.html"):
        print("Error: content not found. Run from repo root.")
        sys.exit(1)

    # Start Server
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(2) # Warmup

    try:
        success = verify()
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"Critical Error: {e}")
        sys.exit(1)

    sys.exit(0)
