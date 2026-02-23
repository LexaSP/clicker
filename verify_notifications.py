from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:8081/web/index.html")

        # Wait for game to init
        page.wait_for_selector("#click-btn")

        # Inject code to trigger the Iron Age notification manually
        # This simulates advancing to Iron Age
        page.evaluate("""
            window.gameState.era = 'Iron Age';
            // Clear tutorials array to allow trigger
            window.gameState.tutorials = [];
        """)

        # Wait for the modal to appear (checkTutorials runs in loop)
        try:
            page.wait_for_selector("#tutorial-modal", timeout=5000)
            time.sleep(1) # Wait for fade-in animation
            page.screenshot(path="notification_style.png")
            print("Screenshot saved to notification_style.png")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="notification_error.png")

        browser.close()

if __name__ == "__main__":
    run()
