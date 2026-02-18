import os
import re
import sys

def check_imports(root_dir):
    errors = []
    js_files = []

    # Find all JS files
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.endswith('.js'):
                js_files.append(os.path.join(dirpath, filename))

    # Check imports in each file
    import_pattern = re.compile(r"import\s+(?:.*?from\s+)?['\"](.*?)['\"]")

    for file_path in js_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            matches = import_pattern.findall(content)
            for import_path in matches:
                # Ignore absolute URLs (http://, https://)
                if import_path.startswith('http://') or import_path.startswith('https://'):
                    continue

                # Resolve relative path
                dir_name = os.path.dirname(file_path)
                target_path = os.path.normpath(os.path.join(dir_name, import_path))

                if not os.path.exists(target_path):
                    errors.append(f"Missing import in {file_path}: '{import_path}' (resolved to {target_path})")

        except Exception as e:
            errors.append(f"Error reading {file_path}: {str(e)}")

    return errors

if __name__ == "__main__":
    web_dir = os.path.join(os.getcwd(), 'web')
    if not os.path.exists(web_dir):
        print(f"Error: Directory '{web_dir}' not found.")
        sys.exit(1)

    print(f"Scanning '{web_dir}' for broken imports...")
    issues = check_imports(web_dir)

    if issues:
        print("\nFound the following issues:")
        for issue in issues:
            print(f"  - {issue}")
        sys.exit(1)
    else:
        print("\nNo broken imports found.")
        sys.exit(0)
