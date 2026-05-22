# AuthToolkit Palette

The AuthToolkit palette is navy and green, supported by soft mint, pale green, light gray, muted slate, and white.

## Primary Colors

| Token | Hex | Use |
| --- | --- | --- |
| Navy | `#041B4D` | Primary typography, dark sections, trust anchor, header/footer backgrounds |
| Green | `#7ED321` | Primary CTA, safe path, active workflow, success highlights |

## Supporting Colors

| Token | Suggested Hex | Use |
| --- | --- | --- |
| Soft Mint | `#F0FAF3` | Section backgrounds, trust panels, calm marketing blocks |
| Pale Green | `#E7F8D8` | Positive badges, subtle highlight fills |
| Light Gray | `#EEF2F6` | Borders, table dividers, neutral surfaces |
| Muted Slate | `#5F6B7A` | Body text, metadata, helper text |
| Deep Slate | `#14213D` | Secondary dark backgrounds and code panels |
| White | `#FFFFFF` | Primary surface, cards, documentation pages |
| Off White | `#FAFCFE` | App backgrounds, dashboard canvas |

## Semantic Colors

| Meaning | Suggested Hex | Notes |
| --- | --- | --- |
| Success | `#16803C` | Use for confirmed success, not general decoration |
| Warning | `#B7791F` | Use for caution or pending states |
| Risk | `#C05621` | Use for high-risk or escalation states |
| Blocked | `#C62828` | Use for blocked, failed, or unsafe states |
| Info | `#2F80FF` | Use for API links, selected tabs, diagrams |

Semantic colors should never replace the main brand identity. They should appear in dashboards, status badges, tables, alerts, and operational panels.

## Recommended CSS Tokens

```css
:root {
  --at-navy: #041B4D;
  --at-green: #7ED321;
  --at-soft-mint: #F0FAF3;
  --at-pale-green: #E7F8D8;
  --at-light-gray: #EEF2F6;
  --at-muted-slate: #5F6B7A;
  --at-deep-slate: #14213D;
  --at-white: #FFFFFF;
  --at-off-white: #FAFCFE;
  --at-info: #2F80FF;
  --at-success: #16803C;
  --at-warning: #B7791F;
  --at-risk: #C05621;
  --at-blocked: #C62828;
}
```

## Usage Ratios

Recommended page balance:

- 50-65% white/off-white
- 15-25% soft mint/pale green
- 10-20% navy typography and dark sections
- 5-10% green accents
- semantic colors only as needed

Green should be memorable but controlled. Do not turn entire pages green.

## Gradients

Use subtle gradients only.

Approved:

```css
linear-gradient(180deg, #FFFFFF 0%, #F0FAF3 100%)
linear-gradient(135deg, #041B4D 0%, #14213D 100%)
linear-gradient(135deg, rgba(126, 211, 33, 0.12), rgba(47, 128, 255, 0.08))
```

Avoid:

- neon gradients
- purple-blue dominant gradients
- crypto-style rainbow gradients
- heavy gradient orb backgrounds

## Text Contrast

Use navy for primary text on light backgrounds.

Use white for primary text on navy backgrounds.

Muted slate is for secondary text only. Do not use muted slate for critical labels, CTAs, form labels, or small low-contrast text.

## Product Surface Examples

### Landing Page

```text
Hero: navy background, white headline, green CTA
Sections: white and soft mint alternating
Cards: white, light gray border, navy headings
Workflow lines: navy with green active step
```

### Dashboard

```text
Canvas: off-white
Panels: white
Primary decision: navy heading
Success badge: pale green + success text
Blocked badge: pale red + blocked text
```

### Social Card

```text
Background: soft mint
Headline: navy
Accent path: green
Footer: AuthToolkit mark
```
