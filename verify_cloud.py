from playwright.sync_api import sync_playwright

def verify_cloud_login():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the game
        page.goto("http://localhost:8080/web/index.html")

        # Wait for the sidebar to load and the cloud login button to appear
        # The button is injected asynchronously by initCloudSave
        try:
            page.wait_for_selector("#btn-cloud-login", timeout=10000)
            print("Cloud Login button found!")

            # Take a screenshot of the sidebar
            sidebar = page.locator("#sidebar")
            sidebar.screenshot(path="/home/jules/verification/sidebar_cloud_login.png")
            print("Screenshot saved to /home/jules/verification/sidebar_cloud_login.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_cloud_login()
