from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    print("Navigating to game...")
    page.goto("http://localhost:8080/index.html")
    page.wait_for_selector("#click-btn")

    # 1. Fresh Start Check
    print("Checking Stone Age visibility...")
    # Research visible
    expect(page.locator("#tab-btn-research")).to_be_visible()
    expect(page.locator("#tab-btn-achievements")).to_be_visible()

    # Hidden tabs
    hidden_tabs = ["#tab-btn-expeditions", "#tab-btn-war", "#tab-btn-trade"]
    for sel in hidden_tabs:
        expect(page.locator(sel)).not_to_be_visible()
    print("PASS: Advanced tabs hidden in Stone Age.")

    # 2. Advance to Bronze Age
    print("Advancing to Bronze Age...")
    page.evaluate("window.gameState.era = 'Bronze Age'")
    page.evaluate("window.updateUI()")

    # Expeditions/War should appear
    expect(page.locator("#tab-btn-expeditions")).to_be_visible()
    expect(page.locator("#tab-btn-war")).to_be_visible()
    # Trade (Iron Age) still hidden
    expect(page.locator("#tab-btn-trade")).not_to_be_visible()
    print("PASS: Bronze Age features unlocked.")

    # 3. Advance to Iron Age
    print("Advancing to Iron Age...")
    page.evaluate("window.gameState.era = 'Iron Age'")
    page.evaluate("window.updateUI()")

    expect(page.locator("#tab-btn-trade")).to_be_visible()
    print("PASS: Iron Age (Market) unlocked.")

    # 4. Advance to Future
    print("Advancing to Future Age...")
    page.evaluate("window.gameState.era = 'Future Age'")
    page.evaluate("window.updateUI()")

    # Check Space
    # Wait for dynamic injection if needed (updateUI calls inject)
    # The space button logic in script.js is: if era==Future && !space -> gen space.
    # updateUI handles this check if we call advancedEra logic or if we fake it.
    # checkEraProgress calls advanceEra. Here we just set era string.
    # The injectDynamicTabs logic for space is separate?
    # Actually tab-btn-space is NOT in injectDynamicTabs, it's inside `renderSpace`.
    # `renderSpace` is called in updateUI -> No, renderSpace is typically called if the view is active or we need to update it.
    # But `renderSpace` handles button injection.
    # Let's call renderSpace manually or assume updateUI calls it?
    # Searching script.js... `renderSpace` is NOT called in `updateUI`.
    # It is called in `tick`? No.
    # Wait, `renderSpace` creates the button. If it's not called, no button.
    # It is called in `advanceEra`?
    # Ah, `renderSpace` logic: if (!space) hide. If (space) ensure button.
    # So we need to generate planets in state.

    page.evaluate("window.gameState.space = { planets: [{name:'Mars', colonized:false}] }")
    page.evaluate("window.renderSpace()") # Force render to inject button
    page.evaluate("window.updateUI()") # Check unlocks

    expect(page.locator("#tab-btn-space")).to_be_visible()
    print("PASS: Space unlocked.")

    page.screenshot(path="verification/progression_verified.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
