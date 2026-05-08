import os
import re

def fix_imports():
    root_dir = r"c:\Users\celio.veloso\Documents\Projetinho 2\Chatinho"
    # Regex to match imports from auth/[...nextauth]/route
    pattern = re.compile(r"from ['\"].*auth/\[\.\.\.nextauth\]/route['\"]")
    replacement = "from '@/lib/auth'"

    for root, dirs, files in os.walk(root_dir):
        if "node_modules" in dirs:
            dirs.remove("node_modules")
        if ".next" in dirs:
            dirs.remove(".next")
            
        for file in files:
            if file.endswith((".ts", ".tsx")):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = pattern.sub(replacement, content)
                
                if new_content != content:
                    print(f"Fixed: {filepath}")
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)

if __name__ == "__main__":
    fix_imports()
