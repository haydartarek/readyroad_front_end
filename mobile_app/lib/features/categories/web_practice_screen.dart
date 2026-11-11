import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_category_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../../shared/models/content_item.dart';
import '../../shared/services/content_service.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import 'sign_quiz_screen.dart';
import 'sign_quiz_service.dart';
import 'traffic_signs_screen.dart';
import 'web_sign_groups.dart';

class WebPracticeScreen extends StatefulWidget {
  const WebPracticeScreen({super.key, this.category});
  final String? category;
  @override
  State<WebPracticeScreen> createState() => _WebPracticeScreenState();
}

class _WebPracticeScreenState extends State<WebPracticeScreen> {
  List<ContentItem>? _signs;
  Map<String, SignPracticeProgress>? _progress;
  bool _failed = false;
  bool _progressFailed = false;
  String? _userId;
  int _revision = 0;
  @override
  void initState() {
    super.initState();
    _loadSigns();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final state = context.watch<AuthBloc>().state;
    final id = state is Authenticated ? state.user.id : null;
    if (id != _userId) {
      _userId = id;
      _loadProgress();
    }
  }

  Future<void> _loadSigns() async {
    setState(() {
      _failed = false;
      _signs = null;
    });
    try {
      final signs = await getIt<ContentService>().getAllContent();
      signs.sort(compareSignCodes);
      if (mounted) setState(() => _signs = signs);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  Future<void> _loadProgress() async {
    final revision = ++_revision;
    setState(() {
      _progress = null;
      _progressFailed = false;
    });
    if (_userId == null) return;
    try {
      final progress = await getIt<SignQuizService>().getAllProgress();
      if (mounted && revision == _revision) {
        setState(
          () => _progress = {
            for (final sign in progress)
              (sign.routeCode.isEmpty ? sign.signCode : sign.routeCode): sign,
          },
        );
      }
    } catch (_) {
      if (mounted && revision == _revision) {
        setState(() => _progressFailed = true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final category = widget.category?.toUpperCase();
    final signs = (_signs ?? [])
        .where((s) => category == null || s.categoryCode == category)
        .toList();
    void go(String route) => Navigator.pushNamed(context, route);
    final categories = webSignGroupOrder
        .where((group) => signs.any((s) => s.categoryCode == group))
        .toList();
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1280),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RijviaPageHero(
                    title: category == null
                        ? t.t('practice.title')
                        : signGroupText(category, 'title', language),
                    description: category == null
                        ? t.t('practice.hub.subtitle')
                        : signGroupText(category, 'description', language),
                  ),
                  const SizedBox(height: 24),
                  if (category == null)
                    RijviaPageSection(
                      title: t.t('nav.traffic_signs'),
                      description: t.t('practice.hub.all_signs_desc'),
                      child: Wrap(
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          FilledButton.icon(
                            onPressed: () => go('/traffic-signs'),
                            icon: const Icon(Icons.menu_book_outlined),
                            label: Text(t.t('practice.hub.browse_all')),
                          ),
                          OutlinedButton.icon(
                            onPressed: () => go('/practice/random'),
                            icon: const Icon(Icons.shuffle),
                            label: Text(t.t('practice.start_random')),
                          ),
                        ],
                      ),
                    )
                  else
                    TextButton.icon(
                      onPressed: () => go('/practice'),
                      icon: const Icon(Icons.arrow_back),
                      label: Text(t.t('practice.signs.none_back')),
                    ),
                  const SizedBox(height: 24),
                  if (_progressFailed)
                    Wrap(
                      spacing: 8,
                      children: [
                        Text(t.t('common.load_error')),
                        TextButton(
                          onPressed: _loadProgress,
                          child: Text(t.t('common.retry')),
                        ),
                      ],
                    ),
                  if (_failed)
                    Column(
                      children: [
                        Text(t.t('practice.load_error')),
                        TextButton(
                          onPressed: _loadSigns,
                          child: Text(t.t('common.retry')),
                        ),
                      ],
                    )
                  else if (_signs == null)
                    const Center(child: CircularProgressIndicator())
                  else if (signs.isEmpty)
                    Text(t.t('practice.signs.none'))
                  else
                    LayoutBuilder(
                      builder: (context, box) {
                        final columns = box.maxWidth >= 1150
                            ? 3
                            : box.maxWidth >= 740
                            ? 2
                            : 1;
                        final width =
                            (box.maxWidth - 16 * (columns - 1)) / columns;
                        return Wrap(
                          spacing: 16,
                          runSpacing: 16,
                          children: category == null
                              ? [
                                  for (final group in categories)
                                    SizedBox(
                                      width: width,
                                      child: _categoryCard(
                                        t,
                                        language,
                                        group,
                                        signs
                                            .where(
                                              (s) => s.categoryCode == group,
                                            )
                                            .toList(),
                                      ),
                                    ),
                                ]
                              : [
                                  for (final sign in signs)
                                    SizedBox(
                                      width: width,
                                      child: _signCard(t, language, sign),
                                    ),
                                ],
                        );
                      },
                    ),
                  const SizedBox(height: 32),
                  const RijviaWebFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _categoryCard(
    AppLocalizations t,
    String language,
    String group,
    List<ContentItem> signs,
  ) {
    final completed = _progress == null
        ? null
        : signs
              .where((s) => _progress![s.routeCode]?.practiceCompleted == true)
              .length;
    final passed = _progress == null
        ? null
        : signs
              .where((s) => _progress![s.routeCode]?.exam1Passed == true)
              .length;
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: RijviaSignImage(
                url: signs.first.imageUrl,
                label: signGroupText(group, 'title', language),
                size: 80,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              signGroupText(group, 'title', language),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(
              t.t('practice.signs.count', {'count': signs.length}),
              textAlign: TextAlign.center,
            ),
            if (_userId != null) ...[
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _stat(
                      t.t('practice.hub.completed'),
                      completed?.toString() ?? '—',
                      Colors.green,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _stat(
                      t.t('practice.hub.passed_signs'),
                      passed?.toString() ?? '—',
                      Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () => Navigator.pushNamed(context, '/practice/$group'),
              child: Text(t.t('practice.signs.choose')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _stat(String label, String value, Color color) => Container(
    constraints: const BoxConstraints(minHeight: 88),
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: color.withValues(alpha: .07),
      border: Border.all(color: color.withValues(alpha: .2)),
      borderRadius: BorderRadius.circular(16),
    ),
    child: Column(
      children: [
        Text(label, textAlign: TextAlign.center),
        Text(
          value,
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    ),
  );
  Widget _signCard(AppLocalizations t, String language, ContentItem sign) {
    final progress = _progress?[sign.routeCode];
    final route = '/traffic-signs/${Uri.encodeComponent(sign.routeCode)}';
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (progress?.exam1Passed == true)
              Chip(label: Text(t.t('sign_quiz.passed_badge'))),
            if (progress?.practiceCompleted == true)
              Chip(label: Text(t.t('practice.hub.completed'))),
            Center(
              child: RijviaSignImage(
                url: sign.imageUrl,
                label: signName(sign, language),
                size: 144,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              signName(sign, language),
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(sign.getDescription(language) ?? ''),
            const SizedBox(height: 12),
            Text(t.t('practice.signs.card_meta')),
            if (progress?.practiceBestScorePct != null)
              Text(
                t.t('practice.signs.best_score', {
                  'score': progress!.practiceBestScorePct!.round(),
                }),
              ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.pushNamed(context, '$route/practice'),
              child: Text(t.t('practice.signs.practice_btn')),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, '$route/exam/1'),
              child: Text(t.t('practice.signs.exam')),
            ),
          ],
        ),
      ),
    );
  }
}

class RandomPracticeEntryScreen extends StatefulWidget {
  const RandomPracticeEntryScreen({super.key});
  @override
  State<RandomPracticeEntryScreen> createState() =>
      _RandomPracticeEntryScreenState();
}

class _RandomPracticeEntryScreenState extends State<RandomPracticeEntryScreen> {
  bool _started = false;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    if (_started) return const RandomSignPracticeScreen();
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 1000),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                RijviaPageHero(
                  title: t.t('sign_practice.intro_title'),
                  description: t.t('sign_practice.intro_subtitle'),
                ),
                const SizedBox(height: 24),
                Wrap(
                  spacing: 16,
                  runSpacing: 16,
                  children: [
                    for (final item in [
                      ('50', 'sign_practice.stat_questions'),
                      ('15s', 'sign_practice.stat_time'),
                      ('41/50', 'sign_practice.stat_pass'),
                    ])
                      SizedBox(
                        width: 210,
                        child: RijviaPageSection(
                          title: item.$1,
                          child: Text(t.t(item.$2)),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: () {
                    if (context.read<AuthBloc>().state is! Authenticated) {
                      Navigator.pushNamed(
                        context,
                        '/login?returnUrl=%2Fpractice%2Frandom',
                      );
                      return;
                    }
                    setState(() => _started = true);
                  },
                  child: Text(t.t('practice_exam.start_btn')),
                ),
                const SizedBox(height: 24),
                RijviaPageSection(
                  title: t.t('practice_exam.rules_title'),
                  description: t.t('practice_exam.rules_desc'),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(t.t('practice_exam.rule_choices')),
                      const SizedBox(height: 12),
                      Text(t.t('sign_practice.rule_freshness')),
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
}
