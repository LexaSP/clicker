from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Handle alert
    page.on("dialog", lambda dialog: dialog.accept())

    print("Navigating to game...")
    # Assuming local file access or server
    page.goto("http://localhost:8080/index.html")
    page.wait_for_selector("#click-btn")

    # 1. Check Research Help Button (Visible by default)
    print("Checking Research Help Button...")
    btn = page.locator("#research-view .help-btn")
    expect(btn).to_be_visible()
    btn.click()
    print("Clicked Research Help.")

    # 2. Check Space Help Button (Future Age)
    print("Advancing to Future Age...")
    # Set Era
    page.evaluate("window.gameState.era = 'Future Age'")
    # Setup Space
    page.evaluate("window.gameState.space = { planets: [{name:'Mars', colonized:false}] }")
    # Trigger UI update to unlock tab button
    page.evaluate("window.updateUI()")
    # Force render space view content
    page.evaluate("window.renderSpace()")

    # Now show the tab (simulating click or direct call)
    page.evaluate("window.showTab('space')")

    space_btn = page.locator("#space-view .help-btn")
    expect(space_btn).to_be_visible()
    space_btn.click()
    print("Clicked Space Help.")

    # Take screenshot of Space View with Help Button
    page.screenshot(path="verification/help_verified.png")
    print("Screenshot saved to verification/help_verified.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
