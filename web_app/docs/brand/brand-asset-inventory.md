# ReadyRoad Brand Asset Inventory

Reviewed: 2026-07-21

This inventory covers the web, Android, iOS, and Flutter web branding surfaces. The source identity remains the established ReadyRoad curved-road mark and orange/navy palette. Platform icons are compact derivatives of that mark, not a redesign.

## Web assets

| Path | Purpose | Dimensions | Format | Bytes | Referenced by | Surface | Duplicate | Unused | Decision |
| --- | --- | ---: | --- | ---: | --- | --- | --- | --- | --- |
| `public/images/logo.png` | Full in-product logo | 512x512 | PNG, alpha | 352,912 | Header, footer, auth, status, hero, admin, Open Graph generator | Web/social | No | No | Keep as canonical presentation logo |
| `public/favicon.ico` | Browser favicon fallback | 16/32/48 | Genuine multi-image ICO | 9,725 | Root Next.js metadata | Web | No | No | Keep |
| `public/favicon-16x16.png` | Small browser favicon | 16x16 | PNG, alpha | 977 | Root Next.js metadata | Web | No | No | Keep |
| `public/favicon-32x32.png` | Standard browser favicon | 32x32 | PNG, alpha | 2,970 | Root Next.js metadata | Web | No | No | Keep |
| `public/apple-touch-icon.png` | iOS home-screen icon | 180x180 | PNG, opaque | 18,569 | Root Next.js metadata | Web/iOS | Platform copy | No | Keep |
| `public/mstile-150x150.png` | Microsoft tile icon | 150x150 | PNG, opaque | 13,988 | `public/browserconfig.xml` | Web/Windows | Platform copy | No | Keep |
| `public/icons/icon-192.png` | PWA standard icon | 192x192 | PNG, opaque | 21,088 | `public/manifest.json`, Next.js metadata, loading state | Web/PWA | Intentional platform copy | No | Keep |
| `public/icons/icon-512.png` | PWA high-resolution icon | 512x512 | PNG, opaque | 143,499 | `public/manifest.json`, Next.js metadata | Web/PWA | Intentional platform copy | No | Keep |
| `public/icons/icon-maskable-192.png` | PWA maskable icon | 192x192 | PNG, opaque | 11,641 | `public/manifest.json` | Web/PWA | Intentional derivative | No | Keep; artwork uses a 70% safe zone |
| `public/icons/icon-maskable-512.png` | PWA maskable high-resolution icon | 512x512 | PNG, opaque | 71,630 | `public/manifest.json` | Web/PWA | Intentional derivative | No | Keep; artwork uses a 70% safe zone |

## Web integration files

| Path | Purpose | Referenced by | Decision |
| --- | --- | --- | --- |
| `public/manifest.json` | Installable web app identity and icon declarations | Root metadata/browser | Keep; updateable cache policy |
| `public/browserconfig.xml` | Microsoft tile declaration | Browsers on Windows | Keep |
| `src/app/layout.tsx` | Central icon, manifest, theme, Open Graph, and Twitter metadata | Every route | Keep as the single root integration point |
| `src/app/opengraph-image.tsx` | Language-neutral 1200x630 social preview | Open Graph and Twitter metadata | Keep dynamic; uses the real logo and no legal claim |
| `src/components/ui/page-loading.tsx` | Lightweight loading identity | Root loading boundary | Keep; decorative icon plus reduced-motion spinner behavior |
| `src/components/ui/status-screen.tsx` | 404/error/unauthorized identity | Error surfaces | Keep; duplicate logo is hidden from assistive technology |

## Android assets

| Path | Purpose | Dimensions | Format | Bytes | Referenced by | Duplicate | Unused | Decision |
| --- | --- | ---: | --- | ---: | --- | --- | --- | --- |
| `mobile_app/android/app/src/main/res/mipmap-mdpi/ic_launcher.png` | Launcher icon | 48x48 | PNG, opaque | 2,304 | Android manifest through `@mipmap/ic_launcher` | Required native size | No | Keep |
| `mobile_app/android/app/src/main/res/mipmap-hdpi/ic_launcher.png` | Launcher icon | 72x72 | PNG, opaque | 3,966 | Android resource selection | Required native size | No | Keep |
| `mobile_app/android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` | Launcher icon | 96x96 | PNG, opaque | 5,905 | Android resource selection | Required native size | No | Keep |
| `mobile_app/android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` | Launcher icon | 144x144 | PNG, opaque | 13,014 | Android resource selection | Required native size | No | Keep |
| `mobile_app/android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` | Launcher icon | 192x192 | PNG, opaque | 21,088 | Android resource selection | Exact 192px platform copy | No | Keep |
| `mobile_app/android/app/src/main/res/drawable-nodpi/launch_image.png` | Centered splash mark | 192x192 | PNG, opaque | 21,088 | Both Android launch background XML files | Exact 192px platform copy | No | Keep |

## iOS assets

All AppIcon files below are referenced by `AppIcon.appiconset/Contents.json`. Equal pixel sizes occur at different Apple idiom/scale slots and are intentional required copies.

| Path under `mobile_app/ios/Runner/Assets.xcassets` | Purpose | Dimensions | Bytes | Duplicate | Unused | Decision |
| --- | --- | ---: | ---: | --- | --- | --- |
| `AppIcon.appiconset/Icon-App-20x20@1x.png` | iPad notification | 20x20 | 678 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-20x20@2x.png` | iPhone/iPad notification | 40x40 | 1,724 | Same pixels as 40pt @1x | No | Keep, required slot |
| `AppIcon.appiconset/Icon-App-20x20@3x.png` | iPhone notification | 60x60 | 3,035 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-29x29@1x.png` | iPad settings | 29x29 | 1,140 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-29x29@2x.png` | iPhone/iPad settings | 58x58 | 2,920 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-29x29@3x.png` | iPhone settings | 87x87 | 4,824 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-40x40@1x.png` | iPad spotlight | 40x40 | 1,724 | Same pixels as 20pt @2x | No | Keep, required slot |
| `AppIcon.appiconset/Icon-App-40x40@2x.png` | iPhone/iPad spotlight | 80x80 | 4,290 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-40x40@3x.png` | iPhone spotlight | 120x120 | 8,421 | Same pixels as 60pt @2x | No | Keep, required slot |
| `AppIcon.appiconset/Icon-App-60x60@2x.png` | iPhone app icon | 120x120 | 8,421 | Same pixels as 40pt @3x | No | Keep, required slot |
| `AppIcon.appiconset/Icon-App-60x60@3x.png` | iPhone app icon | 180x180 | 18,569 | Platform-sized derivative | No | Keep |
| `AppIcon.appiconset/Icon-App-76x76@1x.png` | iPad app icon | 76x76 | 4,280 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-76x76@2x.png` | iPad app icon | 152x152 | 14,119 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-83.5x83.5@2x.png` | iPad Pro app icon | 167x167 | 16,431 | No | No | Keep |
| `AppIcon.appiconset/Icon-App-1024x1024@1x.png` | App Store icon | 1024x1024 | 478,954 | No | No | Keep, mandatory App Store asset |
| `LaunchImage.imageset/LaunchImage.png` | Launch mark | 168x168 | 16,714 | No | No | Keep |
| `LaunchImage.imageset/LaunchImage@2x.png` | Launch mark | 336x336 | 59,055 | No | No | Keep |
| `LaunchImage.imageset/LaunchImage@3x.png` | Launch mark | 504x504 | 138,150 | No | No | Keep |

The launch images are referenced by `LaunchScreen.storyboard` and `LaunchImage.imageset/Contents.json`. Every icon is an opaque PNG, avoiding App Store alpha-channel warnings.

## Flutter and Flutter web assets

| Path | Purpose | Dimensions | Format | Bytes | Referenced by | Duplicate | Unused | Decision |
| --- | --- | ---: | --- | ---: | --- | --- | --- | --- |
| `mobile_app/assets/branding/readyroad-app-icon.png` | Login-screen identity | 192x192 | PNG, opaque | 21,088 | `pubspec.yaml`, login screen | Exact 192px platform copy | No | Keep; 192 avoids packaging a 1024px UI asset |
| `mobile_app/web/favicon.png` | Flutter web browser icon | 32x32 | PNG, opaque | 1,265 | Flutter web `index.html` | Platform copy | No | Keep |
| `mobile_app/web/icons/Icon-192.png` | Flutter web PWA icon | 192x192 | PNG, opaque | 21,088 | Flutter web manifest | Exact platform copy | No | Keep |
| `mobile_app/web/icons/Icon-512.png` | Flutter web PWA icon | 512x512 | PNG, opaque | 143,499 | Flutter web manifest | Exact platform copy | No | Keep |
| `mobile_app/web/icons/Icon-maskable-192.png` | Flutter web maskable icon | 192x192 | PNG, opaque | 11,641 | Flutter web manifest | Exact platform copy | No | Keep |
| `mobile_app/web/icons/Icon-maskable-512.png` | Flutter web maskable icon | 512x512 | PNG, opaque | 71,630 | Flutter web manifest | Exact platform copy | No | Keep |

## Duplicate and optimization decisions

- Exact duplicates are intentional platform copies or required native slots. Removing them would break resource selection, manifests, or Apple asset-catalog completeness.
- No unreferenced branding image was found. No email-specific logo asset exists.
- App icons are opaque PNGs; only the full presentation logo and legacy browser favicons retain transparency.
- Maskable artwork occupies about 70% of the canvas so Android launchers can crop it safely.
- The generated derivatives briefly totalled 4,814,745 bytes before PNG optimization. The reviewed final set totals 1,768,024 bytes.
- The pre-milestone set totalled 499,591 bytes, largely because Android/iOS still contained tiny Flutter placeholders and blank one-pixel launch files. The size increase is therefore the cost of replacing placeholders with real high-DPI brand assets, not accidental duplication.

## Brand integration decisions

- Header, footer, auth, loading, 404, global error, and unauthorized states use one ReadyRoad identity.
- The logo next to a visible `ReadyRoad` wordmark is decorative (`alt=""`, `aria-hidden="true"`); standalone meaningful logos retain an accessible name.
- The social image is language-neutral: logo, product name, and a concise English default description. No fake language-specific URL or malformed Arabic rendering is introduced.
- Root metadata remains the sole branding metadata integration point. Existing page-specific titles, descriptions, canonicals, and URL strategy are unchanged.
- Manifest responses are revalidated, icon/logo responses use a bounded cache, and the dynamic Open Graph route retains Next.js update behavior.
