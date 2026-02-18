from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to single file build...")
    # Serve from root, so dist/game.html
    page.goto("http://localhost:8081/dist/game.html")

    # 1. Verify Core Load
    print("Checking title and main button...")
    expect(page).to_have_title("History Clicker Web")
    expect(page.locator("#click-btn")).to_be_visible()

    # 2. Check Logic (Manual Click)
    print("Checking click logic...")
    page.locator("#click-btn").click()
    # Expect resource to increment
    # Initially 0, after click > 0
    clicks_el = page.locator("#res-clicks")
    expect(clicks_el).not_to_have_text("0")
    print("PASS: Click registered.")

    # 3. Check Tabs (Research)
    print("Checking tabs...")
    expect(page.locator("#research-view")).to_be_visible()
    # Check if tree rendered (JS populated)
    # The SVG should have children
    # Expect at least one node
    expect(page.locator(".tech-node").first).to_be_visible()
    print("PASS: Research tree rendered.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
