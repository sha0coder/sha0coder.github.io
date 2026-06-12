---
title: "Example Writeup - Testing Markdown Conversion"
description: "This is an example markdown file to test the md2html.py converter"
date: "November 29, 2025"
category: "Tutorial"
author: "sha0coder"
lang: "en"
---

## Introduction

This is an **example writeup** in Markdown format. The converter will transform this into beautiful HTML with all the styles from the Templo de Sabiduría template.

You can use *italic text*, **bold text**, and even `inline code` just like in normal markdown.

## Code Examples

Here's a Python code example:

```python
def hello_world():
    """Simple hello world function"""
    print("Hello from markdown!")
    return True

# Call the function
result = hello_world()
```

And here's a terminal command:

```bash
ls -la
cd /home
python3 script.py
```

## Lists

### Unordered List

* First item
* Second item with more details
* Third item

### Ordered List

1. Step one: Do this
2. Step two: Then do that
3. Step three: Finally this

## Special Boxes

[!NOTE] This is an important note that will be highlighted in a blue box with a note icon.

[!WARNING] This is a warning that will appear in an orange box. Use it for important warnings or security notices.

## Links and Images

You can include external links like [this link to GitHub](https://github.com).

Images work with standard HTML tags (they pass through):

<img src="../images/example.png" alt="Example image">

## Blockquotes

> "This is a famous quote that will be highlighted."
> — Author Name

## Conclusion

This markdown file demonstrates all the supported features of the md2html.py converter. Simply run:

```bash
python3 md2html.py example.md writeups/example-en.html
```

And you'll get a fully styled HTML page ready to publish!
