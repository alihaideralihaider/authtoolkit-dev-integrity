# AuthToolkit Media Kit

This media kit contains practical SVG assets for AuthToolkit landing pages, product UIs, documentation, social posts, dashboards, and developer-facing materials. The assets preserve the existing AuthToolkit direction: navy and green, infrastructure-oriented diagrams, thin-line icons, soft mint surfaces, and clean SaaS presentation.

The media kit is intentionally small. It is not a logo redesign, a campaign identity, or a set of alternate brand marks.

## Asset Locations

| Asset group | Location | Use |
| --- | --- | --- |
| Logo files | `brand/logos/` | Headers, documents, product chrome, social templates |
| Favicons | `brand/favicons/` | Browser tabs, app icons, PWA touch icons |
| Patterns | `brand/patterns/` | Landing page backgrounds, hero sections, dashboard empty states |
| Icons | `brand/icons/` | Product feature cards, docs pages, UI callouts |
| Social templates | `brand/social/` | OG images, LinkedIn banners, X/social announcement graphics |
| Usage guide | `brand/guidelines/media-kit.md` | Asset rules and export guidance |

## Logo Files

Use the main logo for most white, mint, or very light backgrounds:

- `brand/logos/authtoolkit-logo.svg`
- `brand/logos/authtoolkit-logo-horizontal.svg`

Use the dark-surface logo on navy or dark backgrounds:

- `brand/logos/authtoolkit-logo-dark.svg`

Use the mark when space is limited or the brand name already appears nearby:

- `brand/logos/authtoolkit-logo-mark.svg`

Use the stacked logo for square placements, presentation covers, avatars, and centered brand moments:

- `brand/logos/authtoolkit-logo-stacked.svg`

## Favicon Usage

Use `brand/favicons/favicon.svg` as the default browser favicon.

Recommended HTML:

```html
<link rel="icon" href="/brand/favicons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/brand/favicons/apple-touch-icon.svg">
```

Use `favicon-32.svg` only where a fixed 32 by 32 asset is required. The favicon mark is simplified so it remains readable at small sizes.

## Pattern Usage

Use pattern files as subtle backgrounds, not as primary content.

- `authtoolkit-infrastructure-pattern-light.svg`: white and soft mint sections.
- `authtoolkit-infrastructure-pattern-dark.svg`: navy hero sections and dark CTAs.
- `authtoolkit-node-pattern.svg`: compact callouts, docs headers, cards, and empty states.
- `authtoolkit-workflow-pattern.svg`: workflow sections, onboarding pages, and product diagrams.

Recommended CSS:

```css
.section-pattern {
  background-color: #f0faea;
  background-image: url("/brand/patterns/authtoolkit-workflow-pattern.svg");
  background-size: cover;
  background-position: center;
}
```

Keep opacity low when layering patterns behind text. Do not place dense copy directly on busy node clusters.

## Icon Usage

Icons are line-based SVGs with navy strokes, green highlights, and soft mint fills. Use them at 24, 32, 40, or 64 pixels depending on context.

Available icons:

- `auth-shield.svg`: authentication, trust, protected routes.
- `api-node.svg`: API products, developer integration, platform primitives.
- `webhook.svg`: webhook delivery, event routing, callbacks.
- `otp.svg`: OTP, verification, one-time codes.
- `magic-link.svg`: magic links, passwordless auth, link-based flows.
- `email-infrastructure.svg`: email delivery, verification messages, notification systems.
- `recovery-loop.svg`: account recovery, rollback, retry, resilience.
- `payment-link.svg`: payment links, revenue recovery, checkout routing.

Do not recolor icons into unrelated palettes. Use navy, green, white, and soft mint only unless a product surface requires a semantic status color.

## Social Templates

Use the social SVGs as editable templates:

- `og-image-template.svg`: 1200 by 630 Open Graph image.
- `linkedin-banner-template.svg`: 1584 by 396 LinkedIn profile/company banner.
- `x-post-template.svg`: 1600 by 900 social post image.

Update headline and supporting copy directly in the SVG or through a build/export step. Keep the logo placement, navy/green palette, and infrastructure motif intact.

Recommended export sizes:

| Use | Source | Export size |
| --- | --- | --- |
| Open Graph | `og-image-template.svg` | 1200 x 630 PNG if required |
| LinkedIn banner | `linkedin-banner-template.svg` | 1584 x 396 PNG if required |
| X/social post | `x-post-template.svg` | 1600 x 900 PNG or 1200 x 675 PNG |
| App icon | `apple-touch-icon.svg` | 180 x 180 PNG if required |
| Favicon | `favicon.svg` | SVG preferred, 32 x 32 PNG fallback if required |

Do not commit fake PNG exports unless the project has an export pipeline or a specific platform needs them.

## Logo Spacing Rules

Keep clear space around every logo equal to at least the height of the shield mark inside the logo.

Minimum sizes:

- Full horizontal logo: 160px wide.
- Main logo: 140px wide.
- Stacked logo: 120px wide.
- Logo mark: 32px wide.
- Favicon: 16px minimum browser-rendered size.

Do not crowd the logo with navigation, dense text, badge labels, or decorative nodes.

## Color Rules

Primary colors:

- Navy: `#041B4D`
- Green: `#7ED321`

Supporting colors:

- Soft mint: `#F0FAEA`
- Pale surface: `#F7FBF8`
- Muted slate text: `#4F6475`
- White: `#FFFFFF`

Use navy for trust, structure, and primary typography. Use green for action, status, routing highlights, and the Toolkit wordmark. Avoid using green as a full-page dominant background.

## Do

- Use white or soft mint backgrounds for most pages.
- Use navy typography with green calls to action.
- Use thin-line workflow patterns to reinforce infrastructure.
- Keep illustrations structured, calm, and operational.
- Keep logo text colors intact: Auth in navy or white, Toolkit in green.
- Use the dark logo only on navy or similarly dark surfaces.

## Don't

- Do not redesign the logo concept.
- Do not create random alternate logos.
- Do not add gradients inside the main logo text.
- Do not use neon, crypto, cyberpunk, or gaming aesthetics.
- Do not place the logo on low-contrast backgrounds.
- Do not stretch, skew, rotate, outline, or add shadows to the logo.
- Do not recolor the mark into arbitrary campaign colors.
- Do not use raster screenshots as source brand assets.

## Production Notes

All files are pure SVG and safe for Next.js, Cloudflare Pages, static HTML, docs sites, and design handoff. They use generic font-family fallbacks instead of bundled external fonts. When exact typography is required in a production export, render with Inter or Poppins in the export environment.

Future additions should extend the same system: navy structure, green operational emphasis, soft mint surfaces, rounded infrastructure diagrams, and restrained developer-platform language.
