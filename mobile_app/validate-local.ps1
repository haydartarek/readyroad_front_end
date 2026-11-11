# StorePreflightOnly is read-only and does not run the full code suite or build.
param(
    [switch]$StorePreflightOnly,
    [string]$ApiBaseUrl,
    [string]$AndroidSdkPath
)

# All Flutter work in this checkout is validated together, including Google auth.
# This validates code; local services are started by ../..\run-local.ps1 -NoMobile.
$ErrorActionPreference = 'Stop'
$previousLocation = Get-Location

try {
    Set-Location -LiteralPath $PSScriptRoot

    if ($StorePreflightOnly) {
        $checks = [System.Collections.Generic.List[object]]::new()
        function Add-StoreCheck([string]$Name, [bool]$Passed, [string]$Detail) {
            $checks.Add([pscustomobject]@{
                Check = $Name
                Status = if ($Passed) { 'PASS' } else { 'BLOCKED' }
                Detail = $Detail
            })
        }

        $flutterCommand = Get-Command flutter -ErrorAction SilentlyContinue
        $flutterRoot = if ($flutterCommand) {
            Split-Path (Split-Path $flutterCommand.Source -Parent) -Parent
        }
        $extensionPath = if ($flutterRoot) {
            Join-Path $flutterRoot 'packages/flutter_tools/gradle/src/main/kotlin/FlutterExtension.kt'
        }
        $extension = if ($extensionPath -and (Test-Path -LiteralPath $extensionPath)) {
            Get-Content -LiteralPath $extensionPath -Raw
        } else { '' }
        $ndkMatch = [regex]::Match($extension, 'val ndkVersion: String = "([^"]+)"')
        $ndkVersion = $ndkMatch.Groups[1].Value
        Add-StoreCheck 'Flutter defaults' ($ndkMatch.Success) 'Read installed Flutter toolchain; no downloads or upgrades.'

        $sdkCandidates = @($AndroidSdkPath, $env:ANDROID_HOME, $env:ANDROID_SDK_ROOT)
        if (Test-Path -LiteralPath 'android/local.properties') {
            $sdkProperty = Select-String -LiteralPath 'android/local.properties' -Pattern '^sdk.dir=(.+)$'
            if ($sdkProperty) {
                $sdkCandidates += $sdkProperty.Matches[0].Groups[1].Value.Replace('\\', '\').Replace('\:', ':')
            }
        }
        if ($env:LOCALAPPDATA) { $sdkCandidates += Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
        $sdkPath = $sdkCandidates | Where-Object {
            $_ -and (Test-Path -LiteralPath $_ -PathType Container)
        } | Select-Object -First 1
        Add-StoreCheck 'Android SDK' ([bool]$sdkPath) 'An existing SDK path is required; this check does not change Flutter configuration.'
        Add-StoreCheck 'Android API 36' ([bool]($sdkPath -and (Test-Path -LiteralPath (Join-Path $sdkPath 'platforms/android-36/android.jar')))) 'compileSdk/targetSdk 36.'
        Add-StoreCheck 'Flutter NDK' ([bool]($sdkPath -and $ndkVersion -and (Test-Path -LiteralPath (Join-Path $sdkPath "ndk/$ndkVersion/source.properties")))) "Installed Flutter requires NDK $ndkVersion; binary 16 KB compatibility still requires an actual build."
        Add-StoreCheck 'ADB' ([bool]($sdkPath -and (Test-Path -LiteralPath (Join-Path $sdkPath 'platform-tools/adb.exe')))) 'Required for the owner device test on Windows.'

        $signingNames = @('RIJVIA_ANDROID_KEYSTORE_PATH', 'RIJVIA_ANDROID_STORE_PASSWORD', 'RIJVIA_ANDROID_KEY_ALIAS', 'RIJVIA_ANDROID_KEY_PASSWORD')
        $missingSigning = @($signingNames | Where-Object {
            [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_))
        })
        $keyPath = [Environment]::GetEnvironmentVariable('RIJVIA_ANDROID_KEYSTORE_PATH')
        if ($keyPath -and -not [System.IO.Path]::IsPathRooted($keyPath)) {
            # Gradle Project.file resolves relative upload paths from android/app.
            $keyPath = Join-Path (Join-Path $PSScriptRoot 'android/app') $keyPath
        }
        $keyFile = [bool]($keyPath -and (Test-Path -LiteralPath $keyPath -PathType Leaf))
        Add-StoreCheck 'Upload signing inputs' ($missingSigning.Count -eq 0 -and $keyFile) 'Checks presence only; does not print passwords, alias, keystore path, or verify the certificate.'

        $apiUri = $null
        $apiValid = [Uri]::TryCreate($ApiBaseUrl, [UriKind]::Absolute, [ref]$apiUri)
        $apiValid = $apiValid -and $apiUri.Scheme -eq 'https' -and $apiUri.Host -and
            -not $apiUri.UserInfo -and -not $apiUri.Query -and -not $apiUri.Fragment -and
            $apiUri.Host -notin @('localhost', '127.0.0.1', '::1', '[::1]', '10.0.2.2') -and
            -not $apiUri.Host.EndsWith('.localhost')
        Add-StoreCheck 'Release API input' ([bool]$apiValid) 'Provide the approved HTTPS API_BASE_URL; no network request or production mutation is made.'

        $checks | Format-Table -AutoSize -Wrap | Out-Host
        Write-Host 'IOS_ARCHIVE=REQUIRES_MAC_XCODE_SIGNING'
        Write-Host 'NATIVE_AUTH_AND_STORE_BILLING=DEFERRED_BY_OWNER'
        Write-Host 'DEVICE_TESTS=OWNER_PENDING'
        Write-Host 'STORE_SUBMISSION=NOT_READY'
        if ($checks.Status -contains 'BLOCKED') {
            throw 'STORE_LOCAL_PREFLIGHT=BLOCKED. See checks above and STORE_READINESS_2026-10-14.md.'
        }
        Write-Host 'STORE_LOCAL_INPUTS=PASS; signed binaries and store requirements remain unverified.'
        return
    }

    Write-Host "`n===== FIX 05F FLUTTER ANALYZE =====" -ForegroundColor Cyan
    flutter analyze --no-pub
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'FLUTTER_ANALYZE=FAILED' -ForegroundColor Red
        throw "Flutter analyze failed with exit code $LASTEXITCODE."
    }
    Write-Host 'FLUTTER_ANALYZE=PASS' -ForegroundColor Green

    Write-Host "`n===== FIX 05F FLUTTER TESTS =====" -ForegroundColor Cyan
    flutter test --no-pub
    if ($LASTEXITCODE -ne 0) {
        Write-Host 'FLUTTER_TESTS=FAILED' -ForegroundColor Red
        throw "Flutter tests failed with exit code $LASTEXITCODE."
    }
    Write-Host 'FLUTTER_TESTS=PASS' -ForegroundColor Green
    Write-Host 'FIX_05F_CODE_VALIDATION=PASS' -ForegroundColor Green
}
finally {
    Set-Location -LiteralPath $previousLocation.Path
}
