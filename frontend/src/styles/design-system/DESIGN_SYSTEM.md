# Plex DualSub Manager — Brutalist Design System

> **"Raw. Functional. Unapologetic."**

This design system defines the visual language for a full brutalist retheme of Plex DualSub Manager. It embraces chaos through structure, using a rigid 20×20 grid to create intentionally "messy" but cohesive layouts. The aesthetic is code-inspired, monochrome-dominant, and aggressively anti-polish.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [The 20×20 Grid System](#4-the-2020-grid-system)
5. [Spacing System](#5-spacing-system)
6. [Shadows & Borders](#6-shadows--borders)
7. [Component Specifications](#7-component-specifications)
8. [Dark & Light Mode](#8-dark--light-mode)
9. [Iconography](#9-iconography)
10. [Anti-Patterns](#10-anti-patterns)
11. [Implementation Guide](#11-implementation-guide)

---

## 1. Design Philosophy

### Manifesto

```
WE REJECT:
  - Soft gradients
  - Rounded corners
  - "Friendly" pastels
  - Design that apologizes for existing

WE EMBRACE:
  - Raw structure
  - Harsh contrast
  - Visible grids
  - Typography as architecture
  - Function over decoration
```

### Core Principles

| Principle | Description |
|-----------|-------------|
| **Raw Honesty** | No visual tricks. What you see is what it is. Borders are visible. Shadows are hard. Structure is exposed. |
| **Controlled Chaos** | The 20×20 grid enables intentional asymmetry. Elements can span unusual cell combinations, creating visual tension while maintaining underlying order. |
| **Code as Aesthetic** | The interface should feel like it was built by developers, for developers. Monospace text, terminal-inspired inputs, systematic logic. |
| **Monochrome + Blood** | Black, white, and grays form the canvas. Dark blood red and success green provide semantic meaning—never decoration. |
| **No Apologies** | This design is intentionally aggressive. It's not trying to be "nice." It demands attention. |

### Inspiration Sources

- Brutalist architecture (Le Corbusier, Tadao Ando)
- Terminal interfaces and code editors
- Punk rock zine aesthetics
- Craigslist, Bloomberg terminals
- Swiss grid design meets anti-design

---

## 2. Color System

### 2.1 Monochrome Palette

The foundation is pure monochrome. No warm grays. No cool grays. Just black, white, and mathematically derived steps between.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-black` | `#000000` | 0, 0, 0 | Primary text (light mode), backgrounds (dark mode) |
| `--color-gray-900` | `#1A1A1A` | 26, 26, 26 | Dark mode elevated surfaces |
| `--color-gray-800` | `#2D2D2D` | 45, 45, 45 | Dark mode cards |
| `--color-gray-700` | `#404040` | 64, 64, 64 | Dark mode secondary surfaces |
| `--color-gray-600` | `#595959` | 89, 89, 89 | Muted text, borders |
| `--color-gray-500` | `#737373` | 115, 115, 115 | Placeholder text |
| `--color-gray-400` | `#8C8C8C` | 140, 140, 140 | Disabled states |
| `--color-gray-300` | `#A6A6A6` | 166, 166, 166 | Light borders |
| `--color-gray-200` | `#BFBFBF` | 191, 191, 191 | Subtle dividers |
| `--color-gray-100` | `#D9D9D9` | 217, 217, 217 | Light mode hover states |
| `--color-gray-50` | `#F2F2F2` | 242, 242, 242 | Light mode backgrounds |
| `--color-white` | `#FFFFFF` | 255, 255, 255 | Primary text (dark mode), backgrounds (light mode) |

### 2.2 Accent Colors

Accents are **semantic only**. They communicate meaning, never decoration.

| Token | Hex | RGB | Usage |
|-------|-----|-----|-------|
| `--color-blood` | `#8B0000` | 139, 0, 0 | Primary accent, CTAs, critical actions, errors |
| `--color-blood-dark` | `#5C0000` | 92, 0, 0 | Blood hover/pressed state |
| `--color-blood-light` | `#B22222` | 178, 34, 34 | Blood on dark backgrounds |
| `--color-success` | `#2E7D32` | 46, 125, 50 | Success states, confirmations, positive indicators |
| `--color-success-light` | `#4CAF50` | 76, 175, 80 | Success on dark backgrounds |
| `--color-success-dark` | `#1B5E20` | 27, 94, 32 | Success hover/pressed state |

### 2.3 Semantic Color Tokens

```css
/* Light Mode Semantic Tokens */
--bg-primary: var(--color-white);
--bg-secondary: var(--color-gray-50);
--bg-elevated: var(--color-white);
--bg-inverse: var(--color-black);

--text-primary: var(--color-black);
--text-secondary: var(--color-gray-600);
--text-muted: var(--color-gray-500);
--text-inverse: var(--color-white);

--border-primary: var(--color-black);
--border-secondary: var(--color-gray-300);

--accent-primary: var(--color-blood);
--accent-success: var(--color-success);

/* Dark Mode Semantic Tokens */
--bg-primary: var(--color-black);
--bg-secondary: var(--color-gray-900);
--bg-elevated: var(--color-gray-800);
--bg-inverse: var(--color-white);

--text-primary: var(--color-white);
--text-secondary: var(--color-gray-300);
--text-muted: var(--color-gray-500);
--text-inverse: var(--color-black);

--border-primary: var(--color-white);
--border-secondary: var(--color-gray-600);

--accent-primary: var(--color-blood-light);
--accent-success: var(--color-success-light);
```

### 2.4 Contrast Ratios (WCAG Compliance)

| Combination | Ratio | WCAG Level |
|-------------|-------|------------|
| Black on White | 21:1 | AAA |
| White on Black | 21:1 | AAA |
| Blood (#8B0000) on White | 8.2:1 | AAA |
| Blood-Light (#B22222) on Black | 5.1:1 | AA |
| Success (#2E7D32) on White | 5.6:1 | AA |
| Gray-600 on White | 4.9:1 | AA |

---

## 3. Typography

### 3.1 Font Stack

The typography system uses **maximum contrast** between heading and body fonts.

#### Heading Font: Space Grotesk

A bold, geometric sans-serif with architectural character. Used for all headings, buttons, and UI labels.

```css
--font-heading: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Weights Used:**
- 700 (Bold) — Primary headings
- 500 (Medium) — Subheadings, buttons

#### Body Font: Hack

A monospace font designed for code. Creates the terminal-inspired aesthetic. Used for all body text, inputs, and data.

```css
--font-body: 'Hack', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
```

**Weights Used:**
- 400 (Regular) — Body text
- 700 (Bold) — Emphasis within body

#### Font Import

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap');
@import url('https://cdn.jsdelivr.net/npm/hack-font@3/build/web/hack.min.css');
```

### 3.2 Type Scale

Based on a **1.333 (Perfect Fourth)** ratio for dramatic contrast.

| Token | Size | Line Height | Letter Spacing | Font | Weight | Usage |
|-------|------|-------------|----------------|------|--------|-------|
| `--text-display` | 72px | 1.0 | -0.02em | Space Grotesk | 700 | Hero text, major callouts |
| `--text-h1` | 48px | 1.1 | -0.02em | Space Grotesk | 700 | Page titles |
| `--text-h2` | 36px | 1.2 | -0.01em | Space Grotesk | 700 | Section headers |
| `--text-h3` | 24px | 1.3 | -0.01em | Space Grotesk | 700 | Card titles, subsections |
| `--text-h4` | 18px | 1.4 | 0 | Space Grotesk | 500 | Small headings |
| `--text-body` | 16px | 1.6 | 0.01em | Hack | 400 | Body text |
| `--text-body-sm` | 14px | 1.6 | 0.01em | Hack | 400 | Secondary body text |
| `--text-caption` | 12px | 1.5 | 0.02em | Hack | 400 | Captions, metadata |
| `--text-code` | 14px | 1.5 | 0 | Hack | 400 | Inline code, technical data |
| `--text-label` | 12px | 1.2 | 0.08em | Space Grotesk | 500 | Labels, buttons (uppercase) |

### 3.3 Typography Rules

1. **Headings are ALWAYS Space Grotesk** — Bold, tight letter-spacing, architectural feel
2. **Body is ALWAYS Hack** — Creates the code-editor vibe, even for non-technical content
3. **ALL CAPS for labels** — Buttons, nav items, form labels use uppercase Space Grotesk
4. **No italics** — Brutalism doesn't apologize. Use bold or color for emphasis.
5. **Left-align everything** — No centered text. Brutal layouts are structured, not balanced.

### 3.4 Typography CSS Classes

```css
.text-display { font: 700 72px/1.0 var(--font-heading); letter-spacing: -0.02em; }
.text-h1 { font: 700 48px/1.1 var(--font-heading); letter-spacing: -0.02em; }
.text-h2 { font: 700 36px/1.2 var(--font-heading); letter-spacing: -0.01em; }
.text-h3 { font: 700 24px/1.3 var(--font-heading); letter-spacing: -0.01em; }
.text-h4 { font: 500 18px/1.4 var(--font-heading); }
.text-body { font: 400 16px/1.6 var(--font-body); letter-spacing: 0.01em; }
.text-body-sm { font: 400 14px/1.6 var(--font-body); letter-spacing: 0.01em; }
.text-caption { font: 400 12px/1.5 var(--font-body); letter-spacing: 0.02em; }
.text-label { font: 500 12px/1.2 var(--font-heading); letter-spacing: 0.08em; text-transform: uppercase; }
```

---

## 4. The 20×20 Grid System

### 4.1 Philosophy: Controlled Chaos

The 20×20 grid is the foundation for "chaotic but cohesive" layouts. Unlike traditional 12-column grids that encourage symmetry, this system enables:

- **Unusual column spans** (7 columns, 13 columns, etc.)
- **Asymmetric placement** (element starting at column 3, ending at column 17)
- **Intentional gaps** (empty grid cells as negative space)
- **Visual tension** (elements feeling "off" but still aligned)

### 4.2 Grid Specifications

```css
/* Base Grid Container */
.grid-brutal {
  display: grid;
  grid-template-columns: repeat(20, 1fr);
  grid-template-rows: repeat(auto-fill, minmax(20px, auto));
  gap: 0; /* No gap — borders create separation */
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 var(--space-4); /* 32px side padding */
}

/* Grid Cell Base Unit */
--grid-unit: calc((100vw - 64px) / 20); /* Viewport divided by 20, minus padding */

/* At 1600px max-width */
--grid-unit-max: 76.8px; /* (1600 - 64) / 20 */
```

### 4.3 Common Span Patterns

| Pattern Name | Columns | Usage |
|--------------|---------|-------|
| Full Bleed | 1 / -1 (all 20) | Hero sections, full-width elements |
| Wide Content | 2 / 19 (18 cols) | Main content area with margins |
| Standard Content | 3 / 18 (15 cols) | Default content width |
| Narrow Content | 5 / 16 (11 cols) | Text-heavy sections |
| Half Left | 1 / 11 (10 cols) | Left panel in split layouts |
| Half Right | 11 / -1 (10 cols) | Right panel in split layouts |
| Two-Thirds Left | 1 / 14 (13 cols) | Dominant left section |
| One-Third Right | 14 / -1 (7 cols) | Sidebar |
| Asymmetric A | 2 / 13 (11 cols) | Intentionally off-center |
| Asymmetric B | 8 / 20 (12 cols) | Counterbalance |
| Card Small | span 4 | Small card in grid |
| Card Medium | span 5 | Medium card in grid |
| Card Large | span 7 | Large feature card |

### 4.4 Grid Utility Classes

```css
/* Column Start */
.col-start-1 { grid-column-start: 1; }
.col-start-2 { grid-column-start: 2; }
/* ... up to 20 */
.col-start-20 { grid-column-start: 20; }

/* Column End */
.col-end-1 { grid-column-end: 1; }
.col-end-2 { grid-column-end: 2; }
/* ... up to 21 (-1) */
.col-end-full { grid-column-end: -1; }

/* Column Span */
.col-span-1 { grid-column: span 1; }
.col-span-2 { grid-column: span 2; }
/* ... up to 20 */
.col-span-full { grid-column: 1 / -1; }

/* Named Layout Presets */
.layout-full { grid-column: 1 / -1; }
.layout-wide { grid-column: 2 / 19; }
.layout-standard { grid-column: 3 / 18; }
.layout-narrow { grid-column: 5 / 16; }
.layout-left-half { grid-column: 1 / 11; }
.layout-right-half { grid-column: 11 / -1; }
.layout-two-thirds { grid-column: 1 / 14; }
.layout-one-third { grid-column: 14 / -1; }
```

### 4.5 Responsive Behavior

```css
/* Mobile (< 640px): Collapse to single column */
@media (max-width: 639px) {
  .grid-brutal {
    grid-template-columns: 1fr;
    padding: 0 var(--space-2);
  }

  [class*="col-"] {
    grid-column: 1 / -1 !important;
  }
}

/* Tablet (640px - 1024px): 10 column grid */
@media (min-width: 640px) and (max-width: 1023px) {
  .grid-brutal {
    grid-template-columns: repeat(10, 1fr);
  }

  /* Halve all spans */
  .col-span-20 { grid-column: span 10; }
  .col-span-10 { grid-column: span 5; }
  /* etc. */
}

/* Desktop (1024px+): Full 20 column grid */
@media (min-width: 1024px) {
  .grid-brutal {
    grid-template-columns: repeat(20, 1fr);
  }
}
```

---

## 5. Spacing System

### 5.1 Base Unit: 8px

All spacing derives from an 8px base unit for consistency.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | Reset |
| `--space-1` | 8px | Tight spacing (icon gaps, inline elements) |
| `--space-2` | 16px | Standard spacing (input padding, small gaps) |
| `--space-3` | 24px | Medium spacing (card padding, form gaps) |
| `--space-4` | 32px | Large spacing (section padding) |
| `--space-5` | 40px | XL spacing (major section breaks) |
| `--space-6` | 48px | 2XL spacing (page sections) |
| `--space-8` | 64px | 3XL spacing (hero sections) |
| `--space-10` | 80px | 4XL spacing (major landmarks) |
| `--space-12` | 96px | 5XL spacing (page breaks) |

### 5.2 Component Spacing Guidelines

| Component | Padding | Margin | Gap |
|-----------|---------|--------|-----|
| Button | 8px 24px | — | 8px (icon) |
| Input | 12px 16px | — | — |
| Card | 24px | 0 (grid handles) | 16px (internal) |
| Section | 48px 0 | — | 32px (children) |
| Modal | 32px | — | 24px (internal) |
| Nav Item | 8px 16px | 0 | — |
| Form Group | — | 0 0 24px | 8px |

### 5.3 Spacing Utility Classes

```css
/* Margin */
.m-0 { margin: 0; }
.m-1 { margin: 8px; }
.m-2 { margin: 16px; }
/* ... etc */

.mt-0 { margin-top: 0; }
.mr-0 { margin-right: 0; }
.mb-0 { margin-bottom: 0; }
.ml-0 { margin-left: 0; }
/* ... all directions, all sizes */

/* Padding */
.p-0 { padding: 0; }
.p-1 { padding: 8px; }
.p-2 { padding: 16px; }
/* ... etc */

/* Gap (for flex/grid) */
.gap-0 { gap: 0; }
.gap-1 { gap: 8px; }
.gap-2 { gap: 16px; }
/* ... etc */
```

---

## 6. Shadows & Borders

### 6.1 Border Specifications

Brutalist design exposes structure. Borders are **always visible**.

| Token | Value | Usage |
|-------|-------|-------|
| `--border-thin` | 1px solid | Subtle dividers |
| `--border-base` | 2px solid | Standard components |
| `--border-thick` | 3px solid | Emphasized elements |
| `--border-brutal` | 4px solid | Maximum emphasis (active states, focus) |

```css
/* Border Classes */
.border { border: 2px solid var(--border-primary); }
.border-thin { border: 1px solid var(--border-primary); }
.border-thick { border: 3px solid var(--border-primary); }
.border-brutal { border: 4px solid var(--border-primary); }

.border-t { border-top: 2px solid var(--border-primary); }
.border-r { border-right: 2px solid var(--border-primary); }
.border-b { border-bottom: 2px solid var(--border-primary); }
.border-l { border-left: 2px solid var(--border-primary); }
```

### 6.2 Shadow Specifications

Shadows are **hard-edged only**. No blur. No spread. Just offset.

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | 2px 2px 0px 0px | Subtle depth |
| `--shadow-base` | 4px 4px 0px 0px | Standard components |
| `--shadow-lg` | 6px 6px 0px 0px | Elevated elements |
| `--shadow-xl` | 8px 8px 0px 0px | Modals, dropdowns |

```css
/* Shadow Classes */
.shadow-sm { box-shadow: 2px 2px 0px 0px var(--border-primary); }
.shadow { box-shadow: 4px 4px 0px 0px var(--border-primary); }
.shadow-lg { box-shadow: 6px 6px 0px 0px var(--border-primary); }
.shadow-xl { box-shadow: 8px 8px 0px 0px var(--border-primary); }

/* Interactive Shadow States */
.shadow-hover:hover {
  box-shadow: 6px 6px 0px 0px var(--border-primary);
  transform: translate(-2px, -2px);
}

.shadow-active:active {
  box-shadow: 2px 2px 0px 0px var(--border-primary);
  transform: translate(2px, 2px);
}
```

### 6.3 Border Radius

**Default: 0px (none)**

Brutalism rejects soft corners. However, for accessibility (focus states), minimal radius is permitted:

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | 0px | Default (all components) |
| `--radius-sm` | 2px | Optional: keyboard focus indicators only |

```css
/* NO rounded corners by default */
.rounded-none { border-radius: 0; }

/* Exception: Focus accessibility */
.focus-visible:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: 2px; /* Slight radius for focus ring only */
}
```

---

## 7. Component Specifications

### 7.1 Buttons

```css
/* Base Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  padding: 8px 24px;

  font: 500 12px/1.2 var(--font-heading);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;

  background: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--border-primary);
  border-radius: 0;

  box-shadow: 4px 4px 0px 0px var(--border-primary);

  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px 0px var(--border-primary);
}

.btn:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px 0px var(--border-primary);
}

/* Primary Button (Blood accent) */
.btn-primary {
  background: var(--accent-primary);
  color: var(--color-white);
  border-color: var(--color-black);
  box-shadow: 4px 4px 0px 0px var(--color-black);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  box-shadow: none;
}

.btn-ghost:hover {
  background: var(--bg-secondary);
  transform: none;
  box-shadow: none;
}

/* Sizes */
.btn-sm { padding: 4px 16px; font-size: 10px; }
.btn-lg { padding: 12px 32px; font-size: 14px; }
```

### 7.2 Cards

```css
/* Base Card */
.card {
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  box-shadow: 4px 4px 0px 0px var(--border-primary);
  padding: 24px;
}

/* Card Header */
.card-header {
  border-bottom: 2px solid var(--border-primary);
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.card-title {
  font: 700 24px/1.3 var(--font-heading);
  letter-spacing: -0.01em;
  margin: 0;
}

/* Card Body */
.card-body {
  font: 400 16px/1.6 var(--font-body);
}

/* Card with Hover */
.card-interactive {
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.card-interactive:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px 0px var(--border-primary);
}

/* Card Image */
.card-image {
  margin: -24px -24px 24px -24px;
  border-bottom: 2px solid var(--border-primary);
  overflow: hidden;
}

.card-image img {
  width: 100%;
  height: auto;
  display: block;
}
```

### 7.3 Inputs

```css
/* Base Input */
.input {
  width: 100%;
  padding: 12px 16px;

  font: 400 16px/1.5 var(--font-body);

  background: var(--bg-primary);
  color: var(--text-primary);
  border: 2px solid var(--border-primary);
  border-radius: 0;

  transition: border-color 0.1s ease, box-shadow 0.1s ease;
}

.input::placeholder {
  color: var(--text-muted);
}

.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 4px 4px 0px 0px var(--accent-primary);
}

/* Input with Error */
.input-error {
  border-color: var(--accent-primary);
}

/* Input Label */
.input-label {
  display: block;
  margin-bottom: 8px;

  font: 500 12px/1.2 var(--font-heading);
  letter-spacing: 0.08em;
  text-transform: uppercase;

  color: var(--text-primary);
}

/* Textarea */
.textarea {
  min-height: 120px;
  resize: vertical;
}

/* Select */
.select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  padding-right: 48px;
}
```

### 7.4 Navigation

```css
/* Header */
.header {
  position: sticky;
  top: 0;
  z-index: 100;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 16px 32px;

  background: var(--bg-primary);
  border-bottom: 3px solid var(--border-primary);
}

/* Logo */
.logo {
  font: 700 24px/1 var(--font-heading);
  letter-spacing: -0.02em;
  text-decoration: none;
  color: var(--text-primary);
}

/* Nav */
.nav {
  display: flex;
  align-items: center;
  gap: 0;
}

.nav-item {
  padding: 8px 16px;

  font: 500 12px/1.2 var(--font-heading);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;

  color: var(--text-primary);
  border: 2px solid transparent;

  transition: background 0.1s ease;
}

.nav-item:hover {
  background: var(--bg-secondary);
}

.nav-item.active {
  border: 2px solid var(--border-primary);
  background: var(--bg-secondary);
}
```

### 7.5 Media Card (for Films/Shows)

```css
/* Media Card */
.media-card {
  position: relative;
  background: var(--bg-elevated);
  border: 2px solid var(--border-primary);
  overflow: hidden;
  cursor: pointer;

  transition: transform 0.1s ease, box-shadow 0.1s ease;
}

.media-card:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px 0px var(--border-primary);
}

.media-card-image {
  aspect-ratio: 2/3;
  overflow: hidden;
  border-bottom: 2px solid var(--border-primary);
}

.media-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: grayscale(30%);
  transition: filter 0.2s ease;
}

.media-card:hover .media-card-image img {
  filter: grayscale(0%);
}

.media-card-content {
  padding: 16px;
}

.media-card-title {
  font: 700 14px/1.3 var(--font-heading);
  margin: 0 0 4px 0;

  /* Truncate */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.media-card-meta {
  font: 400 12px/1.4 var(--font-body);
  color: var(--text-secondary);
}

/* Media Card Badge */
.media-card-badge {
  position: absolute;
  top: 8px;
  left: 8px;

  padding: 4px 8px;

  font: 500 10px/1 var(--font-heading);
  letter-spacing: 0.08em;
  text-transform: uppercase;

  background: var(--accent-primary);
  color: var(--color-white);
  border: 2px solid var(--color-black);
}
```

### 7.6 Modal/Dialog

```css
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(0, 0, 0, 0.8);
}

/* Modal */
.modal {
  width: 100%;
  max-width: 600px;
  max-height: 90vh;

  background: var(--bg-primary);
  border: 3px solid var(--border-primary);
  box-shadow: 8px 8px 0px 0px var(--border-primary);

  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 24px;
  border-bottom: 2px solid var(--border-primary);
}

.modal-title {
  font: 700 24px/1.2 var(--font-heading);
  margin: 0;
}

.modal-close {
  padding: 8px;
  background: none;
  border: 2px solid var(--border-primary);
  cursor: pointer;

  transition: background 0.1s ease;
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  gap: 16px;
  justify-content: flex-end;

  padding: 24px;
  border-top: 2px solid var(--border-primary);
}
```

### 7.7 Status Indicators

```css
/* Status Badge */
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  padding: 4px 12px;

  font: 500 10px/1.2 var(--font-heading);
  letter-spacing: 0.08em;
  text-transform: uppercase;

  border: 2px solid var(--border-primary);
}

.status-success {
  background: var(--accent-success);
  color: var(--color-white);
  border-color: var(--color-black);
}

.status-error {
  background: var(--accent-primary);
  color: var(--color-white);
  border-color: var(--color-black);
}

.status-pending {
  background: var(--color-gray-300);
  color: var(--color-black);
}

/* Status Dot */
.status-dot {
  width: 8px;
  height: 8px;
  border: 2px solid var(--border-primary);
}

.status-dot-success { background: var(--accent-success); }
.status-dot-error { background: var(--accent-primary); }
.status-dot-pending { background: var(--color-gray-300); }
```

---

## 8. Dark & Light Mode

### 8.1 Implementation Strategy

Use CSS custom properties with `data-theme` attribute on `<html>`:

```css
/* Light Mode (Default) */
:root,
[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F2F2F2;
  --bg-elevated: #FFFFFF;
  --bg-inverse: #000000;

  --text-primary: #000000;
  --text-secondary: #595959;
  --text-muted: #737373;
  --text-inverse: #FFFFFF;

  --border-primary: #000000;
  --border-secondary: #A6A6A6;

  --accent-primary: #8B0000;
  --accent-success: #2E7D32;
}

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1A1A1A;
  --bg-elevated: #2D2D2D;
  --bg-inverse: #FFFFFF;

  --text-primary: #FFFFFF;
  --text-secondary: #A6A6A6;
  --text-muted: #737373;
  --text-inverse: #000000;

  --border-primary: #FFFFFF;
  --border-secondary: #595959;

  --accent-primary: #B22222;
  --accent-success: #4CAF50;
}
```

### 8.2 Theme Toggle Component

```tsx
// ThemeToggle.tsx
function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <button
      className="btn btn-ghost"
      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? 'LIGHT' : 'DARK'}
    </button>
  );
}
```

### 8.3 System Preference Detection

```css
/* Respect OS preference if no manual selection */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    /* Apply dark mode tokens */
  }
}
```

---

## 9. Iconography

### 9.1 Icon Style Guidelines

| Rule | Specification |
|------|---------------|
| Style | Bold geometric shapes, stencil-like designs |
| Stroke Width | 2-3px (matches border system) |
| Size Scale | xs: 12px, sm: 16px, md: 20px, lg: 24px, xl: 32px |
| Color | Inherits `currentColor` |
| Aesthetic | Love Death + Robots / brutalist graphic design |

### 9.2 Custom Brutalist Icon Set

We use a custom set of 14 geometric SVG icons designed for maximum visual impact:

```tsx
import {
  Cross,    // ✕ Close, Delete, Error, No
  Tick,     // ✓ Success, Confirm, Yes
  Bang,     // ! Warning, Alert
  Skull,    // ☠ Danger, Fatal
  Play,     // ▶ Play, Start, Go
  Stop,     // ■ Stop, Pause, End
  Plus,     // + Add, Create, New
  Minus,    // − Remove, Collapse
  Arrow,    // → Direction (use rotate prop: 0, 90, 180, 270)
  Target,   // ⌖ Search, Find
  Bars,     // ☰ Menu, List view
  GridIcon, // ▦ Grid view
  Dot,      // ● Status, Light mode
  HalfDot,  // ◐ Dark mode, Partial
} from '../primitives';

// Usage with size prop
<Cross size="sm" />
<Arrow size="md" rotate={180} />  // Left arrow
<Tick size="lg" className="text-success" />
```

### 9.3 Icon Reuse Philosophy

Icons are intentionally minimal and reusable:
- **Arrow** with `rotate` prop covers all directional needs (←↑→↓)
- **Bars** represents menus, lists, subtitles, settings
- **Dot/HalfDot** for toggle states and status indicators
- **Plus/Minus** for add/remove, expand/collapse

### 9.4 Icon Sizing

```tsx
// Size prop accepts named sizes or numbers
<Icon size="xs" />  // 12px
<Icon size="sm" />  // 16px (default)
<Icon size="md" />  // 20px
<Icon size="lg" />  // 24px
<Icon size="xl" />  // 32px
<Icon size={48} />  // Custom pixel value
```

---

## 10. Anti-Patterns

### What NOT to Do

| Anti-Pattern | Why It Violates Brutalism |
|--------------|---------------------------|
| Gradients | Brutalism is flat and honest. Gradients add visual "polish" that softens the raw aesthetic. |
| Rounded Corners | Rectangular forms reference architectural brutalism. Soft corners feel friendly and approachable—the opposite of our intent. |
| Drop Shadows with Blur | Blurred shadows create depth illusions. Our hard-offset shadows are honest about being a design element. |
| Glassmorphism | Frosted glass effects are trendy and "pretty." Brutalism rejects trend-chasing. |
| Animated Gradients | Motion should be functional (hover feedback, state changes), not decorative. |
| Centered Text | Centered layouts suggest balance and harmony. Brutalism is structured but intentionally unbalanced. |
| Decorative Icons | Icons must serve function. No decorative flourishes. |
| Soft Pastels | Our palette is black, white, gray, blood red, and success green. No "friendly" colors. |
| Multiple Accent Colors | One semantic accent (blood red) + one success color. That's it. No rainbow. |
| Italic Text | Emphasis through bold or color, never italics. Italics feel "fancy." |

### Visual Examples

```
❌ WRONG                          ✅ RIGHT
─────────────────────────────     ─────────────────────────────
 ╭──────────────────────────╮      ┌──────────────────────────┐
 │   Soft, rounded card     │      │   HARD RECTANGULAR CARD  │
 │   with gradient bg       │      │   WITH SOLID BACKGROUND  │
 ╰──────────────────────────╯      └──────────────────────────┘
       ↑ blur shadow                      ↑ hard offset shadow

❌ background: linear-gradient(...)   ✅ background: var(--bg-primary)
❌ border-radius: 12px                ✅ border-radius: 0
❌ box-shadow: 0 4px 12px blur        ✅ box-shadow: 4px 4px 0 0 black
```

---

## 11. Implementation Guide

### 11.1 File Structure

```
frontend/src/styles/design-system/
├── DESIGN_SYSTEM.md          # This document
├── tokens.css                # CSS custom properties
├── typography.css            # Font imports & type classes
├── grid.css                  # 20×20 grid system
├── components.css            # Base component styles
└── utilities.css             # Utility classes
```

### 11.2 Import Order

```css
/* main.css or index.css */
@import './design-system/tokens.css';
@import './design-system/typography.css';
@import './design-system/grid.css';
@import './design-system/components.css';
@import './design-system/utilities.css';
```

### 11.3 Migration Checklist

- [ ] Replace all color values with CSS variables
- [ ] Remove all `border-radius` values (set to 0)
- [ ] Replace all soft shadows with hard-offset shadows
- [ ] Update all fonts to Space Grotesk (headings) + Hack (body)
- [ ] Remove all gradients
- [ ] Convert layouts to 20×20 grid
- [ ] Update all buttons to brutalist style
- [ ] Update all inputs to terminal style
- [ ] Update cards with harsh borders
- [ ] Implement dark/light mode toggle
- [ ] Replace icons with stroke-based variants
- [ ] Test all contrast ratios for accessibility

### 11.4 Component Migration Priority

1. **Tokens & Typography** — Foundation for everything
2. **Layout/Grid** — Restructure page layouts
3. **Buttons** — High-impact, used everywhere
4. **Cards** — Media cards are core to the app
5. **Navigation** — Header, sidebar
6. **Inputs** — Forms, search
7. **Modals** — Overlays, dialogs
8. **Status Indicators** — Badges, alerts

---

## Sources & References

- [NN/Group: Neobrutalism Best Practices](https://www.nngroup.com/articles/neobrutalism/)
- [Neo-Brutalism CSS Library](https://github.com/Walikuperek/Neo-brutalism-CSS)
- [Hack Font](https://sourcefoundry.org/hack/)
- [Space Grotesk on Google Fonts](https://fonts.google.com/specimen/Space+Grotesk)
- [Typewolf: Top 10 Brutalist Fonts](https://www.typewolf.com/top-10-brutalist-fonts)
- [Brutalist Web Design Principles](https://stringlabscreative.com/brutalist-web-design/)
- [Designlab: Brutalism Examples](https://designlab.com/blog/examples-brutalism-in-web-design)
- [Pangram Pangram: Brutalist Fonts](https://pangrampangram.com/blogs/journal/brutalist-fonts-in-brutalist-designs)
- [NeoBrutalism.dev](https://neobrutalism.dev/)

---

**Document Version:** 1.0
**Last Updated:** November 2025
**Design System Owner:** Plex DualSub Manager Team
