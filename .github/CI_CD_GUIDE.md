# CI/CD Quick Reference

## GitHub Actions Workflows

### 1. Web CI Pipeline (`.github/workflows/web-ci.yml`)

**Purpose**: Validate web app on every push/PR

**Trigger**:

```bash
git push origin main
# or
git push origin develop
```

**Steps**:

1. Install dependencies
2. Run ESLint
3. Run tests (63/63)
4. Build production
5. TypeScript validation
6. Upload artifacts (main only)

**View in GitHub**: Actions → Web CI Pipeline

---

### 2. Mobile Release Pipeline (`.github/workflows/mobile-release.yml`)

**Purpose**: Build Android APK/AAB and iOS archive

**Trigger**:

```bash
# Via git tag
git tag v1.0.0
git push origin v1.0.0

# Via GitHub UI
Actions → Mobile Release Pipeline → Run workflow
```

**Artifacts**:

- `android-apk-{sha}.apk`
- `android-aab-{sha}.aab`
- `ios-archive-{sha}.xcarchive`

**Download**: Actions → Mobile Release Pipeline → Latest run → Artifacts

---

### 3. Release Workflow (`.github/workflows/release.yml`)

**Purpose**: Create GitHub Release with version tag

**Trigger**: Manual via GitHub Actions UI

**Steps**:

1. Go to: Actions → Create Release → Run workflow
2. Enter version: `1.0.0`
3. Enter release notes (optional)
4. Click "Run workflow"

**Output**:

- Git tag: `v1.0.0`
- GitHub Release created
- Mobile pipeline triggered automatically

---

## Version Bumping Checklist

Before creating a release:

1. **Update Web Version**:

   ```bash
   # Edit web_app/package.json
   "version": "1.0.0" → "1.0.1"
   ```

2. **Update Mobile Version**:

   ```bash
   # Edit mobile_app/pubspec.yaml
   version: 1.0.0+1 → version: 1.0.1+2
   ```

3. **Update Health Endpoint**:

   ```bash
   # Edit web_app/src/app/api/health/route.ts
   version: '1.0.0' → version: '1.0.1'
   ```

4. **Commit & Push**:

   ```bash
   git add .
   git commit -m "chore: bump version to 1.0.1"
   git push origin main
   ```

5. **Create Release** (via GitHub Actions UI)

---

## Testing CI/CD Locally

### Web Build Test

```bash
cd web_app
npm ci
npm run lint
npm test
npm run build
npx tsc --noEmit
```

### Mobile Build Test

```bash
cd mobile_app
flutter pub get
flutter analyze
flutter test
flutter build apk --release
flutter build appbundle --release
```

---

## Troubleshooting

### Web CI Fails

**Lint Errors**:

```bash
npm run lint
# Fix reported issues
```

**Test Failures**:

```bash
npm test
# Review failed tests
```

**Build Errors**:

```bash
npm run build
# Check environment variables
```

### Mobile Release Fails

**Dependency Issues**:

```bash
flutter pub get
flutter pub upgrade
```

**Build Errors**:

```bash
flutter clean
flutter pub get
flutter build apk --release
```

**Android Gradle Issues**:

```bash
cd android
./gradlew clean
cd ..
flutter build apk --release
```

---

## Monitoring

### Check CI Status

- GitHub: Repository → Actions tab
- Status badges: Add to README (optional)

### View Artifacts

1. Go to Actions
2. Click on workflow run
3. Scroll to "Artifacts" section
4. Download artifacts

### Monitor Deployments

- Health check: `GET https://readyroad.be/api/health`
- Expected response:

  ```json
  {
    "status": "healthy",
    "timestamp": "2026-01-29T...",
    "service": "readyroad-web",
    "version": "1.0.0"
  }
  ```

---

## Release Checklist

- [ ] Version numbers updated (web, mobile, health)
- [ ] All tests passing locally
- [ ] Production build succeeds locally
- [ ] Changes committed and pushed to main
- [ ] Git tag created and pushed
- [ ] Mobile release pipeline completed
- [ ] Release artifacts downloaded
- [ ] DEPLOYMENT_SMOKE_TEST.md executed
- [ ] Health endpoint verified
- [ ] Production monitoring enabled

---

**Last Updated**: January 29, 2026  
**Pipeline Version**: 1.0.0
