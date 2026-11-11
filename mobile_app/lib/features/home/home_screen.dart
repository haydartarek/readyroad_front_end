import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../profile/account_menu.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/di/service_locator.dart';
import '../lessons/lesson_service.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';

import '../../design_system/rijvia_tokens.dart';
import '../../design_system/widgets/rijvia_main_header.dart';
import '../../design_system/widgets/rijvia_category_image.dart';
import '../../shared/models/content_item.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../../shared/widgets/language_selector.dart';
import '../../shared/models/category.dart';

import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import '../categories/category_service.dart';

import '../exam/exam_payment_service.dart';

import '../notifications/notification_button.dart';
import 'widgets/rijvia_arc_hero.dart';
import 'widgets/rijvia_lesson_card.dart';

/// Home Screen - the responsive Rijvia learning hub.
///
/// The visual language follows the isolated Material 3 reference while all
/// actions and displayed progress remain backed by the existing app services.
class HomeScreen extends StatefulWidget {
  const HomeScreen({
    super.key,
    this.onShowLessons,
    this.onShowPractice,
    this.initialSection,
  });
  final VoidCallback? onShowLessons;
  final VoidCallback? onShowPractice;
  final String? initialSection;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final CategoryService _categoryService = getIt<CategoryService>();
  List<Category> _categories = const [];
  Map<String, ContentItem> _representativeSigns = const {};
  bool _isLoading = true;
  String? _error;
  List<Map<String, dynamic>> _lessonOverview = const [];
  bool _lessonsLoading = true;
  bool _lessonsFailed = false;
  String? _loadedLanguage;
  int _lessonRevision = 0;
  final _pricingKey = GlobalKey();
  bool _showedInitialSection = false;
  bool _resumeHandled = false;
  String? _busyPlan;
  String? _checkoutError;
  static const _pendingPlanKey = 'rijvia.pendingCheckoutPlan';

  Future<void> _choosePlan(String plan) async {
    if (_busyPlan != null) return;
    final auth = context.read<AuthBloc>().state;
    if (auth is! Authenticated) {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(_pendingPlanKey, plan);
      if (mounted) {
        Navigator.pushNamed(
          context,
          '/login?returnUrl=${Uri.encodeComponent('/?resumeCheckout=1#pricing')}',
        );
      }
      return;
    }
    setState(() {
      _busyPlan = plan;
      _checkoutError = null;
    });
    try {
      final uri = await getIt<ExamPaymentService>().checkout(
        plan,
        0,
        context.read<LanguageProvider>().currentLanguage,
      );
      if (!await launchUrl(
        uri,
        mode: LaunchMode.externalApplication,
        webOnlyWindowName: '_self',
      )) {
        throw StateError('Checkout did not open');
      }
    } catch (e) {
      if (mounted) {
        setState(
          () => _checkoutError =
              e is DioException && [409, 410].contains(e.response?.statusCode)
              ? 'payment.expired'
              : 'payment.checkout_error',
        );
      }
    } finally {
      if (mounted) setState(() => _busyPlan = null);
    }
  }

  Future<void> _resumePlan() async {
    final preferences = await SharedPreferences.getInstance();
    final plan = preferences.getString(_pendingPlanKey);
    await preferences.remove(_pendingPlanKey);
    if (mounted && ExamPaymentService.plans.contains(plan)) {
      await _choosePlan(plan!);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadLessons();
  }

  Future<void> _loadLessons() async {
    final language = context.read<LanguageProvider>().currentLanguage;
    _loadedLanguage = language;
    final revision = ++_lessonRevision;
    setState(() {
      _lessonsLoading = true;
      _lessonsFailed = false;
    });
    try {
      final lessons = await getIt<LessonService>().getHomeOverview(language);
      if (!mounted || revision != _lessonRevision) return;
      setState(() {
        _lessonOverview = lessons;
        _lessonsLoading = false;
      });
    } catch (_) {
      if (mounted && revision == _lessonRevision) {
        setState(() {
          _lessonsLoading = false;
          _lessonsFailed = true;
        });
      }
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.watch<AuthBloc>().state;
    final route = Uri.tryParse(ModalRoute.of(context)?.settings.name ?? '/');
    if (!_resumeHandled &&
        route?.queryParameters['resumeCheckout'] == '1' &&
        auth is Authenticated) {
      _resumeHandled = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _resumePlan();
      });
    }
    if (_loadedLanguage != context.watch<LanguageProvider>().currentLanguage) {
      _loadLessons();
    }
  }

  Future<void> _loadCategories() async {
    if (mounted) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final representativesFuture = _categoryService
          .getRepresentativeSigns()
          .catchError((_) => <String, ContentItem>{});
      final categories = await _categoryService.getAllCategories();
      final representatives = await representativesFuture;
      if (!mounted) return;
      setState(() {
        _categories = categories;
        _representativeSigns = representatives;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (!_showedInitialSection &&
        widget.initialSection == 'pricing' &&
        !_isLoading &&
        !_lessonsLoading) {
      _showedInitialSection = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final target = _pricingKey.currentContext;
        if (target != null) Scrollable.ensureVisible(target);
      });
    }

    final compactHero = MediaQuery.sizeOf(context).width < 900;

    return Scaffold(
      appBar: compactHero
          ? null
          : const RijviaMainHeader(
              account: RijviaAccountMenu(),
              notifications: NotificationButton(),
            ),
      body: _buildBody(context, l10n),
    );
  }

  Widget _buildBody(BuildContext context, AppLocalizations l10n) {
    final width = MediaQuery.sizeOf(context).width;
    final compact = width < 900;

    final horizontalPadding = width >= 900
        ? RijviaDesignSpace.xl
        : RijviaDesignSpace.md;

    return RefreshIndicator(
      onRefresh: () async {
        await Future.wait([_loadCategories(), _loadLessons()]);
      },
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: RijviaDesignLayout.maxContentWidth,
          ),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (compact) _buildArcHero(context, l10n),

                Padding(
                  padding: EdgeInsets.fromLTRB(
                    horizontalPadding,
                    compact ? 0 : RijviaDesignSpace.md,
                    horizontalPadding,
                    RijviaDesignSpace.xl,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (!compact) ...[
                        _buildHero(context, l10n),
                        const SizedBox(
                          height: RijviaDesignSpace.xl,
                        ),
                      ] else
                        const SizedBox.shrink(),

                      _buildLessonPreview(context, l10n),

                      const SizedBox(height: 56),

                      _buildWebFeatures(context, l10n),

                      const SizedBox(height: 56),

                      _buildCategorySection(context, l10n),

                      const SizedBox(
                        height: RijviaDesignSpace.xl,
                      ),

                      KeyedSubtree(
                        key: _pricingKey,
                        child: _buildPlansSection(context, l10n),
                      ),

                      const SizedBox(height: 56),

                      _buildWebExamCta(context, l10n),

                      const SizedBox(height: 48),

                      const RijviaWebFooter(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildArcHero(BuildContext context, AppLocalizations l10n) {
    final signedIn =
        context.watch<AuthBloc>().state is Authenticated;

    final headline = l10n
        .t('home.hero.headline')
        .replaceFirst(
          RegExp(
            r'^RijVia\s*\|\s*',
            caseSensitive: false,
          ),
          '',
        );

    return RijviaArcHero(
      account: const RijviaAccountMenu(),
      language: const LanguageSelector(),
      notifications: signedIn
          ? const NotificationButton()
          : IconButton(
              tooltip: l10n.t('auth.login'),
              onPressed: () => Navigator.pushNamed(
                context,
                '/login',
              ),
              icon: const Icon(
                Icons.notifications_none_rounded,
              ),
            ),
      headline: headline,
      headlineHighlight:
          l10n.t('home.hero.headline_highlight'),
      subtitle: '',
      ctaLabel: l10n.t(
        signedIn
            ? 'home.hero.cta_secondary'
            : 'home.hero.cta_guest_secondary',
      ),
      onCta: () => Navigator.pushNamed(
        context,
        '/exam',
      ),
    );
  }
  Widget _buildHero(BuildContext context, AppLocalizations l10n) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final compact = MediaQuery.sizeOf(context).width < 900;
    final signedIn = context.watch<AuthBloc>().state is Authenticated;

    final headline = l10n.t('home.hero.headline').replaceFirst(
      RegExp(r'^RijVia\s*\|\s*', caseSensitive: false),
      '',
    );

    final ctaLabel = l10n.t(
      signedIn
          ? 'home.hero.cta_secondary'
          : 'home.hero.cta_guest_secondary',
    );

    Widget circleControl(Widget child) {
      return Container(
        width: 50,
        height: 50,
        decoration: BoxDecoration(
          color: colors.surface,
          shape: BoxShape.circle,
          border: Border.all(
            color: colors.onPrimary.withValues(alpha: .22),
          ),
        ),
        child: IconTheme(
          data: IconThemeData(color: colors.onSurface, size: 22),
          child: Center(child: child),
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final extraScale = (
          MediaQuery.textScalerOf(context).scale(1.0) - 1.0
        ).clamp(0.0, 2.0).toDouble();

        final arcHeight = (compact ? 356.0 : 400.0) + extraScale * 210.0;

        return Stack(
          clipBehavior: Clip.none,
          children: [
            ClipPath(
              clipper: const _RijviaHomeArcClipper(),
              child: SizedBox(
                width: double.infinity,
                height: arcHeight,
                child: ColoredBox(color: colors.primary),
              ),
            ),
            SizedBox(
              height: arcHeight,
              width: double.infinity,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 55),
                child: Column(
                  children: [
                    if (compact) ...[
                      Directionality(
                        textDirection: TextDirection.rtl,
                        child: Row(
                          children: [
                            circleControl(const RijviaAccountMenu()),
                            const Spacer(),
                            circleControl(const LanguageSelector()),
                            const SizedBox(width: 8),
                            circleControl(
                              signedIn
                                  ? const NotificationButton()
                                  : IconButton(
                                      tooltip: l10n.t('auth.login'),
                                      onPressed: () =>
                                          Navigator.pushNamed(
                                            context,
                                            '/login',
                                          ),
                                      icon: const Icon(
                                        Icons.notifications_none_rounded,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ] else
                      const SizedBox(height: 30),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 7,
                      ),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Image.asset(
                        'assets/branding/rijvia-wordmark.png',
                        width: compact ? 118 : 152,
                        height: compact ? 36 : 46,
                        fit: BoxFit.contain,
                      ),
                    ),
                    const SizedBox(height: 19),
                    Flexible(
                      child: Center(
                        child: Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(text: '$headline '),
                              TextSpan(
                                text: l10n.t('home.hero.headline_highlight'),
                                style: const TextStyle(
                                  color: Color(0xFFFFE3D8),
                                ),
                              ),
                            ],
                          ),
                          textAlign: TextAlign.center,
                          softWrap: true,
                          style: theme.textTheme.headlineMedium?.copyWith(
                            color: colors.onPrimary,
                            fontSize: compact ? 28 : 44,
                            fontWeight: FontWeight.w900,
                            height: 1.2,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                12,
                arcHeight - 37,
                12,
                0,
              ),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 660),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: colors.surface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: colors.outlineVariant),
                      boxShadow: [
                        BoxShadow(
                          color: colors.shadow.withValues(alpha: .12),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodyLarge?.copyWith(
                            color: colors.onSurfaceVariant,
                            height: 1.8,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () =>
                                Navigator.pushNamed(context, '/exam'),
                            icon: const Icon(Icons.play_arrow_rounded),
                            label: Text(
                              ctaLabel,
                              textAlign: TextAlign.center,
                            ),
                            style: FilledButton.styleFrom(
                              minimumSize: const Size.fromHeight(54),
                              backgroundColor: colors.primary,
                              foregroundColor: colors.onPrimary,
                              textStyle: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
  Widget _buildLessonPreview(
    BuildContext context,
    AppLocalizations l10n,
  ) {
    final language =
        context.watch<LanguageProvider>().currentLanguage;

    String localized(Map item, String field) =>
        (item[
                    field +
                        language[0].toUpperCase() +
                        language.substring(1)
                  ] ??
                item['${field}En'] ??
                '')
            .toString();

    String? categoryKey(Map<String, dynamic> lesson) {
      final categories = lesson['categories'];

      if (categories is! List || categories.isEmpty) {
        return null;
      }

      final first = categories.first;

      if (first is! Map) {
        return null;
      }

      return first['categoryCode']?.toString();
    }

    String viewAllLabel() {
      return switch (language) {
        'ar' => 'عرض كل الدروس',
        'nl' => 'Alle lessen bekijken',
        'fr' => 'Voir toutes les leçons',
        _ => 'View all lessons',
      };
    }

    String lessonCountLabel(int count) {
      return switch (language) {
        'ar' => '$count درسا',
        'nl' => '$count lessen',
        'fr' => '$count leçons',
        _ => '$count lessons',
      };
    }

    void openAllLessons() {
      if (widget.onShowLessons != null) {
        widget.onShowLessons!();
        return;
      }

      Navigator.pushNamed(
        context,
        '/lessons',
      );
    }

    return Column(
      crossAxisAlignment:
          CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.t('lessons.page_title'),
          style: Theme.of(context)
              .textTheme
              .headlineSmall
              ?.copyWith(
                fontWeight: FontWeight.w900,
              ),
        ),

        const SizedBox(height: 6),
        const SizedBox(height: 14),

        if (_lessonsLoading)
          const Center(
            child: Padding(
              padding: EdgeInsets.all(24),
              child: CircularProgressIndicator(),
            ),
          )
        else if (_lessonsFailed)
          Center(
            child: OutlinedButton(
              onPressed: _loadLessons,
              child: Text(l10n.commonRetry),
            ),
          )
        else if (_lessonOverview.isEmpty)
          Text(l10n.t('lessons.content'))
        else ...[
          RijviaLessonGrid(
            lessons: [
              for (
                var i = 0;
                i < _lessonOverview.take(4).length;
                i++
              )
                RijviaLessonCardData(
                  number:
                      (i + 1).toString().padLeft(2, '0'),
                  colorIndex: i,
                  title: localized(
                    _lessonOverview[i],
                    'title',
                  ),
                  categoryKey:
                      categoryKey(_lessonOverview[i]),
                  readLabel:
                      l10n.t('lessons.read_lesson'),
                  onRead: () {
                    final lessonCode =
                        _lessonOverview[i]['lessonCode']
                            .toString();

                    Navigator.pushNamed(
                      context,
                      '/lessons/$lessonCode',
                    );
                  },
                ),
            ],
          ),

          const SizedBox(height: 12),

          RijviaViewAllCard(
            title: viewAllLabel(),
            countLabel: lessonCountLabel(
              _lessonOverview.length,
            ),
            onTap: openAllLessons,
          ),
        ],
      ],
    );
  }
  Widget _buildWebFeatures(BuildContext context, AppLocalizations t) {
    final colors = Theme.of(context).colorScheme;
    final items = [
      ('exam', '/exam', Icons.description_outlined),
      ('practice', '/practice', Icons.track_changes_outlined),
      ('analytics', '/dashboard', Icons.bar_chart_outlined),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          t.t('home.features.title'),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: colors.secondary,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          t.t('home.features.subtitle'),
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 16,
            height: 1.8,
            color: colors.onSurfaceVariant,
          ),
        ),
        const SizedBox(height: 32),
        RijviaAdaptiveGrid(
          minCellWidth: 280,
          maxColumns: 3,
          children: [
            for (final item in items)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(
                        item.$3,
                        size: 32,
                        color: item.$1 == 'practice'
                            ? colors.secondary
                            : colors.primary,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        t.t('home.features.${item.$1}_title'),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: colors.secondary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        t.t('home.features.${item.$1}_desc', {
                          'questions': 50,
                          'duration': t.t('exam.duration_value', {
                            'minutes': 12,
                            'seconds': 30,
                          }),
                        }),
                        style: TextStyle(
                          fontSize: 16,
                          height: 1.75,
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: () => Navigator.pushNamed(context, item.$2),
                        child: Text(t.t('home.features.cta_${item.$1}')),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildWebExamCta(BuildContext context, AppLocalizations t) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 48),
      decoration: BoxDecoration(
        color: colors.secondary,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Text(
            t.t('home.quiz_cta.title'),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: colors.onSecondary,
              fontSize: 30,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            t.t('home.quiz_cta.subtitle'),
            textAlign: TextAlign.center,
            style: TextStyle(
              color: colors.onSecondary.withValues(alpha: .75),
              fontSize: 16,
              height: 1.8,
            ),
          ),
          const SizedBox(height: 32),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(
                onPressed: () => Navigator.pushNamed(context, '/practice'),
                child: Text(t.t('home.quiz_cta.start_quiz')),
              ),
              OutlinedButton(
                onPressed: () => Navigator.pushNamed(context, '/exam'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: colors.onSecondary,
                ),
                child: Text(t.t('home.quiz_cta.take_exam')),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySection(BuildContext context, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        RijviaSectionHeading(
          title: l10n.t('home.categories.title'),
          trailing: TextButton(
            onPressed:
                widget.onShowPractice ??
                () => Navigator.pushNamed(context, '/practice'),
            child: Text(l10n.t('home.categories.view_all')),
          ),
          subtitle: l10n.t('home.categories.subtitle'),
        ),
        if (_isLoading)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: RijviaDesignSpace.xl),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_error != null)
          RijviaEmptyState(
            icon: Icons.cloud_off_outlined,
            title: l10n.t('home.topics_unavailable'),
            description: l10n.t('home.topics_unavailable_description'),
            action: OutlinedButton.icon(
              onPressed: _loadCategories,
              icon: const Icon(Icons.refresh),
              label: Text(l10n.t('common.retry')),
            ),
          )
        else if (_categories.isEmpty)
          RijviaEmptyState(
            icon: Icons.menu_book_outlined,
            title: l10n.t('home.no_topics'),
            description: l10n.t('home.no_topics_description'),
          )
        else
          _buildCategoryGrid(context),
      ],
    );
  }

  String? _optionalPricingText(AppLocalizations l10n, String key) {
    final value = l10n.t(key);
    return value.trim().isEmpty || value == key ? null : value;
  }

  Widget _buildPlansSection(BuildContext context, AppLocalizations l10n) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;

    final features = <String>[
      for (final key in const [
        'home.pricing.feature_questions',
        'home.pricing.feature_exam',
        'home.pricing.feature_explanations',
        'home.pricing.feature_progress',
        'home.pricing.feature_languages',
      ])
        if (_optionalPricingText(l10n, key) case final String value) value,
    ];

    final secure = _optionalPricingText(l10n, 'home.pricing.secure');
    final note = _optionalPricingText(l10n, 'home.pricing.extension_note');

    Widget trustBadge(IconData icon, String label) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
        decoration: BoxDecoration(
          color: colors.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: colors.outlineVariant),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: colors.primary),
            const SizedBox(width: 7),
            Flexible(
              child: Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final wide = constraints.maxWidth >= 1020;
        final plans = <String>[...ExamPaymentService.plans];

        if (!wide) {
          plans.remove(ExamPaymentService.defaultPlan);
          plans.insert(0, ExamPaymentService.defaultPlan);
        }

        return Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(
            horizontal: RijviaDesignSpace.sm,
            vertical: RijviaDesignSpace.xl,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                colors.surface,
                Color.alphaBlend(colors.primary.withAlpha(12), colors.surface),
                colors.surface,
              ],
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                _optionalPricingText(l10n, 'home.pricing.title') ??
                    l10n.t('plans.title'),
                textAlign: TextAlign.center,
                style: theme.textTheme.headlineMedium?.copyWith(
                  color: colors.secondary,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: RijviaDesignSpace.sm),
              Text(
                _optionalPricingText(l10n, 'home.pricing.subtitle') ??
                    l10n.t('story.plans_subtitle'),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: colors.onSurfaceVariant,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: RijviaDesignSpace.md),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: [
                  trustBadge(
                    Icons.payments_outlined,
                    l10n.t('home.pricing.one_time'),
                  ),
                  trustBadge(
                    Icons.event_busy_outlined,
                    l10n.t('home.pricing.no_renewal'),
                  ),
                  if (secure != null)
                    trustBadge(Icons.verified_user_outlined, secure),
                ],
              ),
              const SizedBox(height: RijviaDesignSpace.lg),
              if (!wide && features.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(RijviaDesignSpace.md),
                  decoration: BoxDecoration(
                    color: colors.surfaceContainerLow,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: colors.outlineVariant),
                  ),
                  child: Column(
                    children: [
                      for (final feature in features)
                        _homePricingFeature(context, feature),
                    ],
                  ),
                ),
                const SizedBox(height: RijviaDesignSpace.lg),
              ],
              RijviaAdaptiveGrid(
                minCellWidth: MediaQuery.textScalerOf(context).scale(280),
                maxCellWidth: MediaQuery.textScalerOf(
                  context,
                ).scale(RijviaDesignLayout.maxCardWidth),
                maxColumns: 3,
                children: [
                  for (final plan in plans)
                    _homePricingCard(
                      context,
                      l10n,
                      plan,
                      wide ? features : const <String>[],
                    ),
                ],
              ),
              if (note != null) ...[
                const SizedBox(height: RijviaDesignSpace.lg),
                Text(
                  note,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colors.onSurfaceVariant,
                    height: 1.5,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _homePricingFeature(
    BuildContext context,
    String text, {
    Color? foreground,
  }) {
    final colors = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.check_circle_rounded, size: 18, color: colors.primary),
          const SizedBox(width: 9),
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: foreground,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _homePricingCard(
    BuildContext context,
    AppLocalizations l10n,
    String plan,
    List<String> features,
  ) {
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    final featured = plan == ExamPaymentService.defaultPlan;
    final foreground = featured ? colors.onSecondary : colors.onSurface;

    final glyph = switch (plan) {
      'RIJVIA_3_DAYS' => Icons.bolt_rounded,
      'RIJVIA_1_WEEK' => Icons.event_available_rounded,
      _ => Icons.emoji_events_outlined,
    };

    final perDay = _optionalPricingText(l10n, 'home.pricing.per_day.$plan');
    final tagline = _optionalPricingText(l10n, 'home.pricing.tagline.$plan');
    final recommended = _optionalPricingText(l10n, 'home.pricing.recommended');
    final choose =
        _optionalPricingText(l10n, 'home.pricing.choose') ??
        l10n.t('plans.checkout');

    return Padding(
      padding: const EdgeInsets.only(top: 17),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            key: ValueKey('home-pricing-$plan'),
            width: double.infinity,
            padding: const EdgeInsets.fromLTRB(17, 27, 17, 18),
            decoration: BoxDecoration(
              color: featured ? colors.secondary : colors.surface,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(
                color: featured ? colors.primary : colors.outlineVariant,
                width: featured ? 2 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: featured
                      ? colors.secondary.withAlpha(43)
                      : colors.shadow.withAlpha(15),
                  blurRadius: featured ? 22 : 9,
                  offset: Offset(0, featured ? 8 : 3),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 35,
                      height: 35,
                      decoration: BoxDecoration(
                        color: featured
                            ? colors.primary
                            : colors.primary.withAlpha(22),
                        borderRadius: BorderRadius.circular(11),
                      ),
                      child: Icon(
                        glyph,
                        size: 20,
                        color: featured ? colors.onPrimary : colors.primary,
                      ),
                    ),
                    const SizedBox(width: 9),
                    Flexible(
                      child: Text(
                        _planPreviewLabel(l10n, plan),
                        textAlign: TextAlign.center,
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: foreground,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: RijviaDesignSpace.md),
                Directionality(
                  textDirection: TextDirection.ltr,
                  child: Text(
                    ExamPaymentService.prices[plan] ?? '',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.headlineLarge?.copyWith(
                      color: featured ? foreground : colors.secondary,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
                if (perDay != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    perDay,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: featured
                          ? foreground.withAlpha(215)
                          : colors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
                if (tagline != null) ...[
                  const SizedBox(height: RijviaDesignSpace.sm),
                  Text(
                    tagline,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: foreground,
                      fontWeight: FontWeight.w700,
                      height: 1.45,
                    ),
                  ),
                ],
                if (features.isNotEmpty) ...[
                  const SizedBox(height: RijviaDesignSpace.lg),
                  Divider(
                    color: featured
                        ? foreground.withAlpha(35)
                        : colors.outlineVariant,
                  ),
                  for (final feature in features)
                    _homePricingFeature(
                      context,
                      feature,
                      foreground: foreground,
                    ),
                ],
                const SizedBox(height: RijviaDesignSpace.lg),
                if (_checkoutError != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Text(
                      l10n.t(_checkoutError!),
                      style: TextStyle(color: colors.error),
                    ),
                  ),
                FilledButton(
                  onPressed: _busyPlan != null ? null : () => _choosePlan(plan),
                  style: FilledButton.styleFrom(
                    backgroundColor: featured
                        ? colors.primary
                        : colors.secondary,
                    foregroundColor: featured
                        ? colors.onPrimary
                        : colors.onSecondary,
                    minimumSize: const Size.fromHeight(48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Flexible(
                        child: Text(
                          _busyPlan == plan ? l10n.t("common.loading") : choose,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                      ),
                      const SizedBox(width: 7),
                      Icon(
                        Directionality.of(context) == TextDirection.rtl
                            ? Icons.arrow_back
                            : Icons.arrow_forward,
                        size: 17,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (featured && recommended != null)
            Positioned(
              top: -13,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: colors.primary,
                    borderRadius: BorderRadius.circular(50),
                    border: Border.all(color: colors.surface, width: 2),
                  ),
                  child: Text(
                    recommended,
                    textAlign: TextAlign.center,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: colors.onPrimary,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _planPreviewLabel(AppLocalizations l10n, String plan) {
    return switch (plan) {
      'RIJVIA_3_DAYS' => l10n.t('plans.three_days'),
      'RIJVIA_1_WEEK' => l10n.t('plans.one_week'),
      'RIJVIA_4_WEEKS' => l10n.t('plans.four_weeks'),
      _ => plan,
    };
  }

  Widget _buildCategoryGrid(BuildContext context) {
    final language = context.watch<LanguageProvider>().currentLanguage;
    final t = AppLocalizations.of(context);
    final colors = Theme.of(context).colorScheme;
    return RijviaAdaptiveGrid(
      minCellWidth: 300,
      maxColumns: 3,
      children: [
        for (final category in _categories.take(6))
          Card(
            child: InkWell(
              onTap: () => Navigator.pushNamed(
                context,
                '/practice/${category.code ?? category.id.toString()}',
              ),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 144),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      SizedBox.square(
                        dimension: 80,
                        child: RijviaCategoryImage(
                          sign: _representativeSigns[category.code],
                          label: category.getName(language),
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              category.getName(language),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                height: 1.5,
                              ),
                            ),
                            if (category.signCount != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                '${category.signCount} ${t.t('story.signs_count')}',
                                style: TextStyle(
                                  color: colors.onSurfaceVariant,
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            Text(
                              t.t('home.categories.start_practice'),
                              style: TextStyle(
                                color: colors.primary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class _RijviaHomeArcClipper extends CustomClipper<Path> {
  const _RijviaHomeArcClipper();

  @override
  Path getClip(Size size) {
    return Path()
      ..moveTo(0, 0)
      ..lineTo(size.width, 0)
      ..lineTo(size.width, 82)
      ..quadraticBezierTo(
        size.width / 2,
        size.height * 2 - 82,
        0,
        82,
      )
      ..close();
  }

  @override
  bool shouldReclip(covariant _RijviaHomeArcClipper oldClipper) => false;
}
