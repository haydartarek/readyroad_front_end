param([switch]$CheckOnly)

& {
    $ErrorActionPreference = "Stop"

    $Mobile = [System.IO.Path]::GetFullPath($PSScriptRoot)
    $Flutter = (Get-Command flutter -ErrorAction Stop).Source
    # New Dart SDKs use a launcher plus a VM child. Own the listener directly.
    $Dart = Join-Path (Split-Path -Parent $Flutter) 'cache\dart-sdk\bin\dartvm.exe'
    if (-not (Test-Path -LiteralPath $Dart)) {
        $Dart = Join-Path (Split-Path -Parent $Flutter) 'cache\dart-sdk\bin\dart.exe'
    }
    $GatewayScript = Join-Path $Mobile 'tool\local_contact_gateway.dart'
    $GatewayPort = 63784
    $GatewayProcess = $null
    if (-not (Test-Path -LiteralPath (Join-Path $Mobile 'pubspec.yaml')) -or
        -not (Test-Path -LiteralPath (Join-Path $Mobile 'lib/main.dart')) -or
        -not (Test-Path -LiteralPath $GatewayScript) -or
        -not (Test-Path -LiteralPath $Dart)) {
        throw "Run this script from the Rijvia mobile_app directory."
    }

    Set-Location -LiteralPath $Mobile
    $Mutex = [System.Threading.Mutex]::new($false, 'Local\RijviaFlutterLocal63783')
    $MutexOwned = $false
    try {
        try { $MutexOwned = $Mutex.WaitOne(0) }
        catch [System.Threading.AbandonedMutexException] { $MutexOwned = $true }
        if (-not $MutexOwned) {
            throw "Rijvia is already running from this script. Use that PowerShell window; press Ctrl+C there before restarting."
        }

        $Snapshot = @(Get-CimInstance Win32_Process)
        $ById = @{}
        foreach ($Entry in $Snapshot) { $ById[[int]$Entry.ProcessId] = $Entry }
        $OwnedDart = @{}
        $DartNames = @('dart.exe', 'dartvm.exe', 'dartaotruntime.exe')
        $ProjectPackages = [regex]::Escape((Join-Path $Mobile '.dart_tool')) + '[\\/]'

        # A compiler's package path proves ownership even on another web port.
        foreach ($Entry in $Snapshot) {
            if ($Entry.Name -in $DartNames -and
                $Entry.CommandLine -match 'frontend_server' -and
                $Entry.CommandLine -match $ProjectPackages) {
                $OwnedDart[[int]$Entry.ProcessId] = $Entry
            }
        }

        $Listeners = @(
            Get-NetTCPConnection -LocalPort 63783 -State Listen -ErrorAction SilentlyContinue
        )
        foreach ($Listener in $Listeners) {
            $Entry = $ById[[int]$Listener.OwningProcess]
            if ($null -eq $Entry -or $Entry.Name -notin $DartNames -or
                $Entry.CommandLine -notlike '*flutter_tools.snapshot*' -or
                $Entry.CommandLine -notmatch '--web-port(?:=|\s+)63783\b' -or
                $Entry.CommandLine -notlike '*API_BASE_URL=http://localhost:8890*') {
                throw "Port 63783 belongs to an unverified process. Nothing stopped."
            }
            $OwnedDart[[int]$Entry.ProcessId] = $Entry
        }

        # An old gateway is ours only when its full script path is verified.
        $GatewayListeners = @(
            Get-NetTCPConnection -LocalPort $GatewayPort -State Listen -ErrorAction SilentlyContinue
        )
        $GatewayCommand = '(?:^|\s)"?' + [regex]::Escape($GatewayScript) + '"?(?:\s|$)'
        foreach ($Listener in $GatewayListeners) {
            $Entry = $ById[[int]$Listener.OwningProcess]
            if ($null -eq $Entry -or $Entry.Name -notin $DartNames -or
                $Entry.CommandLine -notmatch $GatewayCommand) {
                throw "Port 63784 belongs to an unverified process. Nothing stopped."
            }
            $OwnedDart[[int]$Entry.ProcessId] = $Entry
        }

        # Include Flutter wrappers above the proven compiler and their Dart children.
        do {
            $Added = $false
            foreach ($Entry in @($OwnedDart.Values)) {
                $Parent = $ById[[int]$Entry.ParentProcessId]
                if ($null -ne $Parent -and $Parent.Name -in $DartNames -and
                    $Parent.CommandLine -like '*flutter_tools.snapshot*' -and
                    $Parent.CommandLine -match '\brun\b' -and
                    -not $OwnedDart.ContainsKey([int]$Parent.ProcessId)) {
                    $OwnedDart[[int]$Parent.ProcessId] = $Parent
                    $Added = $true
                }
            }
        } while ($Added)
        do {
            $Added = $false
            foreach ($Entry in $Snapshot) {
                if ($Entry.Name -in $DartNames -and
                    $OwnedDart.ContainsKey([int]$Entry.ParentProcessId) -and
                    -not $OwnedDart.ContainsKey([int]$Entry.ProcessId)) {
                    $OwnedDart[[int]$Entry.ProcessId] = $Entry
                    $Added = $true
                }
            }
        } while ($Added)

        # Only temporary Chrome instances launched by Flutter for this URL.
        $TempRoot = [regex]::Escape([System.IO.Path]::GetFullPath($env:TEMP).TrimEnd('\'))
        $OldBrowsers = @($Snapshot | Where-Object {
            $_.Name -eq 'chrome.exe' -and $_.CommandLine -notmatch '--type=' -and
            $_.CommandLine -match ('--user-data-dir="?' + $TempRoot + '\\flutter_tools\.[^"\s]+[\\/]flutter_tools_chrome_device\.') -and
            $_.CommandLine -match 'http://localhost:63783/?(?:\s|"|$)'
        })

        if ($CheckOnly) {
            $OwnedDart.Values | Select-Object ProcessId, ParentProcessId, Name | Format-Table
            Write-Host "VERIFIED_PROJECT_DART_PROCESSES=$($OwnedDart.Count)"
            Write-Host "OLD_FLUTTER_CHROME_WINDOWS=$($OldBrowsers.Count)"
            Write-Host 'CONTACT_GATEWAY=http://127.0.0.1:63784; UPSTREAM=http://localhost:3000/api/contact'
            Write-Host 'MODE=WEB_SERVER; AUTOMATIC_BROWSER_WINDOWS=0; CHECK_ONLY=NO_CHANGES'
            return
        }

        Write-Host "`n===== STOP VERIFIED RIJVIA FLUTTER PROCESSES =====" -ForegroundColor Cyan
        foreach ($Entry in $OwnedDart.Values) {
            $Current = Get-CimInstance Win32_Process -Filter "ProcessId=$($Entry.ProcessId)"
            if ($null -eq $Current) { continue }
            if ($Current.CreationDate -ne $Entry.CreationDate) {
                throw "Process identity changed. Restart cancelled."
            }
            $Handle = Get-Process -Id $Entry.ProcessId -ErrorAction Stop
            Stop-Process -InputObject $Handle -Force -ErrorAction Stop
            if (-not $Handle.WaitForExit(5000)) { throw "A verified Flutter process did not exit." }
        }

        foreach ($Entry in $OldBrowsers) {
            $Current = Get-CimInstance Win32_Process -Filter "ProcessId=$($Entry.ProcessId)"
            if ($null -eq $Current) { continue }
            if ($Current.CreationDate -ne $Entry.CreationDate) { throw "Chrome process identity changed." }
            $Handle = Get-Process -Id $Entry.ProcessId -ErrorAction Stop
            $null = $Handle.CloseMainWindow()
            if (-not $Handle.WaitForExit(3000)) {
                Stop-Process -InputObject $Handle -Force -ErrorAction Stop
            }
        }

        $Remaining = @(
            Get-NetTCPConnection -LocalPort 63783 -State Listen -ErrorAction SilentlyContinue
        )
        if ($Remaining.Count -gt 0) { throw "Port 63783 is still occupied. Restart cancelled." }

        Write-Host "`n===== CLEAN FLUTTER BUILD =====" -ForegroundColor Cyan
        & $Flutter clean
        if ($LASTEXITCODE -ne 0) { throw "Flutter clean failed." }
        foreach ($GeneratedDirectory in @('.dart_tool', 'build')) {
            if (Test-Path -LiteralPath (Join-Path $Mobile $GeneratedDirectory)) {
                throw "Flutter clean left $GeneratedDirectory locked. Close the program using this project's files and retry."
            }
        }

        Write-Host "`n===== RESTORE CACHED PACKAGES =====" -ForegroundColor Cyan
        & $Flutter pub get --offline
        if ($LASTEXITCODE -ne 0) { throw "Package restore failed. Restart cancelled." }

        Write-Host "`n===== START LOCAL CONTACT GATEWAY =====" -ForegroundColor Cyan
        $GatewayProcess = Start-Process -FilePath $Dart `
            -ArgumentList @('"' + $GatewayScript + '"') `
            -WorkingDirectory $Mobile -WindowStyle Hidden -PassThru
        $GatewayReady = $false
        for ($Attempt = 0; $Attempt -lt 30; $Attempt++) {
            if ($GatewayProcess.HasExited) { throw "Local contact gateway exited before startup." }
            try {
                $Health = Invoke-RestMethod -Uri "http://127.0.0.1:$GatewayPort/health" -TimeoutSec 1
                if ($Health.service -eq 'rijvia-local-contact-gateway' -and
                    $Health.processId -eq $GatewayProcess.Id -and $Health.port -eq $GatewayPort) {
                    $GatewayReady = $true
                    break
                }
            }
            catch { }
            Start-Sleep -Milliseconds 250
        }
        if (-not $GatewayReady) { throw "Local contact gateway did not become ready. Restart cancelled." }
        Write-Host 'CONTACT_GATEWAY=READY; WEB_APP_FILES=UNCHANGED' -ForegroundColor Green

        Write-Host "`n===== REBUILD RIJVIA WEB SERVER =====" -ForegroundColor Green
        Write-Host 'After Flutter prints that it is serving, open or refresh ONE existing tab:'
        Write-Host 'http://localhost:63783/' -ForegroundColor Cyan
        Write-Host 'Keep this terminal open. Ctrl+C stops the server. No browser windows are launched automatically.'

        $FlutterArguments = @(
            'run', '-d', 'web-server', '--no-pub',
            '--web-hostname', 'localhost', '--web-port', '63783',
            '--dart-define=API_BASE_URL=http://localhost:8890',
            '--dart-define=CONTACT_BASE_URL=http://127.0.0.1:63784'
        )
        & $Flutter @FlutterArguments

        if ($LASTEXITCODE -ne 0) { throw "Flutter startup failed." }
    }
    finally {
        if ($null -ne $GatewayProcess) {
            if (-not $GatewayProcess.HasExited) {
                Stop-Process -InputObject $GatewayProcess -Force -ErrorAction SilentlyContinue
            }
            $GatewayProcess.Dispose()
        }
        if ($MutexOwned) { $Mutex.ReleaseMutex() }
        $Mutex.Dispose()
    }
}
