& {
    $ErrorActionPreference = "Stop"

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host "RIJVIA DASHBOARD V2 - PHASE 1.1 MUTATION SAFE" -ForegroundColor Cyan
    Write-Host "LOCAL ONLY - VISUAL & UX REFINEMENT" -ForegroundColor Yellow
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host ""

    # ==================================================
    # PATHS
    # ==================================================

    $DashboardFile = Join-Path $WebPath "src\app\(protected)\dashboard\page.tsx"
    $AccountFile   = Join-Path $WebPath "src\components\payment\account-access-card.tsx"
    $RecentFile    = Join-Path $WebPath "src\components\dashboard\recent-activity-list.tsx"

    $ArFile = Join-Path $WebPath "src\messages\ar.json"
    $NlFile = Join-Path $WebPath "src\messages\nl.json"
    $FrFile = Join-Path $WebPath "src\messages\fr.json"
    $EnFile = Join-Path $WebPath "src\messages\en.json"

    $Files = @(
        $DashboardFile
        $AccountFile
        $RecentFile
        $ArFile
        $NlFile
        $FrFile
        $EnFile
    )

    foreach ($File in $Files) {
        if (-not (Test-Path -LiteralPath $File)) {
            throw "STOP: Missing file: $File"
        }
    }

    # ==================================================
    # HELPERS
    # ==================================================

    function Read-Normalized {
        param(
            [string]$Path
        )

        return [System.IO.File]::ReadAllText(
            $Path,
            [System.Text.Encoding]::UTF8
        ).Replace("`r`n", "`n")
    }

    function Join-Lines {
        param(
            [string[]]$Lines
        )

        return (($Lines -join "`n") + "`n")
    }

    function Replace-Expected {
        param(
            [string]$Source,
            [string]$Old,
            [string]$New,
            [int]$Expected,
            [string]$Label
        )

        $Count = (
            [regex]::Matches(
                $Source,
                [regex]::Escape($Old)
            )
        ).Count

        Write-Host ("{0} matches: {1}" -f $Label, $Count)

        if ($Count -ne $Expected) {
            throw "STOP: Expected $Expected match(es) for $Label, found $Count."
        }

        return $Source.Replace(
            $Old,
            $New
        )
    }

    function Replace-BetweenMarkers {
        param(
            [string]$Source,
            [string]$StartMarker,
            [string]$EndMarker,
            [string]$Replacement,
            [string]$Label
        )

        $StartCount = (
            [regex]::Matches(
                $Source,
                [regex]::Escape($StartMarker)
            )
        ).Count

        $EndCount = (
            [regex]::Matches(
                $Source,
                [regex]::Escape($EndMarker)
            )
        ).Count

        Write-Host ("{0} start matches: {1}" -f $Label, $StartCount)
        Write-Host ("{0} end matches  : {1}" -f $Label, $EndCount)

        if ($StartCount -ne 1 -or $EndCount -ne 1) {
            throw "STOP: Marker mismatch for $Label."
        }

        $StartIndex = $Source.IndexOf(
            $StartMarker,
            [System.StringComparison]::Ordinal
        )

        $EndIndex = $Source.IndexOf(
            $EndMarker,
            $StartIndex + $StartMarker.Length,
            [System.StringComparison]::Ordinal
        )

        if (
            $StartIndex -lt 0 -or
            $EndIndex -lt 0 -or
            $EndIndex -le $StartIndex
        ) {
            throw "STOP: Invalid marker order for $Label."
        }

        return (
            $Source.Substring(0, $StartIndex) +
            $Replacement +
            $Source.Substring($EndIndex)
        )
    }

    function Write-Utf8File {
        param(
            [string]$Path,
            [string]$Content
        )

        if ([string]::IsNullOrWhiteSpace($Path)) {
            throw "STOP: Empty write path."
        }

        if ($null -eq $Content) {
            throw "STOP: Null content for $Path"
        }

        [System.IO.File]::WriteAllText(
            $Path,
            $Content.Replace("`n", "`r`n"),
            [System.Text.UTF8Encoding]::new($false)
        )
    }

    # ==================================================
    # READ CURRENT LOCAL STATE
    # ==================================================

    $Dashboard = Read-Normalized $DashboardFile
    $Account   = Read-Normalized $AccountFile
    $Recent    = Read-Normalized $RecentFile

    $Ar = Read-Normalized $ArFile
    $Nl = Read-Normalized $NlFile
    $Fr = Read-Normalized $FrFile
    $En = Read-Normalized $EnFile

    # ==================================================
    # PREFLIGHT
    # ==================================================

    if (-not $Dashboard.Contains('.slice(-6)')) {
        throw "STOP: Expected Phase 1 recentScores state not found."
    }

    if (-not $Dashboard.Contains('<AccountAccessCard />')) {
        throw "STOP: Expected full AccountAccessCard call not found."
    }

    $ExpectedRecentRowClass =
        'className="group flex min-w-0 flex-col items-stretch gap-3 rounded-xl border border-border bg-background/60 p-4 text-start transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"'

    if (-not $Recent.Contains($ExpectedRecentRowClass)) {
        throw "STOP: Audited local Recent Activity row state changed."
    }

    foreach ($Messages in @($Ar, $Nl, $Fr, $En)) {
        if (
            $Messages.Contains('"dashboard.v2_exam_cta"') -or
            $Messages.Contains('"dashboard.v2_focus_cta"')
        ) {
            throw "STOP: Phase 1.1 translation keys already exist."
        }
    }

    Write-Host "PASS: Phase 1.1 preflight confirmed." -ForegroundColor Green

    # ==================================================
    # 1. DASHBOARD DERIVED INSIGHT
    #    + CORRECT TREND ORDER
    # ==================================================

    $DashboardDerivation = Join-Lines -Lines @(
        '  const focusCategoryCode ='
        '    topPriority?.categoryCode ??'
        '    fallbackWeakArea?.categoryCode ??'
        '    null;'
        ''
        '  const focusActionPath ='
        '    focusCategoryCode'
        '      ? `/practice/${focusCategoryCode}`'
        '      : topRecommendation?.actionPath || "/practice";'
        ''
        '  const hasFocusEvidence ='
        '    Boolean(topPriority || fallbackWeakArea);'
        ''
        '  const heroInsight ='
        '    hasFocusEvidence && focusAccuracy !== null'
        '      ? t("student_intelligence.top_priority", {'
        '          category: focusName,'
        '          accuracy: Math.round(focusAccuracy),'
        '        })'
        '      : t("dashboard.subtitle");'
        ''
        '  const recommendationText ='
        '    topRecommendation'
        '      ? t(topRecommendation.key, {'
        '          category: focusName,'
        '        })'
        '      : heroInsight;'
        ''
        '  const focusCtaLabel ='
        '    focusCategoryCode'
        '      ? t("dashboard.v2_focus_cta")'
        '      : topRecommendation'
        '        ? t(topRecommendation.key, {'
        '            category: focusName,'
        '          })'
        '        : t("dashboard.action_practice_title");'
        ''
        '  const recentScores ='
        '    studentIntelligence.examAnalytics.recentScores'
        '      .slice(0, 6)'
        '      .reverse()'
        '      .map((score) =>'
        '        Math.max('
        '          0,'
        '          Math.min('
        '            100,'
        '            Number(score) || 0,'
        '          ),'
        '        ),'
        '      );'
        ''
    )

    $Dashboard = Replace-BetweenMarkers `
        -Source $Dashboard `
        -StartMarker '  const focusActionPath =' `
        -EndMarker '  const readinessLabel =' `
        -Replacement $DashboardDerivation `
        -Label "Dashboard insight and trend derivation"

    # ==================================================
    # 2. LESSON METRIC
    # ==================================================

    $Dashboard = Replace-Expected `
        -Source $Dashboard `
        -Old '      label: t("dashboard.stat_lessons_read"),' `
        -New '      label: t("dashboard.lessons_completed"),' `
        -Expected 1 `
        -Label "Completed lesson metric label"

    # ==================================================
    # 3. TOP AREA
    # ==================================================

    $NewTopArea = Join-Lines -Lines @(
        '      {/* Primary status area */}'
        '      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">'
        '        <div className="min-w-0">'
        '          <p className="break-words text-lg font-black text-foreground">'
        '            {t("dashboard.welcome_back")} {firstName}'
        '          </p>'
        '        </div>'
        ''
        '        <AccountAccessCard compact />'
        '      </div>'
        ''
        '      <PageHeroSurface>'
        '        <PageHeroEyebrow>'
        '          {t("student_intelligence.title")}'
        '        </PageHeroEyebrow>'
        ''
        '        <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">'
        '          <div className="min-w-0">'
        '            <PageHeroTitle>'
        '              {t("student_intelligence.readiness")}'
        '            </PageHeroTitle>'
        ''
        '            <PageHeroDescription className="mt-2 max-w-3xl">'
        '              {heroInsight}'
        '            </PageHeroDescription>'
        ''
        '            <div className="mt-5 flex min-w-0 flex-wrap items-end gap-3">'
        '              <span className="text-4xl font-black tracking-tight text-primary sm:text-5xl">'
        '                {readinessLabel}'
        '              </span>'
        ''
        '              <span className="pb-1 text-sm font-semibold text-muted-foreground">'
        '                {levelLabel} · {trendLabel}'
        '              </span>'
        '            </div>'
        ''
        '            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">'
        '              <div'
        '                className="h-full rounded-full bg-primary transition-[width] duration-500"'
        '                style={{'
        '                  width: `${readiness ?? 0}%`,'
        '                }}'
        '              />'
        '            </div>'
        '          </div>'
        ''
        '          <div className="min-w-[150px] rounded-2xl border border-secondary/15 bg-secondary/[0.05] p-4">'
        '            <p className="text-xs font-semibold text-muted-foreground">'
        '              {t("student_intelligence.pass_probability")}'
        '            </p>'
        ''
        '            <p className="mt-1 text-2xl font-black text-secondary">'
        '              {passProbabilityLabel}'
        '            </p>'
        '          </div>'
        '        </div>'
        ''
        '        <div className="flex flex-col gap-3 pt-2 sm:flex-row">'
        '          <Button asChild className="w-full sm:w-auto">'
        '            <Link href="/exam">'
        '              {t("dashboard.v2_exam_cta")}'
        '            </Link>'
        '          </Button>'
        ''
        '          <Button'
        '            asChild'
        '            variant="outline"'
        '            className="w-full sm:w-auto"'
        '          >'
        '            <Link href={focusActionPath}>'
        '              {focusCtaLabel}'
        '            </Link>'
        '          </Button>'
        '        </div>'
        '      </PageHeroSurface>'
        ''
    )

    $Dashboard = Replace-BetweenMarkers `
        -Source $Dashboard `
        -StartMarker '      {/* Primary status area */}' `
        -EndMarker '      {/* Four key metrics */}' `
        -Replacement $NewTopArea `
        -Label "Dashboard top area"

    # ==================================================
    # 4. TREND + NEXT FOCUS
    # ==================================================

    $NewInsightArea = Join-Lines -Lines @(
        '      {/* One trend area + one next-focus area */}'
        '      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">'
        '        <PageSectionSurface'
        '          title={t("student_intelligence.exam_history")}'
        '          description={t("student_intelligence.exam.score_trend")}'
        '        >'
        '          {recentScores.length === 0 ? ('
        '            <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 px-4 text-center text-sm text-muted-foreground">'
        '              {t("common.not_available")}'
        '            </div>'
        '          ) : ('
        '            <div'
        '              dir="ltr"'
        '              className="flex h-48 min-w-0 items-end gap-2 rounded-2xl border border-border/60 bg-background/70 px-3 pb-3 pt-4 sm:gap-3 sm:px-4"'
        '            >'
        '              {recentScores.map((score, index) => {'
        '                const isLatest ='
        '                  index === recentScores.length - 1;'
        ''
        '                return ('
        '                  <div'
        '                    key={`${index}-${score}`}'
        '                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"'
        '                    title={`${Math.round(score)}%`}'
        '                  >'
        '                    <span'
        '                      className={cn('
        '                        "text-[10px] font-bold sm:text-xs",'
        '                        isLatest'
        '                          ? "text-primary"'
        '                          : "text-muted-foreground",'
        '                      )}'
        '                    >'
        '                      {Math.round(score)}%'
        '                    </span>'
        ''
        '                    <div className="flex h-28 w-full items-end overflow-hidden rounded-lg bg-muted/50 p-1">'
        '                      <div'
        '                        className={cn('
        '                          "w-full rounded-md transition-[height] duration-500",'
        '                          isLatest'
        '                            ? "bg-primary"'
        '                            : "bg-secondary/30",'
        '                        )}'
        '                        style={{'
        '                          height: `${Math.max(6, score)}%`,'
        '                        }}'
        '                      />'
        '                    </div>'
        ''
        '                    <span'
        '                      className={cn('
        '                        "text-[10px] font-semibold",'
        '                        isLatest'
        '                          ? "text-primary"'
        '                          : "text-muted-foreground",'
        '                      )}'
        '                    >'
        '                      #{index + 1}'
        '                    </span>'
        '                  </div>'
        '                );'
        '              })}'
        '            </div>'
        '          )}'
        '        </PageSectionSurface>'
        ''
        '        <PageSectionSurface'
        '          title={t("student_intelligence.next_steps")}'
        '          description={t("analytics.weak_areas")}'
        '        >'
        '          <div className="space-y-4">'
        '            <div className="flex min-w-0 items-start gap-3">'
        '              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">'
        '                <Target'
        '                  className="h-4.5 w-4.5"'
        '                  aria-hidden'
        '                />'
        '              </span>'
        ''
        '              <div className="min-w-0">'
        '                <p className="break-words text-base font-black text-foreground">'
        '                  {focusName}'
        '                </p>'
        ''
        '                {focusAccuracy !== null ? ('
        '                  <p className="mt-1 text-sm font-semibold text-primary">'
        '                    {t("analytics.stat_accuracy")}:{" "}'
        '                    {Math.round(focusAccuracy)}%'
        '                  </p>'
        '                ) : ('
        '                  <p className="mt-1 text-sm text-muted-foreground">'
        '                    {t("common.not_available")}'
        '                  </p>'
        '                )}'
        '              </div>'
        '            </div>'
        ''
        '            <p className="rounded-xl bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground">'
        '              {recommendationText}'
        '            </p>'
        ''
        '            <div className="border-t border-border/60 pt-4">'
        '              <Button asChild className="w-full">'
        '                <Link href={focusActionPath}>'
        '                  {focusCtaLabel}'
        '                </Link>'
        '              </Button>'
        '            </div>'
        '          </div>'
        '        </PageSectionSurface>'
        '      </div>'
        ''
    )

    $Dashboard = Replace-BetweenMarkers `
        -Source $Dashboard `
        -StartMarker '      {/* One trend area + one next-focus area */}' `
        -EndMarker '      {/* History is intentionally last in the reading flow */}' `
        -Replacement $NewInsightArea `
        -Label "Trend and next-focus area"

    # ==================================================
    # 5. ACCOUNT ACCESS COMPACT VARIANT
    # ==================================================

    $Account = Replace-Expected `
        -Source $Account `
        -Old 'export function AccountAccessCard() {' `
        -New 'export function AccountAccessCard({ compact = false }: { compact?: boolean } = {}) {' `
        -Expected 1 `
        -Label "AccountAccessCard compact prop"

    $OldAccountLoadingClass =
        '        className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm"'

    $NewAccountLoadingClass = Join-Lines -Lines @(
        '        className={'
        '          compact'
        '            ? "inline-flex min-h-12 max-w-full items-center rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-sm"'
        '            : "rounded-2xl border border-border/60 bg-card p-4 shadow-sm"'
        '        }'
    )

    $NewAccountLoadingClass =
        $NewAccountLoadingClass.TrimEnd("`n")

    $Account = Replace-Expected `
        -Source $Account `
        -Old $OldAccountLoadingClass `
        -New $NewAccountLoadingClass `
        -Expected 2 `
        -Label "Compact account loading/failure surfaces"

    $ResolvedAccountAnchor = Join-Lines -Lines @(
        '  return ('
        '    <section'
        '      data-testid="account-access-card"'
        '      dir={isRTL ? "rtl" : "ltr"}'
        '      className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"'
        '    >'
    )

    $CompactAccountPrefix = Join-Lines -Lines @(
        '  if (compact) {'
        '    const compactPrimaryLabel ='
        '      isUnlimited'
        '        ? t(statusKey)'
        '        : isPaid'
        '          ? planLabel'
        '          : t(statusKey);'
        ''
        '    return ('
        '      <section'
        '        data-testid="account-access-card"'
        '        aria-label={t("account_access.title")}'
        '        dir={isRTL ? "rtl" : "ltr"}'
        '        className="flex max-w-full flex-wrap items-center gap-3 rounded-2xl border border-border/60 bg-card px-3 py-2 shadow-sm"'
        '      >'
        '        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">'
        '          {isPaid || isUnlimited ? ('
        '            <Crown className="h-4 w-4" aria-hidden />'
        '          ) : ('
        '            <WalletCards className="h-4 w-4" aria-hidden />'
        '          )}'
        '        </span>'
        ''
        '        <div className="min-w-0">'
        '          <p className="text-[11px] font-semibold text-muted-foreground">'
        '            {t("account_access.title")}'
        '          </p>'
        ''
        '          <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">'
        '            <span className="break-words text-sm font-black text-foreground">'
        '              {compactPrimaryLabel}'
        '            </span>'
        ''
        '            {remaining ? ('
        '              <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">'
        '                <Clock3'
        '                  className="h-3.5 w-3.5 text-primary"'
        '                  aria-hidden'
        '                />'
        '                {t("account_access.remaining_value", remaining)}'
        '              </span>'
        '            ) : null}'
        '          </div>'
        '        </div>'
        ''
        '        {!isUnlimited ? ('
        '          <Button'
        '            asChild'
        '            size="sm"'
        '            variant={isPaid ? "outline" : "default"}'
        '          >'
        '            <Link href="/#pricing">'
        '              {t('
        '                isPaid'
        '                  ? "account_access.extend"'
        '                  : isExpired'
        '                    ? "account_access.renew"'
        '                    : "account_access.view_packages",'
        '              )}'
        '            </Link>'
        '          </Button>'
        '        ) : null}'
        '      </section>'
        '    );'
        '  }'
        ''
    )

    $CompactAccountBlock =
        $CompactAccountPrefix +
        $ResolvedAccountAnchor

    $Account = Replace-Expected `
        -Source $Account `
        -Old $ResolvedAccountAnchor `
        -New $CompactAccountBlock `
        -Expected 1 `
        -Label "Compact account resolved state"

    # ==================================================
    # 6. RECENT ACTIVITY
    # ==================================================

    $Recent = Replace-Expected `
        -Source $Recent `
        -Old '    <Card className="rounded-2xl border border-border bg-card shadow-sm">' `
        -New '    <Card className="gap-0 overflow-hidden rounded-2xl border border-border bg-card py-0 shadow-sm">' `
        -Expected 2 `
        -Label "Recent Activity outer cards"

    $Recent = Replace-Expected `
        -Source $Recent `
        -Old '        <CardHeader>' `
        -New '        <CardHeader className="border-b border-border/60 py-5">' `
        -Expected 2 `
        -Label "Recent Activity headers"

    $Recent = Replace-Expected `
        -Source $Recent `
        -Old '          <p className="py-8 text-center text-sm text-muted-foreground">' `
        -New '          <p className="px-5 py-8 text-center text-sm text-muted-foreground">' `
        -Expected 1 `
        -Label "Recent Activity empty padding"

    $OldRecentContent = Join-Lines -Lines @(
        '      <CardContent>'
        '        <div className="space-y-3">'
    )

    $NewRecentContent = Join-Lines -Lines @(
        '      <CardContent className="px-0">'
        '        <div className="divide-y divide-border/60">'
    )

    $Recent = Replace-Expected `
        -Source $Recent `
        -Old $OldRecentContent `
        -New $NewRecentContent `
        -Expected 1 `
        -Label "Recent Activity list container"

    $OldRecentRow =
        '                className="group flex min-w-0 flex-col items-stretch gap-3 rounded-xl border border-border bg-background/60 p-4 text-start transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"'

    $NewRecentRow =
        '                className="group flex min-w-0 flex-col items-stretch gap-3 px-5 py-4 text-start transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"'

    $Recent = Replace-Expected `
        -Source $Recent `
        -Old $OldRecentRow `
        -New $NewRecentRow `
        -Expected 1 `
        -Label "Recent Activity simple rows"

    $Recent = Replace-Expected `
        -Source $Recent `
        -Old '                              ? "text-primary"' `
        -New '                              ? "text-green-600 dark:text-green-400"' `
        -Expected 1 `
        -Label "Recent Activity semantic success color"

    # ==================================================
    # 7. TRANSLATIONS
    # ==================================================

    $ArExamOld = '  "dashboard.action_exam_title": "أدِّ امتحانًا",'
    $ArExamNew = $ArExamOld + "`n" + '  "dashboard.v2_exam_cta": "ابدأ الامتحان المحاكي",'

    $Ar = Replace-Expected `
        -Source $Ar `
        -Old $ArExamOld `
        -New $ArExamNew `
        -Expected 1 `
        -Label "Arabic exam CTA"

    $ArFocusOld = '  "dashboard.action_practice_title": "تدريب",'
    $ArFocusNew = $ArFocusOld + "`n" + '  "dashboard.v2_focus_cta": "تدرّب على نقطة الضعف",'

    $Ar = Replace-Expected `
        -Source $Ar `
        -Old $ArFocusOld `
        -New $ArFocusNew `
        -Expected 1 `
        -Label "Arabic focus CTA"

    $NlExamOld = '  "dashboard.action_exam_title": "Examen Doen",'
    $NlExamNew = $NlExamOld + "`n" + '  "dashboard.v2_exam_cta": "Start het proefexamen",'

    $Nl = Replace-Expected `
        -Source $Nl `
        -Old $NlExamOld `
        -New $NlExamNew `
        -Expected 1 `
        -Label "Dutch exam CTA"

    $NlFocusOld = '  "dashboard.action_practice_title": "Oefenen",'
    $NlFocusNew = $NlFocusOld + "`n" + '  "dashboard.v2_focus_cta": "Oefen je zwakke onderdeel",'

    $Nl = Replace-Expected `
        -Source $Nl `
        -Old $NlFocusOld `
        -New $NlFocusNew `
        -Expected 1 `
        -Label "Dutch focus CTA"

    $FrExamOld = '  "dashboard.action_exam_title": "Passer l''Examen",'
    $FrExamNew = $FrExamOld + "`n" + '  "dashboard.v2_exam_cta": "Commencer l’’examen blanc",'

    $Fr = Replace-Expected `
        -Source $Fr `
        -Old $FrExamOld `
        -New $FrExamNew `
        -Expected 1 `
        -Label "French exam CTA"

    $FrFocusOld = '  "dashboard.action_practice_title": "S''Entraîner",'
    $FrFocusNew = $FrFocusOld + "`n" + '  "dashboard.v2_focus_cta": "Travailler votre point faible",'

    $Fr = Replace-Expected `
        -Source $Fr `
        -Old $FrFocusOld `
        -New $FrFocusNew `
        -Expected 1 `
        -Label "French focus CTA"

    $EnExamOld = '  "dashboard.action_exam_title": "Take Exam",'
    $EnExamNew = $EnExamOld + "`n" + '  "dashboard.v2_exam_cta": "Start mock exam",'

    $En = Replace-Expected `
        -Source $En `
        -Old $EnExamOld `
        -New $EnExamNew `
        -Expected 1 `
        -Label "English exam CTA"

    $EnFocusOld = '  "dashboard.action_practice_title": "Practice",'
    $EnFocusNew = $EnFocusOld + "`n" + '  "dashboard.v2_focus_cta": "Practice weak area",'

    $En = Replace-Expected `
        -Source $En `
        -Old $EnFocusOld `
        -New $EnFocusNew `
        -Expected 1 `
        -Label "English focus CTA"

    # ==================================================
    # 8. DASHBOARD VALIDATION
    # ==================================================

    $DashboardRequired = @(
        '<AccountAccessCard compact />'
        'dashboard.v2_exam_cta'
        'dashboard.v2_focus_cta'
        'dashboard.lessons_completed'
        '.slice(0, 6)'
        '.reverse()'
        'dir="ltr"'
        'const isLatest ='
        'index === recentScores.length - 1'
        'const recommendationText ='
        'const focusCategoryCode ='
        '`/practice/${focusCategoryCode}`'
        '{recommendationText}'
        'const heroInsight ='
        'const focusCtaLabel ='
    )

    foreach ($Required in $DashboardRequired) {
        if (-not $Dashboard.Contains($Required)) {
            throw "STOP: Dashboard Phase 1.1 state missing: $Required"
        }
    }

    $DashboardForbidden = @(
        '<AccountAccessCard />'
        '.slice(-6)'
        'dashboard.stat_lessons_read'
        'xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,0.65fr)]'
    )

    foreach ($Forbidden in $DashboardForbidden) {
        if ($Dashboard.Contains($Forbidden)) {
            throw "STOP: Old Dashboard Phase 1 state remains: $Forbidden"
        }
    }

    # ==================================================
    # 9. ACCOUNT VALIDATION
    # ==================================================

    $AccountRequired = @(
        'compact?: boolean'
        'if (compact)'
        'const compactPrimaryLabel ='
        'account_access.remaining_value'
        'className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm"'
    )

    foreach ($Required in $AccountRequired) {
        if (-not $Account.Contains($Required)) {
            throw "STOP: Account compact state missing: $Required"
        }
    }

    if (
        -not $Account.Contains(
            'className="grid grid-cols-2 gap-px bg-border/60 sm:grid-cols-4"'
        )
    ) {
        throw "STOP: Full AccountAccessCard layout was lost."
    }

    # ==================================================
    # 10. RECENT ACTIVITY VALIDATION
    # ==================================================

    $RecentRequired = @(
        'divide-y divide-border/60'
        'hover:bg-muted/30'
        'text-green-600 dark:text-green-400'
        'data-testid="recent-activity-card"'
        'data-testid="recent-activity-action"'
        'data-testid="recent-activity-score"'
        'data-testid="recent-activity-status"'
    )

    foreach ($Required in $RecentRequired) {
        if (-not $Recent.Contains($Required)) {
            throw "STOP: Recent Activity state missing: $Required"
        }
    }

    if ($Recent.Contains($ExpectedRecentRowClass)) {
        throw "STOP: Old nested Recent Activity card styling remains."
    }

    # ==================================================
    # 11. TRANSLATION / JSON VALIDATION
    # ==================================================

    foreach ($Messages in @($Ar, $Nl, $Fr, $En)) {
        if (-not $Messages.Contains('"dashboard.v2_exam_cta"')) {
            throw "STOP: v2 exam CTA missing from a message file."
        }

        if (-not $Messages.Contains('"dashboard.v2_focus_cta"')) {
            throw "STOP: v2 focus CTA missing from a message file."
        }

        $null = $Messages | ConvertFrom-Json
    }

    # ==================================================
    # 12. TYPE SAFETY BEFORE WRITE
    # ==================================================

    foreach ($Content in @(
        $Dashboard
        $Account
        $Recent
        $Ar
        $Nl
        $Fr
        $En
    )) {
        if ($Content -isnot [string]) {
            throw "STOP: Non-string content detected before write."
        }
    }

    Write-Host ""
    Write-Host "PASS: Phase 1.1 validated in memory." -ForegroundColor Green

    # ==================================================
    # 13. WRITE
    # ==================================================

    Write-Utf8File -Path $DashboardFile -Content $Dashboard
    Write-Utf8File -Path $AccountFile -Content $Account
    Write-Utf8File -Path $RecentFile -Content $Recent
    Write-Utf8File -Path $ArFile -Content $Ar
    Write-Utf8File -Path $NlFile -Content $Nl
    Write-Utf8File -Path $FrFile -Content $Fr
    Write-Utf8File -Path $EnFile -Content $En

    Write-Host "PASS: Phase 1.1 files written." -ForegroundColor Green

    # ==================================================
    # 14. POST-WRITE CHECK
    # ==================================================

    $PostDashboard = Read-Normalized $DashboardFile
    $PostAccount   = Read-Normalized $AccountFile
    $PostRecent    = Read-Normalized $RecentFile

    if (-not $PostDashboard.Contains('<AccountAccessCard compact />')) {
        throw "FAIL: Compact account call missing after write."
    }

    if ($PostDashboard.Contains('.slice(-6)')) {
        throw "FAIL: Old recentScores selection remains after write."
    }

    if (-not $PostDashboard.Contains('.slice(0, 6)')) {
        throw "FAIL: New recentScores selection missing after write."
    }

    if (-not $PostDashboard.Contains('.reverse()')) {
        throw "FAIL: Chronological trend reverse missing after write."
    }

    if (
        -not $PostDashboard.Contains(
            'index === recentScores.length - 1'
        )
    ) {
        throw "FAIL: Latest-score highlight logic missing."
    }

    if (-not $PostAccount.Contains('if (compact)')) {
        throw "FAIL: Compact account variant missing after write."
    }

    if (-not $PostRecent.Contains('divide-y divide-border/60')) {
        throw "FAIL: Recent Activity simple rows missing after write."
    }

    if (
        -not $PostRecent.Contains(
            'text-green-600 dark:text-green-400'
        )
    ) {
        throw "FAIL: Recent Activity success semantic color missing."
    }

    foreach ($MessageFile in @(
        $ArFile
        $NlFile
        $FrFile
        $EnFile
    )) {
        $JsonText = Read-Normalized $MessageFile
        $null = $JsonText | ConvertFrom-Json
    }

    Write-Host "PASS: Phase 1.1 post-write checks." -ForegroundColor Green

    # ==================================================
    # 15. STATUS
    # ==================================================

    $RelativeFiles = @(
        "src/app/(protected)/dashboard/page.tsx"
        "src/components/payment/account-access-card.tsx"
        "src/components/dashboard/recent-activity-list.tsx"
        "src/messages/ar.json"
        "src/messages/nl.json"
        "src/messages/fr.json"
        "src/messages/en.json"
    )

    Write-Host ""
    Write-Host "===== PHASE 1.1 STATUS =====" -ForegroundColor Yellow

    git status --short -- @RelativeFiles

    Write-Host ""
    Write-Host "===== PHASE 1.1 DIFF STAT =====" -ForegroundColor Yellow

    git diff --stat -- @RelativeFiles

    Write-Host ""
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "RIJVIA DASHBOARD V2 PHASE 1.1 MUTATION COMPLETE" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
}
