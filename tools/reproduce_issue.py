import sys
import threading
import time
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright

SERVER_PORT = 8082

def start_server():
    # Serve from the current working directory (repo root)
    httpd = HTTPServer(('', SERVER_PORT), SimpleHTTPRequestHandler)
    print(f"Server started at http://localhost:{SERVER_PORT}")
    httpd.serve_forever()

def check_visibility(page, selector, name):
    try:
        el = page.locator(selector).first
        if not el.is_visible():
            print(f"FAIL: {name} ({selector}) is HIDDEN.")
            # Check style
            display = el.evaluate("el => window.getComputedStyle(el).display")
            print(f"  - Display: {display}")
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

        # Clear LocalStorage to ensure fresh save
        page.add_init_script("localStorage.clear();")

        url = f"http://localhost:{SERVER_PORT}/web/index.html"
        print(f"Navigating to {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")
        time.sleep(1) # Allow init/render

        # Check Click Button
        check_visibility(page, "#click-btn", "Click Button")

        # Check Building List (AutoClicker)
        # initBuildingsUI creates id="btn-AutoClicker"
        if not check_visibility(page, "#btn-AutoClicker", "AutoClicker Button"):
            # Check parent
            check_visibility(page, "#building-list", "Building List Container")

        # Check Research Tab
        check_visibility(page, "#tab-btn-research", "Research Tab Button")

        # Check Tech Tree (Fire Discovery)
        # Techs don't have deterministic IDs in my code?
        # id=`tech_${eraIndex}_${i}` -> tech_0_1
        check_visibility(page, "#research-view", "Research View")
        # tech nodes are class .tech-node.
        # Let's find one.
        nodes = page.locator(".tech-node")
        count = nodes.count()
        print(f"Found {count} tech nodes.")
        if count > 0:
            first_node = nodes.first
            if first_node.is_visible():
                print("PASS: First tech node is visible.")
            else:
                print("FAIL: First tech node is HIDDEN.")
                display = first_node.evaluate("el => window.getComputedStyle(el).display")
                print(f"  - Display: {display}")
        else:
            print("FAIL: No tech nodes found in DOM.")

        browser.close()
        return True

if __name__ == "__main__":
    if not os.path.exists("web/index.html"):
        print("Error: content not found.")
        sys.exit(1)

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1)

    try:
        verify()
    except Exception as e:
        print(f"Critical Error: {e}")
        sys.exit(1)
    sys.exit(0)
