from playwright.sync_api import sync_playwright, expect
import re

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Console logging
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
    page.on("pageerror", lambda err: print(f"ERROR: {err}"))

    print("Navigating to game...")
    page.goto("http://localhost:8080/index.html")
    page.wait_for_selector("#click-btn")

    # 1. Verify Modding Restriction
    print("Checking Mod Button Restriction...")
    mods_btn = page.locator("button", has_text="Mods 🛠️")
    expect(mods_btn).to_be_visible()

    # Listen for dialog (alert)
    page.on("dialog", lambda d: d.accept())

    mods_btn.click()
    page.wait_for_timeout(1000)

    # Since we are fresh start, it should have alerted restriction
    # We can't easily verify alert content in sync mode without handling logic,
    # but if the modal didn't open, that's good.
    if page.locator("#mod-modal").is_visible():
        print("FAIL: Mod modal opened without NG+")
    else:
        print("PASS: Mod modal restricted.")

    # 2. Verify Leaderboards UI
    print("Checking Leaderboards...")
    lb_btn = page.locator("button", has_text="Leaderboards 🏆")
    lb_btn.click()
    page.wait_for_selector("#lb-modal")

    # Check Range Selector
    expect(page.locator("#lb-range")).to_be_visible()
    print("PASS: Leaderboard Range Selector visible.")

    # Close
    page.locator("button", has_text="Close").click()

    # 3. Simulate Modding (Force State)
    print("Simulating Modding...")
    page.evaluate("window.gameState.stats.transcendenceCount = 1") # Enable mods access

    mods_btn.click()
    page.wait_for_selector("#mod-modal")
    print("PASS: Mod modal opened with NG+ stats.")

    # Apply Mod
    page.fill("#mod-input", '{"techs": []}')
    page.evaluate("window.confirm = () => true") # Auto confirm
    page.locator("button", has_text="Load Mod").click()

    # Check isModded flag
    is_modded = page.evaluate("window.gameState.isModded")
    print(f"isModded: {is_modded}")

    if is_modded:
        print("PASS: State flagged as Modded.")
    else:
        print("FAIL: State NOT flagged.")

    # Check Leaderboard Warning
    lb_btn.click()
    page.wait_for_selector("#lb-modal")
    content = page.locator("#lb-modal").inner_text()
    if "MODDED SAVE" in content:
        print("PASS: Leaderboard shows Modded Warning.")
    else:
        print("FAIL: No Modded Warning.")

    page.screenshot(path="verification/final_features.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
