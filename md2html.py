#!/usr/bin/env python3
"""
Markdown to HTML Converter - Templo de Sabiduría
Convierte archivos Markdown a HTML usando el template del sitio
"""

import re
import sys
from pathlib import Path
from datetime import datetime

def parse_frontmatter(content):
    """Extrae el frontmatter YAML del markdown"""
    frontmatter = {}
    
    # Buscar frontmatter entre ---
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if match:
        yaml_content = match.group(1)
        # Parsear YAML simple
        for line in yaml_content.split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                frontmatter[key.strip()] = value.strip().strip('"\'')
        
        # Remover frontmatter del contenido
        content = content[match.end():]
    
    return frontmatter, content

def markdown_to_html(md_text):
    """Convierte Markdown a HTML (simple parser)"""
    html = md_text
    
    # Headers
    html = re.sub(r'^### (.+)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.+)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.+)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    
    # Code blocks con lenguaje
    def replace_code_block(match):
        lang = match.group(1) or ''
        code = match.group(2)
        if lang:
            return f'<div class="code-header">{lang}</div>\n<pre><code>{code}</code></pre>'
        return f'<pre><code>{code}</code></pre>'
    
    html = re.sub(r'```(\w+)?\n(.*?)```', replace_code_block, html, flags=re.DOTALL)
    
    # Inline code
    html = re.sub(r'`([^`]+)`', r'<code>\1</code>', html)
    
    # Bold
    html = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'__(.+?)__', r'<strong>\1</strong>', html)
    
    # Italic
    html = re.sub(r'\*(.+?)\*', r'<em>\1</em>', html)
    html = re.sub(r'_(.+?)_', r'<em>\1</em>', html)
    
    # Links [text](url)
    html = re.sub(r'\[([^\]]+)\]\(([^\)]+)\)', r'<a href="\2" target="_blank">\1</a>', html)
    
    # Blockquotes
    html = re.sub(r'^> (.+)$', r'<blockquote>\1</blockquote>', html, flags=re.MULTILINE)
    
    # Listas desordenadas
    def replace_ul(text):
        lines = text.split('\n')
        in_list = False
        result = []
        
        for line in lines:
            if re.match(r'^[\*\-] ', line):
                if not in_list:
                    result.append('<ul>')
                    in_list = True
                item = re.sub(r'^[\*\-] ', '', line)
                result.append(f'<li>{item}</li>')
            else:
                if in_list:
                    result.append('</ul>')
                    in_list = False
                result.append(line)
        
        if in_list:
            result.append('</ul>')
        
        return '\n'.join(result)
    
    html = replace_ul(html)
    
    # Listas ordenadas
    def replace_ol(text):
        lines = text.split('\n')
        in_list = False
        result = []
        
        for line in lines:
            if re.match(r'^\d+\. ', line):
                if not in_list:
                    result.append('<ol>')
                    in_list = True
                item = re.sub(r'^\d+\. ', '', line)
                result.append(f'<li>{item}</li>')
            else:
                if in_list:
                    result.append('</ol>')
                    in_list = False
                result.append(line)
        
        if in_list:
            result.append('</ol>')
        
        return '\n'.join(result)
    
    html = replace_ol(html)
    
    # Cajas especiales (custom syntax)
    # [!NOTE] -> note-box
    html = re.sub(r'\[!NOTE\] (.+?)(?=\n\n|\n\[|$)', 
                  r'<div class="note-box"><strong>📝 Note:</strong> \1</div>', 
                  html, flags=re.DOTALL)
    
    # [!WARNING] -> warning-box
    html = re.sub(r'\[!WARNING\] (.+?)(?=\n\n|\n\[|$)', 
                  r'<div class="warning-box"><strong>⚠️ Warning:</strong> \1</div>', 
                  html, flags=re.DOTALL)
    
    # Párrafos
    def wrap_paragraphs(text):
        lines = text.split('\n')
        result = []
        in_para = False
        para_content = []
        
        for line in lines:
            stripped = line.strip()
            
            # Skip si es un tag HTML
            if stripped.startswith('<') and stripped.endswith('>'):
                if in_para:
                    result.append('<p>' + ' '.join(para_content) + '</p>')
                    para_content = []
                    in_para = False
                result.append(line)
            elif stripped == '':
                if in_para:
                    result.append('<p>' + ' '.join(para_content) + '</p>')
                    para_content = []
                    in_para = False
                result.append(line)
            else:
                # Si no empieza con tag HTML, es parte de un párrafo
                if not stripped.startswith('<'):
                    para_content.append(stripped)
                    in_para = True
                else:
                    if in_para:
                        result.append('<p>' + ' '.join(para_content) + '</p>')
                        para_content = []
                        in_para = False
                    result.append(line)
        
        if in_para:
            result.append('<p>' + ' '.join(para_content) + '</p>')
        
        return '\n'.join(result)
    
    html = wrap_paragraphs(html)
    
    return html

def create_html(frontmatter, content_html):
    """Crea el HTML final con el template"""
    
    # Valores por defecto
    title = frontmatter.get('title', 'Untitled Writeup')
    description = frontmatter.get('description', 'A writeup from Templo de Sabiduría')
    date = frontmatter.get('date', datetime.now().strftime('%B %d, %Y'))
    category = frontmatter.get('category', 'General')
    author = frontmatter.get('author', '')
    lang = frontmatter.get('lang', 'en')
    
    # Metadata HTML
    meta_items = [
        f'<span class="meta-item">📅 {date}</span>',
        f'<span class="meta-item">🏷️ {category}</span>',
    ]
    if author:
        meta_items.append(f'<span class="meta-item">👤 {author}</span>')
    
    meta_html = '\n                '.join(meta_items)
    
    # Template HTML completo
    html_template = f'''<!DOCTYPE html>
<html lang="{lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} | Templo de Sabiduría</title>
    <meta name="description" content="{description}">
    <link rel="stylesheet" href="../styles.css">
    <style>
        /* Estilos específicos para writeups */
        .writeup-container {{
            max-width: 900px;
            margin: 2rem auto;
            padding: 2rem;
            background: var(--color-bg-tertiary);
            border-radius: 16px;
            border: 1px solid var(--color-border);
            box-shadow: var(--shadow-lg);
        }}

        .back-link {{
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--color-primary-light);
            text-decoration: none;
            margin-bottom: 2rem;
            transition: all var(--transition-fast);
            font-weight: 600;
        }}

        .back-link:hover {{
            color: var(--color-accent-light);
            transform: translateX(-5px);
        }}

        .writeup-header {{
            margin-bottom: 3rem;
            padding-bottom: 2rem;
            border-bottom: 2px solid var(--color-border);
        }}

        .writeup-title {{
            font-size: clamp(2rem, 5vw, 3rem);
            background: linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
        }}

        .writeup-meta {{
            display: flex;
            gap: 1.5rem;
            flex-wrap: wrap;
            color: var(--color-text-muted);
            font-size: 0.95rem;
        }}

        .meta-item {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }}

        .writeup-content {{
            line-height: 1.8;
        }}

        .writeup-content h2 {{
            color: var(--color-primary-light);
            margin-top: 3rem;
            margin-bottom: 1rem;
            font-size: 1.8rem;
            border-left: 4px solid var(--color-primary);
            padding-left: 1rem;
        }}

        .writeup-content h3 {{
            color: var(--color-text-primary);
            margin-top: 2rem;
            margin-bottom: 1rem;
            font-size: 1.4rem;
        }}

        .writeup-content h4 {{
            color: var(--color-text-secondary);
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            font-size: 1.2rem;
        }}

        .writeup-content p {{
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
        }}

        .writeup-content ul,
        .writeup-content ol {{
            color: var(--color-text-secondary);
            margin-bottom: 1.5rem;
            padding-left: 2rem;
        }}

        .writeup-content li {{
            margin-bottom: 0.5rem;
        }}

        .writeup-content code {{
            background: var(--color-bg-dark);
            padding: 0.2rem 0.5rem;
            border-radius: 4px;
            color: var(--color-accent-light);
            font-family: var(--font-mono);
            font-size: 0.9em;
        }}

        .writeup-content pre {{
            background: var(--color-bg-dark);
            padding: 1.5rem;
            border-radius: 8px;
            overflow-x: auto;
            margin-bottom: 1.5rem;
            border: 1px solid var(--color-border);
        }}

        .writeup-content pre code {{
            background: none;
            padding: 0;
            color: var(--color-text-primary);
        }}

        .writeup-content blockquote {{
            border-left: 4px solid var(--color-accent);
            padding-left: 1.5rem;
            margin: 2rem 0;
            color: var(--color-text-secondary);
            font-style: italic;
        }}

        .writeup-content img {{
            max-width: 100%;
            height: auto;
            border-radius: 8px;
            margin: 2rem 0;
            box-shadow: var(--shadow-md);
        }}

        .writeup-content a {{
            color: var(--color-primary-light);
            transition: color var(--transition-fast);
        }}

        .writeup-content a:hover {{
            color: var(--color-accent-light);
        }}

        .note-box {{
            background: rgba(147, 51, 234, 0.1);
            border-left: 4px solid var(--color-primary);
            padding: 1rem 1.5rem;
            border-radius: 4px;
            margin: 2rem 0;
        }}

        .warning-box {{
            background: rgba(245, 158, 11, 0.1);
            border-left: 4px solid var(--color-accent);
            padding: 1rem 1.5rem;
            border-radius: 4px;
            margin: 2rem 0;
        }}

        .code-header {{
            background: var(--color-bg-secondary);
            padding: 0.5rem 1rem;
            border-radius: 8px 8px 0 0;
            color: var(--color-text-muted);
            font-size: 0.875rem;
            font-family: var(--font-mono);
            border: 1px solid var(--color-border);
            border-bottom: none;
        }}

        .code-header + pre {{
            margin-top: 0;
            border-radius: 0 0 8px 8px;
        }}

        @media (max-width: 768px) {{
            .writeup-container {{
                padding: 1.5rem;
                margin: 1rem;
            }}
        }}
    </style>
</head>
<body>
    <div class="writeup-container">
        <a href="../index.html" class="back-link">
            ← Back to Home
        </a>

        <header class="writeup-header">
            <h1 class="writeup-title">{title}</h1>
            <div class="writeup-meta">
                {meta_html}
            </div>
        </header>

        <article class="writeup-content">
{content_html}
        </article>

        <div style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--color-border);">
            <a href="../index.html" class="back-link">
                ← Back to Home
            </a>
        </div>
    </div>

    <div class="mystical-bg">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
    </div>
</body>
</html>
'''
    
    return html_template

def convert_markdown_file(input_file, output_file=None):
    """Convierte un archivo markdown a HTML"""
    
    # Leer archivo markdown
    input_path = Path(input_file)
    if not input_path.exists():
        print(f"Error: File '{input_file}' not found")
        return False
    
    with open(input_path, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # Parsear frontmatter
    frontmatter, md_body = parse_frontmatter(md_content)
    
    # Convertir markdown a HTML
    html_content = markdown_to_html(md_body)
    
    # Crear HTML final
    final_html = create_html(frontmatter, html_content)
    
    # Determinar archivo de salida
    if output_file is None:
        output_file = input_path.stem + '.html'
    
    output_path = Path(output_file)
    
    # Escribir HTML
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(final_html)
    
    print(f"✅ Converted: {input_file} -> {output_file}")
    return True

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 md2html.py input.md [output.html]")
        print("\nExample:")
        print("  python3 md2html.py my-writeup.md")
        print("  python3 md2html.py my-writeup.md writeups/my-writeup-en.html")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    convert_markdown_file(input_file, output_file)

if __name__ == '__main__':
    main()
