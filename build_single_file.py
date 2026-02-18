import os
import re

WEB_DIR = "web"
DIST_DIR = "dist"
INDEX_FILE = "index.html"
STYLE_FILE = "style.css"
MAIN_SCRIPT = "script.js"

def get_imports(filepath):
    imports = []
    if not os.path.exists(filepath):
        print(f"Error: {filepath} not found")
        return []

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        matches = re.findall(r"import .* from ['\"](.*)['\"];?", content)
        for match in matches:
            if match.startswith("./"):
                imports.append(match[2:])
            else:
                imports.append(match)
    return imports

def build():
    cwd = os.getcwd()
    print(f"Current working directory: {cwd}")

    if not os.path.exists(DIST_DIR):
        os.makedirs(DIST_DIR)

    main_script_path = os.path.join(WEB_DIR, MAIN_SCRIPT)
    deps = get_imports(main_script_path)

    # Read all JS files
    js_content = ""

    # Append dependencies first
    # Simple dependency resolution (naïve) - ideally we'd recurse or sort, but here imports are flat enough?
    # script.js imports many things. Those things might import others.
    # e.g., combat.js imports nothing? content-gen.js imports nothing?
    # Let's assume shallow imports for now or minimal depth.
    # Actually, we should just traverse all .js files in web/ and concat them, excluding script.js, then script.js last?
    # But order matters.
    # Let's stick to script.js imports order for now.

    processed = set()

    for dep in deps:
        if dep in processed: continue
        processed.add(dep)

        path = os.path.join(WEB_DIR, dep)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                code = f.read()
                # Strip exports
                code = re.sub(r"export (const|let|var|function|class|default)", r"\1", code)
                # Strip imports
                code = re.sub(r"import .* from .*", "", code)
                js_content += f"\n// --- {dep} ---\n{code}\n"
        else:
            print(f"Warning: Dependency {dep} not found.")

    # Append Main Script
    with open(main_script_path, "r", encoding="utf-8") as f:
        code = f.read()
        # Strip imports
        code = re.sub(r"import .* from .*", "", code)
        js_content += f"\n// --- {MAIN_SCRIPT} ---\n{code}\n"

    # Read CSS
    css_content = ""
    with open(os.path.join(WEB_DIR, STYLE_FILE), "r", encoding="utf-8") as f:
        css_content = f.read()

    # Read HTML and Inject
    with open(os.path.join(WEB_DIR, INDEX_FILE), "r", encoding="utf-8") as f:
        html = f.read()

    # Inject CSS
    html = html.replace('<link rel="stylesheet" href="style.css">', f"<style>{css_content}</style>")

    # Inject JS (remove module scripts first)
    html = re.sub(r'<script type="module" src=".*"></script>', "", html)

    # Insert new script before body end
    script_tag = f"<script>{js_content}</script>"
    html = html.replace("</body>", f"{script_tag}</body>")

    output_path = os.path.join(DIST_DIR, "game.html")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Build complete: {os.path.abspath(output_path)}")
    print(f"File size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    build()
