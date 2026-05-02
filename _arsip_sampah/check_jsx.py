import os
import re

def find_mismatches(directory):
    mismatches = []
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jsx', '.tsx')):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = f.readlines()
                        
                        stack = []
                        for i, line in enumerate(lines):
                            # Find all <h1...>, <h2...>, </h1>, </h2> tags in order on the line
                            # This regex finds opening and closing h1/h2 tags
                            # It ignores self-closing tags (though h1/h2 shouldn't be self-closing)
                            tag_regex = re.compile(r'<(h1|h2)[^>]*>|</(h1|h2)>', re.IGNORECASE)
                            
                            # We need to process tags in order. Lexical search for <h1, <h2, </h1>, </h2>
                            line_tags = []
                            for m in re.finditer(r'<h1[^>]*>', line, re.I): line_tags.append(('open', 'h1', m.start()))
                            for m in re.finditer(r'<h2[^>]*>', line, re.I): line_tags.append(('open', 'h2', m.start()))
                            for m in re.finditer(r'</h1>', line, re.I): line_tags.append(('close', 'h1', m.start()))
                            for m in re.finditer(r'</h2>', line, re.I): line_tags.append(('close', 'h2', m.start()))
                            
                            line_tags.sort(key=lambda x: x[2])
                            
                            for m_type, m_tag, pos in line_tags:
                                m_tag = m_tag.lower()
                                if m_type == 'open':
                                    stack.append((m_tag, i + 1))
                                else:
                                    if stack:
                                        open_tag, open_line = stack.pop()
                                        if open_tag != m_tag:
                                            mismatches.append({
                                                'file': path,
                                                'error': f'Mismatched tags: Opened <{open_tag}> on line {open_line}, closed with </{m_tag}> on line {i+1}'
                                            })
                                    # else: closing tag without opening is also an issue but less likely here
                except Exception as e:
                    print(f"Error reading {path}: {e}")
                    
    return mismatches

if __name__ == "__main__":
    results = find_mismatches(r'd:\WEB\pos\client\src')
    for r in results:
        print(f"{r['file']} -> {r['error']}")
