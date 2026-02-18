from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Console logging
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"ERROR: {err}"))

    print("Navigating to game...")
    page.goto("http://localhost:8080/index.html")
    page.wait_for_selector("#building-list")

    # Verify Buildings rendered
    print("Checking AutoClicker button...")
    btn = page.locator("#btn-build-AutoClicker")
    expect(btn).to_be_visible()

    # Verify ID structure (initStaticUI success)
    cost = page.locator("#cost-AutoClicker")
    expect(cost).to_be_visible()

    # Wait for updateUI to run a bit
    time.sleep(1)

    # Screenshot
    page.screenshot(path="verification/buildings_verified.png")
    print("Screenshot saved to verification/buildings_verified.png")

    browser.close()

with sync_playwright() as p:
    run(p)
