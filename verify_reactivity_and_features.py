from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Capture dialogs (alerts)
        page.on("dialog", lambda d: print(f"DIALOG: {d.message}") or d.accept())

        print("Navigating to game...")
        page.goto("http://localhost:8081/web/index.html")
        page.wait_for_selector("#click-btn")

        # 1. Cloud Login Fallback
        print("Checking Cloud Login...")
        cloud_btn = page.locator("#btn-cloud-login")
        if cloud_btn.count() > 0:
            cloud_btn.click()
            # Expecting a dialog "Cloud services are currently unavailable..."
            time.sleep(1)
        else:
            print("FAILURE: Cloud Login button not found.")

        # 2. Story Button
        print("Checking Story Button...")
        story_btn = page.locator("#btn-story")
        if story_btn.count() > 0:
            story_btn.click()
            time.sleep(0.5)
            modal = page.locator(".modal-overlay").first
            if modal.is_visible():
                print("SUCCESS: Story Modal opened.")
                page.keyboard.press("Escape")
            else:
                print("FAILURE: Story Modal did not open.")
        else:
            print("FAILURE: Story Button not found.")

        # 3. Population UI
        print("Checking Population UI...")
        pop_display = page.locator("text=Population:") # Flexible match
        if pop_display.count() > 0:
            print(f"SUCCESS: Population display found: {pop_display.first.inner_text()}")
        else:
            print("FAILURE: Population display NOT found.")

        # 4. Tech Reactivity
        print("Checking Tech Reactivity...")
        page.click("#tab-btn-research")
        # Buy "Fire Discovery" (cost 10 knowledge). Cheat resources first.
        page.evaluate("window.gameState.resources.knowledge += 1000; window.updateUI();")

        # Find node
        fire_node = page.locator(".tech-node").filter(has_text="Fire Discovery").first
        if fire_node.count() > 0:
            fire_node.click()
            time.sleep(0.5)
            # Check class 'researched'
            if "researched" in fire_node.get_attribute("class"):
                print("SUCCESS: Tech node visually updated to 'researched'.")
            else:
                print("FAILURE: Tech node did NOT visually update.")
        else:
            print("FAILURE: Fire Discovery node not found.")

        browser.close()

if __name__ == "__main__":
    run()
