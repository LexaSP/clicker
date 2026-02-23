from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print("Navigating to game...")
        page.goto("http://localhost:8081/web/index.html")
        page.wait_for_selector("#click-btn")

        # 1. Verify LumberCamp Existence
        print("Checking for LumberCamp...")
        lc_btn = page.locator("#btn-LumberCamp")
        if lc_btn.count() > 0:
            print("SUCCESS: LumberCamp button found.")
        else:
            print("FAILURE: LumberCamp button NOT found.")

        # 2. Verify Production UI Scaling
        print("Checking Production UI Scaling...")
        # Add a LumberCamp
        page.evaluate("window.buyBuilding('LumberCamp')")
        time.sleep(0.1)

        # Check text
        prod_text = page.locator("#prod-text-LumberCamp").inner_text()
        print(f"LumberCamp Text: {prod_text}")
        if "Total:" in prod_text:
            print("SUCCESS: Total production displayed.")
        else:
            print("FAILURE: Total production NOT displayed.")

        browser.close()

if __name__ == "__main__":
    run()
