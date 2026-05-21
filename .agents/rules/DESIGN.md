---
trigger: manual
---

```markdown
# Design System Document

## 1. Overview & Creative North Star: "The Digital Concierge"

The Creative North Star for this design system is **The Digital Concierge**. Unlike standard utility dashboards that feel transactional and rigid, this system is rooted in the high-end editorial world of luxury stationery and wedding planning. It prioritizes a sense of calm, celebration, and curated elegance.

To break the "template" look, we move away from standard 12-column grids toward **intentional asymmetry**. We utilize generous white space (from our spacing scale) to allow elements to breathe, mimicking the margins of a high-end magazine. Surfaces should feel like layered heavy-stock paper, using overlapping elements and botanical accents to create a tactile, organic depth that feels human and bespoke.

---

## 2. Colors & Surface Philosophy

The palette is a sophisticated blend of botanical greens and romantic blushes, anchored by a warm, off-white base.

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders to define sections. Layout boundaries must be established exclusively through background color shifts. For example, a `surface-container-low` (#f7f3ed) sidebar should sit against a `surface` (#fdf9f3) main content area. This creates a soft, modern transition that feels "painted" rather than "constructed."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface tiers to create nested depth:
- **Base Layer:** `surface` (#fdf9f3)
- **Secondary Sections:** `surface-container-low` (#f7f3ed)
- **Interactive Cards:** `surface-container-lowest` (#ffffff) to provide a subtle "pop."
- **Floating Overlays:** Use `surface-bright` with a 90% opacity and a 12px backdrop blur.

### Signature Textures
Main CTAs and hero headers should utilize subtle linear gradients rather than flat fills. Transition from `primary` (#7f5351) to `primary-container` (#d9a3a0) at a 135-degree angle to provide a "silk-like" visual soul.

---

## 3. Typography: Editorial Sophistication

The typography system relies on a high-contrast pairing between an elegant serif (`notoSerif`) and a modern, approachable sans-serif (`manrope`).

*   **Display & Headlines (`notoSerif`):** Used for guest names, event titles, and milestone numbers. The serif reflects the tradition of wedding invitations. Use `display-lg` (3.5rem) for hero moments to create an authoritative, editorial feel.
*   **Body & Labels (`manrope`):** Used for logistical data, guest lists, and input fields. The clean sans-serif ensures maximum legibility and a "clean" aesthetic.
*   **Tonal Hierarchy:** Primary information uses `on-surface` (#1c1c18), while secondary metadata uses `on-surface-variant` (#514443) to create a natural reading rhythm without the need for bolding everything.

---

## 4. Elevation & Depth

We avoid the "drop shadow" look of legacy apps. Depth is achieved through **Tonal Layering** and **Ambient Light**.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft, natural lift that mimics stacked fine paper.
*   **Ambient Shadows:** For floating elements like modals or dropdowns, use a shadow with a 32px blur, 8px Y-offset, and 4% opacity of the `on-surface` color. It should feel like a whisper, not a weight.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at 15% opacity. Never use a 100% opaque border.
*   **Glassmorphism:** Use `surface-container-highest` at 70% opacity with a `blur-xl` effect for navigation bars to allow floral background accents to peek through.

---

## 5. Components

### Buttons
*   **Primary:** Uses the `primary` (#7f5351) fill with `on-primary` (#ffffff) text. Shape: `xl` (1.5rem) rounded corners.
*   **Secondary:** No background. Uses a `ghost-border` (outline-variant at 20%) and `primary` text.
*   **Tertiary/Text:** `on-surface` text with an underline that appears only on hover.

### Input Fields
Avoid the "boxed" look. Use a `surface-container-highest` background with a bottom-only border (ghost-border style). Labels should use `label-md` in `on-surface-variant`.

### Cards & Lists
*   **No Dividers:** Forbid the use of 1px lines between guest list items. Instead, use a `3` (1rem) spacing gap or alternate background colors between `surface` and `surface-container-low`.
*   **Floral Accents:** Every 5th list item or the corner of a "Summary Card" should feature a subtle botanical SVG mask using the `tertiary` (#53634f) color at 10% opacity.

### Guest Status Chips
*   **Confirmed:** `secondary-container` (#d3e8d5) background with `on-secondary-container` (#56695a) text.
*   **Pending:** `primary-container` (#d9a3a0) background with `on-primary-container` (#603837) text.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts. Place a large `display-md` heading on the left and a small `body-md` description offset to the right.
*   **Do** use the full range of the spacing scale. Use `12` (4rem) or `16` (5.5rem) for top-level section padding to create a premium feel.
*   **Do** use `xl` (1.5rem) rounded corners for all major containers.

### Don't
*   **Don't** use pure black (#000000). Use `on-surface` (#1c1c18) for all high-contrast text.
*   **Don't** use standard "system" shadows. They feel cheap. Stick to tonal layering.
*   **Don't** crowd the interface. If the guest management list feels "busy," increase the vertical spacing between rows using the `4` (1.4rem) scale.
*   **Don't** use high-saturation colors for alerts. Even an error state should feel refined; use `error-container` (#ffdad6) for a soft, communicative warning.