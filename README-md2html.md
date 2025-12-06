# 🔄 Markdown to HTML Converter

Conversor simple de Markdown a HTML que genera writeups con los estilos del Templo de Sabiduría.

## 📦 Instalación

No requiere dependencias externas, solo Python 3.

```bash
chmod +x md2html.py
```

## 🚀 Uso Básico

```bash
# Sintaxis básica
python3 md2html.py input.md [output.html]

# Ejemplo 1: Genera mi-writeup.html en el directorio actual
python3 md2html.py mi-writeup.md

# Ejemplo 2: Especifica la ruta de salida
python3 md2html.py mi-writeup.md writeups/mi-writeup-en.html
```

## 📝 Formato del Markdown

### Frontmatter YAML

Incluye metadata al inicio del archivo markdown:

```markdown
---
title: "Título del Writeup"
description: "Descripción breve para SEO"
date: "November 29, 2025"
category: "Categoría"
author: "Tu Nombre"
lang: "en"
---
```

### Sintaxis Soportada

#### Headers
```markdown
# Título H1
## Título H2
### Título H3
```

#### Texto
```markdown
**negrita** o __negrita__
*cursiva* o _cursiva_
`código inline`
```

#### Código
````markdown
```python
def funcion():
    return True
```
````

#### Listas
```markdown
# Desordenada
* Item 1
* Item 2

# Ordenada
1. Paso 1
2. Paso 2
```

#### Enlaces
```markdown
[Texto del enlace](https://url.com)
```

#### Blockquotes
```markdown
> Esto es una cita
> — Autor
```

#### Cajas Especiales
```markdown
[!NOTE] Esto aparecerá en una caja azul de nota.

[!WARNING] Esto aparecerá en una caja naranja de advertencia.
```

#### Imágenes
Las imágenes deben estar en formato HTML (pasan tal cual al HTML):

```html
<img src="../images/mi-imagen.png" alt="Descripción">
```

## 📋 Ejemplo Completo

Ver [`example.md`](example.md) para un ejemplo con todas las características.

```bash
# Generar el ejemplo
python3 md2html.py example.md writeups/example-en.html
```

## 🎯 Workflow Recomendado

1. **Escribe tu writeup** en markdown (ej: `noise-defense-en.md`)
2. **Incluye frontmatter** con metadata
3. **Convierte a HTML**:
   ```bash
   python3 md2html.py noise-defense-en.md writeups/noise-defense-en.html
   ```
4. **Actualiza posts.yaml**:
   ```yaml
   link_en: "writeups/noise-defense-en.html"
   ```
5. **Verifica** abriendo index.html en el navegador

## ✨ Características

✅ Sin dependencias externas  
✅ Parser de YAML frontmatter  
✅ Conversión de markdown estándar  
✅ Cajas especiales NOTE/WARNING  
✅ Headers con syntax highlighting  
✅ Estilos consistentes con el sitio  
✅ Links automáticos externos  
✅ Soporte de imágenes HTML  

## 🔧 Limitaciones

- Parser de markdown simple (no es CommonMark completo)
- Tablas no soportadas (añadir HTML directamente)
- Footnotes no soportadas
- Las imágenes deben ser tags HTML `<img>`

Para características avanzadas, puedes editar el HTML generado manualmente.

## 📖 Archivos

- `md2html.py` - El conversor
- `example.md` - Ejemplo de markdown
- `writeups/example-en.html` - Resultado de ejemplo
- `writeups/template.html` - Template manual (alternativa)

¡Listo para escribir writeups en markdown! 🚀
