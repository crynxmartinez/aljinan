# Desktop App Build Instructions (Windows & Linux)

## Prerequisites
- Node.js installed
- npm packages installed

## Build Steps

### Build Windows Installer (EXE)
```bash
cd d:\Codes\aljinan
npm run electron:build:win
```

Output: `dist-electron/Tasheel Setup 1.0.0.exe`

### Build Linux Installer (AppImage & DEB)
```bash
npm run electron:build:linux
```

Output:
- `dist-electron/Tasheel-1.0.0.AppImage`
- `dist-electron/tasheel_1.0.0_amd64.deb`

### Test Desktop App Locally
```bash
npm run electron
```

## Configuration
- App opens: https://www.tasheel.live
- App ID: sa.tasheel.app
- App Name: Tasheel
- Persistent login via Electron session
- Window size: 1280x800
- Auto-hide menu bar

## Upload to AWS S3

### Windows Installer
```bash
aws s3 cp dist-electron/Tasheel\ Setup\ 1.0.0.exe s3://your-bucket/downloads/tasheel-windows.exe --acl public-read
```

### Linux AppImage
```bash
aws s3 cp dist-electron/Tasheel-1.0.0.AppImage s3://your-bucket/downloads/tasheel-linux.AppImage --acl public-read
```

### Linux DEB
```bash
aws s3 cp dist-electron/tasheel_1.0.0_amd64.deb s3://your-bucket/downloads/tasheel-linux.deb --acl public-read
```

## App Icon
Place icon files in `electron/` directory:
- `icon.png` (512x512) - for Linux
- `icon.ico` - for Windows

If icons are missing, build will use default Electron icon.

## Notes
- Installers are production-ready
- Users can install like any desktop software
- App maintains login session between launches
- External links open in default browser
