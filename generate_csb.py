import os
import json
import lzstring # Not available in standard env, will use plain JSON if needed or just base64

def get_files(path, base_path):
    files = {}
    for root, dirs, filenames in os.walk(path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
        
        for filename in filenames:
            file_path = os.path.join(root, filename)
            rel_path = os.path.relpath(file_path, base_path)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    files[rel_path.replace('\\', '/')] = {"content": content}
            except:
                pass # Skip binary files
    return files

base = r'c:\Users\Luiz Paulo Juvencio\Desktop\pure-dev-dashboard-01454-e544dc18-main'
all_files = {}
# Add root files
for f in ['package.json', 'tsconfig.json', 'vite.config.ts', 'tailwind.config.ts', 'postcss.config.js', 'index.html', 'components.json']:
    p = os.path.join(base, f)
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as file:
            all_files[f] = {"content": file.read()}

# Add src
all_files.update(get_files(os.path.join(base, 'src'), base))

# Add server (optional but good for context)
all_files.update(get_files(os.path.join(base, 'server'), base))

payload = {"files": all_files}
with open('csb_payload.json', 'w', encoding='utf-8') as f:
    json.dump(payload, f)

print("Payload generated: csb_payload.json")
