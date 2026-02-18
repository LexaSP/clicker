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

    # 1. Check Settings / Accessibility
    print("Checking Accessibility Button...")
    hc_btn = page.locator("button", has_text="High Contrast Mode")
    hc_btn.wait_for(state="visible")
    hc_btn.click()
    page.wait_for_timeout(1000)

    classes = page.locator("body").get_attribute("class")
    print(f"Body classes: {classes}")
    if "accessibility-mode" in classes:
        print("Accessibility Mode Verified.")
    else:
        print("Accessibility Mode FAILED.")

    # 2. Check Diplomacy Tab
    print("Checking Diplomacy & Espionage...")
    page.locator("button.tab-btn", has_text="Diplomacy 🤝").click()
    page.wait_for_timeout(500) # Wait for tab switch

    try:
        page.locator("h3", has_text="Espionage Agency").wait_for(state="visible")
        page.locator("h3", has_text="World Congress").wait_for(state="visible")
        page.locator("button", has_text="Recruit Spy").wait_for(state="visible")
        print("Espionage Verified.")
    except Exception as e:
        print(f"Espionage/Diplomacy Failed: {e}")
        # Debug
        display = page.evaluate("document.getElementById('diplomacy-view').style.display")
        print(f"Diplomacy View Display: {display}")
        try:
            html = page.locator('#espionage-list').inner_html()
            print(f"Espionage List HTML: {html}")
        except:
            print("Espionage List HTML: Not Found")

    # 3. Check Market Tab
    print("Checking Stock Market...")
    page.locator("button.tab-btn", has_text="Market ⚖️").click()
    page.wait_for_timeout(500)

    try:
        page.locator("h3", has_text="Stock Exchange").wait_for(state="visible")
        page.locator("strong", has_text="Acme Corp").wait_for(state="visible")
        print("Stock Market Verified.")
    except Exception as e:
        print(f"Stock Market Failed: {e}")
        display = page.evaluate("document.getElementById('trade-view').style.display")
        print(f"Trade View Display: {display}")
        try:
            html = page.locator('#stock-list').inner_html()
            print(f"Stock List HTML: {html}")
        except:
            print("Stock List HTML: Not Found")

    # 4. Check Dynasty
    print("Checking Dynasty...")
    page.locator("button.tab-btn", has_text="Gov ⚖️").click()
    page.wait_for_timeout(500)

    try:
        page.locator("h4", has_text="Ruling Dynasty").wait_for(state="visible")
        print("Dynasty Verified.")
    except Exception as e:
        print(f"Dynasty Failed: {e}")
        display = page.evaluate("document.getElementById('government-view').style.display")
        print(f"Gov View Display: {display}")
        try:
            html = page.locator('#gov-current').inner_html()
            print(f"Gov Current HTML: {html}")
        except:
            print("Gov Current HTML: Not Found")

    page.screenshot(path="verification/expansion_verified.png")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
