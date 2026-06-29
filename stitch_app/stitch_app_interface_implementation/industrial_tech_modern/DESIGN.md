---
name: Industrial Tech Modern
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#3c4a3c'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6c7b6a'
  outline-variant: '#bbcbb8'
  surface-tint: '#006e2a'
  primary: '#006e2a'
  on-primary: '#ffffff'
  primary-container: '#00c853'
  on-primary-container: '#004c1b'
  inverse-primary: '#3ce36a'
  secondary: '#a04100'
  on-secondary: '#ffffff'
  secondary-container: '#fe6b00'
  on-secondary-container: '#572000'
  tertiary: '#005ac1'
  on-tertiary: '#ffffff'
  tertiary-container: '#84adff'
  on-tertiary-container: '#003e89'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#69ff87'
  primary-fixed-dim: '#3ce36a'
  on-primary-fixed: '#002108'
  on-primary-fixed-variant: '#00531e'
  secondary-fixed: '#ffdbcc'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#351000'
  on-secondary-fixed-variant: '#7a3000'
  tertiary-fixed: '#d8e2ff'
  tertiary-fixed-dim: '#adc6ff'
  on-tertiary-fixed: '#001a41'
  on-tertiary-fixed-variant: '#004494'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e5e2e1'
  status-success: '#00C853'
  status-processing: '#FF6B00'
  status-error: '#FF0000'
  ui-divider: '#E0E0E0'
  surface-background: '#FFFFFF'
typography:
  display-lg:
    fontFamily: beVietnamPro
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: beVietnamPro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: beVietnamPro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: beVietnamPro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: beVietnamPro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  code-sm:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: beVietnamPro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  container-max: 1280px
---

## Brand & Style

The design system is built on a "Industrial-Tech" narrative, specifically tailored for a Millennial and Gen-Z workforce in the high-stakes environment of logistics and e-commerce. It balances the raw, utilitarian aesthetics of a warehouse with the high-polish finish of a modern SaaS product. 

The visual direction uses **Minimalism** injected with **High-Contrast** functional accents. It emphasizes "glanceable" information, ensuring that packing speed and evidence accuracy are never compromised by visual clutter. The emotional response should be one of extreme reliability—professional yet approachable, reflecting the "Local & Gaul" personality of the brand.

**Design Principles:**
- **Utilitarian Speed:** Every UI element is optimized for rapid scanning and tap-ability.
- **Visual Evidence:** Status is communicated through bold color blocks and rigid shapes.
- **Tech Transparency:** Monospaced accents and terminal-inspired details celebrate the engineering behind the packing process.

## Colors

The palette is driven by a "Color = Status" logic. **Primary Green (#00C853)** is the hero color, representing the "Selesai" (Finished) state and the core brand identity. **Secondary Orange (#FF6B00)** serves as the high-energy "Pro" tier and "Proses" (Processing) indicator.

**Functional Application:**
- **Primary Green:** Use for primary actions, success confirmations, and active recording indicators.
- **Secondary Orange:** Use for marketplace-specific branding (Shopee), pending states, and premium feature callouts.
- **Tertiary Blue:** Reserved for secondary marketplace branding (Tokopedia) and administrative information.
- **Neutral 21:** The core text color, providing maximum contrast against white backgrounds for high readability under warehouse lighting.
- **Status Red:** Specifically for "Gagal" (Failed) or "Cancel" actions; never used for decoration.

## Typography

This design system uses **Be Vietnam Pro** for its approachable yet professional geometric structure, which bridges the gap between Millennial friendliness and corporate SaaS. For technical data and status indicators, we introduce **JetBrains Mono** to ground the system in its "Industrial-Tech" roots.

**Usage Rules:**
- **Headlines:** Use Be Vietnam Pro Bold for all section titles.
- **Status Badges:** Use Label-Caps (JetBrains Mono) for all state indicators (REC, LUNAS, AKTIF) to give them a distinct, machine-readable look.
- **Data Tables:** Body-MD for row content, with Code-SM for timestamps and serial numbers to ensure character-level clarity.

## Layout & Spacing

The layout follows a **Fluid Grid** system designed for high-density data handling. 

- **Grid:** A 12-column grid on desktop, 8-column on tablet, and 4-column on mobile.
- **Rhythm:** An 8px base grid drives all spacing decisions, ensuring components feel "locked-in" and sturdy.
- **Data Density:** Table layouts should prioritize content over whitespace, using 12px vertical padding for rows to maximize the "scan-at-a-glance" capability of 25 items per page.
- **Safety Margins:** Fixed 24px side margins on mobile to prevent accidental triggers during handheld use.

## Elevation & Depth

To maintain the "Functional Flat" philosophy, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** White (#FFFFFF).
- **Level 1 (Cards/Tables):** Defined by a 1px solid border (#E0E0E0). No shadow.
- **Level 2 (Active Elements):** For active recording states or selected items, use a 2px stroke of the Primary or Secondary color.
- **Interaction:** On hover or press, elements shift background color (e.g., White to #F5F5F5) or increase border weight.
- **Camera Overlays:** Use semi-transparent dark scrims (40% opacity black) for UI elements overlaying live video feeds to ensure legibility.

## Shapes

The shape language is **Soft (0.25rem)**. This provides a subtle modern touch without veering into the overly playful "bubbly" aesthetic of consumer social apps. 

- **Primary Buttons:** 0.25rem (Soft) rounded corners to maintain a structured, industrial feel.
- **Status Badges:** 0.25rem rounded corners, creating a "tag" look.
- **Input Fields:** Sharp 0.25rem corners to emphasize the technical nature of data entry.
- **Large Containers:** Can use `rounded-lg` (0.5rem) for dashboard cards to slightly soften the UI for prolonged daily use.

## Components

### Live Camera Preview
The camera interface must include a bold "REC ●" indicator in the top-right corner using JetBrains Mono. Use a high-contrast 2px Primary Green border around the active viewport to signal recording is in progress. Overlay technical metadata (FPS, Bitrate, Resolution) in the bottom-left using `code-sm`.

### Status Badges
- **Selesai:** Primary Green background with White text.
- **Proses:** Secondary Orange background with White text.
- **Gagal:** Status Error (Red) background with White text.
All badges use `label-caps` typography and are rendered as solid color blocks.

### Data Tables
Tables should use a strictly structured grid. Headers are `label-caps` with a light gray background (#F5F5F5). Rows must include clear dividers (#E0E0E0). Action buttons within tables (Edit/Delete) should be icon-only or bracketed style `[ Action ]` to maintain the technical aesthetic.

### Buttons & Inputs
- **Primary Button:** Solid #00C853, White text, Be Vietnam Pro Bold.
- **Secondary Button:** 1px stroke of #212121, #212121 text.
- **Inputs:** 1px solid #E0E0E0 border, focusing to a 2px #00C853 border. Use placeholders that are clearly differentiated from entered text.

### Footer Pattern
The footer is a utilitarian block separated by a solid horizontal divider. It must contain the versioning info and the mandatory credit: **"Developed by Nafindo Group"** in JetBrains Mono 12px, aligned to the right or center depending on the screen size.