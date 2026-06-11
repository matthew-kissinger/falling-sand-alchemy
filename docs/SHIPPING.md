# Shipping — one web bundle, every target

All targets wrap the same `dist/` build through the `src/platform/` adapter seam.

## Web (live)

- **GitHub Pages:** https://matthew-kissinger.github.io/falling-sand-alchemy/ — auto-deploys from `main` via `.github/workflows/deploy.yml` (tests gate the publish).
- **PWA:** service worker precaches everything (incl. Google Fonts at runtime); the game works fully offline once visited. Android/desktop Chrome offer "Install" / "Add to Home Screen" for a fullscreen icon-on-launcher install with no store.

## itch.io

The page must be created once in the itch.io web UI (butler cannot create projects):
1. itch.io → Upload new project → HTML, name it, set "This file will be played in the browser".
2. Then every release is one command:
   ```powershell
   butler push release-artifacts\falling-sand-alchemy-v0.1.0-web.zip mkvision0/falling-sand-alchemy:html5
   ```
   butler is installed and authenticated on this machine. Regenerate the zip with:
   ```powershell
   npm run build; Compress-Archive dist\* release-artifacts\falling-sand-alchemy-vX.Y.Z-web.zip
   ```

## Desktop (Tauri 2, Windows)

- Scaffold: `src-tauri/` (identifier `io.github.matthewkissinger.fallingsandalchemy`).
- Build: `npx tauri build` → NSIS installer at `src-tauri\target\release\bundle\nsis\`.
- Unsigned: Windows SmartScreen will warn on install. Code signing cert (or MS Store) is the fix when distribution matters.
- macOS/Linux builds need their host OS (or CI matrix) — same config.

## Android (Capacitor)

- Scaffold: `android/` (Gradle project), `capacitor.config.ts`.
- Build debug APK (portable JDK at `~\tools\jdk-21.0.11+10`, SDK at `%LOCALAPPDATA%\Android\Sdk`):
  ```powershell
  npm run build; npx cap sync android
  cd android
  $env:JAVA_HOME = "C:\Users\Mattm\tools\jdk-21.0.11+10"
  .\gradlew.bat assembleDebug   # → android\app\build\outputs\apk\debug\app-debug.apk
  ```
- **Play Store path (manual steps):** Google Play Console account ($25 once) → generate an upload keystore (`keytool -genkey`) → `gradlew bundleRelease` for a signed `.aab` → store listing + content rating + data-safety form. The webview is `dist/` verbatim; haptics already degrade gracefully (Capacitor Haptics plugin is the v0.2 upgrade for iOS).

## Versioning

Keep `package.json`, `src-tauri/tauri.conf.json`, and the Android `versionName` (android/app/build.gradle) in step. Tag releases `vX.Y.Z`; attach the web zip + installers via `gh release create`.
