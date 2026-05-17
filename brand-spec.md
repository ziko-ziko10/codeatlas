# CodeAtlas Brand Specification

## Color Tokens (OKLch)

### Backgrounds
- `--bg-deep`: oklch(12% 0.02 260) — deepest navy/black
- `--bg`: oklch(16% 0.025 260) — primary surface
- `--bg-elevated`: oklch(20% 0.03 260) — cards, panels
- `--bg-hover`: oklch(24% 0.035 260) — hover states

### Foreground
- `--fg`: oklch(96% 0.005 260) — primary text
- `--fg-muted`: oklch(65% 0.015 260) — secondary text
- `--fg-subtle`: oklch(45% 0.01 260) — captions, labels

### Borders
- `--border`: oklch(30% 0.02 260) — default borders
- `--border-strong`: oklch(40% 0.03 260) — active/focus borders

### Accent Gradient
- `--accent-blue`: oklch(65% 0.22 245) — electric blue
- `--accent-violet`: oklch(60% 0.25 300) — neon violet
- `--accent-cyan`: oklch(75% 0.18 200) — cyan highlights
- `--accent-gradient`: linear-gradient(135deg, var(--accent-blue), var(--accent-violet))

### Semantic Colors
- `--success`: oklch(70% 0.18 145) — emerald
- `--warning`: oklch(75% 0.16 85) — amber
- `--danger`: oklch(60% 0.22 25) — red/critical
- `--info`: oklch(70% 0.18 220) — blue/info

### Glass Overlays
- `--glass-bg`: rgba(20, 22, 40, 0.6)
- `--glass-border`: rgba(100, 120, 200, 0.15)
- `--glass-blur`: 16px

### Glow Effects
- `--glow-blue`: 0 0 20px rgba(100, 140, 255, 0.4)
- `--glow-violet`: 0 0 20px rgba(140, 80, 255, 0.4)
- `--glow-cyan`: 0 0 15px rgba(80, 200, 255, 0.3)

## Typography

### Font Stacks
- `--font-display`: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif
- `--font-body`: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif
- `--font-mono`: 'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, Menlo, monospace

### Type Scale
- H1: 48px / 700 / -0.02em
- H2: 36px / 600 / -0.015em
- H3: 28px / 600 / -0.01em
- H4: 22px / 500 / 0
- H5: 18px / 500 / 0
- H6: 16px / 500 / 0
- Body: 15px / 400 / 0
- Caption: 13px / 400 / 0.01em
- Metric: 32px / 700 / -0.02em (tabular-nums)
- Code: 14px / 400 / 0 (mono)

## Layout Posture

1. **Glassmorphism everywhere**: Cards use `backdrop-filter: blur(16px)` with semi-transparent backgrounds
2. **Neon accent budget**: Blue-violet gradient used at most twice per screen (CTA + one flourish)
3. **Cinematic lighting**: Subtle radial gradients behind hero elements, glow on interactive nodes
4. **Border weight**: 1px hairline borders at 15% opacity, strengthening to 30% on hover
5. **Border radius**: 12px for cards, 8px for inputs/buttons, 16px for modals
6. **No hard shadows**: Only glow effects and subtle elevation via background color shifts
7. **Graph is centerpiece**: Largest real estate on analysis page, with cinematic entrance animation
