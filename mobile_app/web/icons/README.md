# ReadyRoad Icons Directory

This directory contains the complete set of visual assets used to define and maintain the visual identity of the ReadyRoad application across all supported platforms.

## 🔹 Usage of Included Images

The icons in this directory are intentionally provided in multiple sizes and formats to support the following use cases:

### 1. Application Icon

Used as the primary app icon on:

- Android home screen
- iOS home screen
- App launcher and task switcher

Ensures correct rendering on different screen densities and device resolutions.

### 2. Logo Usage

Used as the ReadyRoad brand logo in:

- Application headers
- Splash screens
- Authentication screens
- Marketing and presentation materials

Maintains consistent branding across mobile and web platforms.

### 3. Browser Tab Icon (Favicon)

Used as the small icon displayed in:

- Browser tabs
- Bookmarks
- Address bars

This icon visually identifies the ReadyRoad application when accessed via a web browser and is essential for a professional web presence.

### 4. Progressive Web App (PWA) Icons

Used when the web version of ReadyRoad is:

- Installed as a PWA
- Added to the home screen on mobile or desktop

Supports install banners and offline-capable web experiences.

### 5. System & Shortcut Icons

Used by the operating system for:

- Shortcuts
- App previews
- System-level UI references

## 🎯 Purpose

This icon set is **not decorative**.  
It is a foundational part of the ReadyRoad brand identity and ensures:

✅ Consistent appearance across platforms  
✅ High-quality rendering on all devices  
✅ Compliance with modern mobile, web, and PWA standards  
✅ Production-ready visual identity

## 📁 Directory Structure

```
icons/
├── Logo.png                    # Main logo (used in navbar, headers)
├── app_icon.png               # App icon (180x180)
├── app_icon_official.png      # Official app icon variant
├── Icon-192.png               # PWA icon (192x192)
├── Icon-512.png               # PWA icon (512x512)
├── Icon-maskable-192.png      # Maskable PWA icon (192x192)
├── Icon-maskable-512.png      # Maskable PWA icon (512x512)
├── logo_1024.png              # High-res logo (1024x1024)
├── logo_512.png               # Medium logo (512x512)
├── logo_clean.png             # Clean version of logo
├── playstore_icon.png         # Google Play Store icon
├── android/                   # Android-specific icons
├── ios/                       # iOS-specific icons
└── web/                       # Web-specific assets
```

## 🌐 Web Integration

The icons are integrated into the Next.js web app through:

1. **`/web_app/public/manifest.json`** - PWA manifest defining app icons
2. **`/web_app/src/app/layout.tsx`** - Metadata configuration for favicons
3. **`/web_app/public/images/logo.png`** - Navbar and header logo
4. **PWA Icons** - Copied to `/web_app/public/` for progressive web app support

## ✅ Summary

The `/icons` directory is used to:

- Define the visual identity of ReadyRoad
- Support mobile apps, web apps, and PWAs
- Provide a complete, scalable, and professional icon system
- Include Browser Tab Icons (Favicons) for correct browser-level identification

---

**Last Updated:** January 2026  
**Maintained by:** ReadyRoad Development Team
