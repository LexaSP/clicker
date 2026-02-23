import sys
import threading
import time
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

SERVER_PORT = 8083

def start_server():
    httpd = HTTPServer(('', SERVER_PORT), SimpleHTTPRequestHandler)
    print(f"Server started at http://localhost:{SERVER_PORT}")
    httpd.serve_forever()

def check_visibility(page, selector, name):
    try:
        el = page.locator(selector).first
        if not el.is_visible():
            print(f"FAIL: {name} ({selector}) is HIDDEN.")
            # Check properties
            props = el.evaluate("""el => {
                const style = window.getComputedStyle(el);
                return {
                    display: style.display,
                    visibility: style.visibility,
                    opacity: style.opacity,
                    width: el.offsetWidth,
                    height: el.offsetHeight,
                    innerHTML: el.innerHTML.substring(0, 100)
                }
            }""")
            print(f"  - Props: {props}")
            return False
        else:
            print(f"PASS: {name} is visible.")
            return True
    except Exception as e:
        print(f"ERROR checking {name}: {e}")
        return False

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        # Capture Console
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        page.add_init_script("localStorage.clear();")

        url = f"http://localhost:{SERVER_PORT}/web/index.html"
        print(f"Navigating to {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        check_visibility(page, "#click-btn", "Click Button")
        check_visibility(page, "#btn-AutoClicker", "AutoClicker Button")
        check_visibility(page, "#building-list", "Building List")

        # Check Tech Tree Visibility logic
        # Is fire discovery visible?
        # Assuming we can find it via text if classes are dynamic
        fire = page.get_by_text("Fire Discovery").first
        if fire.is_visible():
             print("PASS: Fire Discovery tech is visible.")
        else:
             print("FAIL: Fire Discovery tech is NOT visible.")

        browser.close()

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1)
    verify()
    sys.exit(0)
