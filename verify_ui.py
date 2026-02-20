
from playwright.sync_api import sync_playwright

def verify_ui_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:8080/web/index.html")

        # Wait for the sidebar to load
        try:
            page.wait_for_selector("#sidebar", timeout=10000)
            print("Sidebar found!")

            # Take a screenshot of the main game area
            page.screenshot(path="/home/jules/verification/new_ui_design.png")
            print("Screenshot saved to /home/jules/verification/new_ui_design.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_ui_changes()
