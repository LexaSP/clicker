import asyncio
from playwright.async_api import async_playwright
import http.server
import socketserver
import threading
import os
import sys

PORT = 8083
DIRECTORY = "web"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Server started at http://localhost:{PORT}")
        httpd.serve_forever()

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Start server
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()

        await asyncio.sleep(1)

        print(f"Navigating to http://localhost:{PORT}/index.html...")
        await page.goto(f"http://localhost:{PORT}/index.html")

        # Wait for building list
        await page.wait_for_selector("#building-list button")

        # Take screenshot of the building list container
        element = await page.query_selector("#buildings-container")
        if element:
            await element.screenshot(path="verification/buildings_ui.png")
            print("Screenshot saved to verification/buildings_ui.png")
        else:
            print("Error: #buildings-container not found")
            await page.screenshot(path="verification/full_page_error.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
