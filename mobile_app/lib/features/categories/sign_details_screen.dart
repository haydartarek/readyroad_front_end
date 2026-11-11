import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:provider/provider.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/favorites_provider.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../../shared/models/content_item.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import 'traffic_signs_screen.dart';
import 'sign_quiz_service.dart';
import '../../core/di/service_locator.dart';

/// Published sign content uses the same localized fields and sections as web.
class SignDetailsScreen extends StatefulWidget {
  const SignDetailsScreen({super.key, required this.content});
  final ContentItem content;
  @override
  State<SignDetailsScreen> createState() => _SignDetailsScreenState();
}

class _SignDetailsScreenState extends State<SignDetailsScreen> {
  ContentItem get content => widget.content;
  SignUserProgress? progress;
  String? owner;
  bool progressLoading = false;
  int revision = 0;
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final auth = context.watch<AuthBloc>().state;
    final nextOwner = auth is Authenticated ? auth.user.id : null;
    if (owner != nextOwner) {
      owner = nextOwner;
      progress = null;
      final request = ++revision;
      progressLoading = nextOwner != null;
      if (nextOwner != null) {
        getIt<SignQuizService>()
            .getSignStatus(content.routeCode)
            .then((value) {
              if (mounted && request == revision) {
                setState(() {
                  progress = value;
                  progressLoading = false;
                });
              }
            })
            .catchError((Object _) {
              if (mounted && request == revision) {
                setState(() => progressLoading = false);
              }
            });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final colors = Theme.of(context).colorScheme;
    final name = signName(content, language);
    final suffix = language[0].toUpperCase() + language.substring(1);
    final exceptions = content.details['exceptions$suffix'];
    final authenticated = context.watch<AuthBloc>().state is Authenticated;
    final favorites = context.watch<FavoritesProvider>();
    final count =
        int.tryParse(
          content.details['exam1TotalQuestions']?.toString() ?? '',
        ) ??
        progress?.exam1TotalQuestions;
    final passScore =
        int.tryParse(content.details['exam1PassingScore']?.toString() ?? '') ??
        progress?.exam1PassingScore;
    final examStatus = progress?.exam1Attempted != true
        ? 'ready'
        : progress!.exam1Passed
        ? 'passed'
        : (progress!.exam1BestScorePct ?? 0) >= 70
        ? 'close'
        : 'retry';
    final statusColor = switch (examStatus) {
      'passed' => const Color(0xff047857),
      'close' => const Color(0xffb45309),
      'retry' => const Color(0xffb91c1c),
      _ => colors.primary,
    };
    void go(String mode) => Navigator.pushNamed(
      context,
      '/traffic-signs/${Uri.encodeComponent(content.routeCode)}/$mode',
    );
    final overview = RijviaPageSection(
      title: t.t('sign_detail.overview'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t.t('sign_detail.meaning'),
            style: Theme.of(context).textTheme.labelMedium,
          ),
          const SizedBox(height: 8),
          SelectableText(
            content.getDescription(language) ?? t.t('sign_detail.no_meaning'),
            style: const TextStyle(height: 1.9),
          ),
          const Divider(height: 32),
          Text(
            t.t('sign_detail.guidance'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          SelectableText(
            content.localizedDetail('driverGuidance', language) ?? '',
            style: const TextStyle(height: 1.9),
          ),
          if (exceptions is List && exceptions.isNotEmpty) ...[
            const Divider(height: 32),
            Text(
              t.t('sign_detail.exceptions'),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            for (final exception in exceptions)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  '• $exception',
                  style: const TextStyle(height: 1.9),
                ),
              ),
          ],
        ],
      ),
    );
    final practice = RijviaPageSection(
      title: t.t('sign_quiz.quiz_section_title'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            t.t('sign_quiz.practice_mode'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(t.t('sign_quiz.practice_desc')),
          if (progress?.practiceCompleted == true)
            Text(
              t.t('sign_quiz.practice_done'),
              style: const TextStyle(color: Color(0xff15803d)),
            ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: () => go('practice'),
            icon: const Icon(Icons.play_arrow),
            label: Text(
              t.t(
                progress?.practiceCompleted == true
                    ? 'sign_quiz.practice_again'
                    : progress?.practiceStarted == true
                    ? 'sign_quiz.continue_practice'
                    : 'sign_quiz.start_practice',
              ),
            ),
          ),
          const Divider(height: 32),
          Text(
            t.t('sign_quiz.exam_label'),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            count != null && count > 0 && passScore != null
                ? '${t.t('sign_quiz.questions_count', {'n': count})} • ${t.t('sign_quiz.pass_score', {'score': (passScore / count * 100).round()})}${progress?.exam1BestScorePct != null ? ' • ${t.t('sign_quiz.best_score', {'score': progress!.exam1BestScorePct!.round()})}' : ''}'
                : t.t(
                    progressLoading
                        ? 'common.loading'
                        : 'sign_quiz.exam_config_pending',
                  ),
          ),
          if (!progressLoading)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Chip(
                label: Text(
                  t.t('practice.exam_status.$examStatus'),
                  style: TextStyle(color: statusColor),
                ),
                backgroundColor: statusColor.withValues(alpha: .1),
                side: BorderSide(color: statusColor.withValues(alpha: .2)),
              ),
            ),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => go('exam/1'),
            icon: const Icon(Icons.assignment_outlined),
            label: Text(
              t.t(
                progress?.exam1Attempted == true
                    ? 'sign_quiz.retake_exam'
                    : 'sign_quiz.start_exam',
              ),
            ),
          ),
        ],
      ),
    );
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
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: TextButton.icon(
                      onPressed: () =>
                          Navigator.pushNamed(context, '/traffic-signs'),
                      icon: const Icon(Icons.arrow_back),
                      label: Text(t.t('sign_detail.back_to_all')),
                    ),
                  ),
                  RijviaPageHero(
                    title: name,
                    eyebrow: signGroupText(
                      content.categoryCode ?? '',
                      'title',
                      language,
                    ),
                    description: content.localizedDetail('summary', language),
                    actions: [
                      OutlinedButton.icon(
                        onPressed: () async {
                          if (!authenticated) {
                            Navigator.pushNamed(
                              context,
                              '/login?returnUrl=${Uri.encodeComponent('/traffic-signs/${content.routeCode}')}',
                            );
                            return;
                          }
                          try {
                            await favorites.toggleFavorite(content.id);
                          } catch (_) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(t.t('favorites.sync_error')),
                                ),
                              );
                            }
                          }
                        },
                        icon: Icon(
                          favorites.isFavorite(content.id)
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: colors.primary,
                        ),
                        label: Text(
                          t.t(
                            favorites.isFavorite(content.id)
                                ? 'favorites.web.remove'
                                : 'favorites.web.add',
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Center(
                    child: SizedBox(
                      width: 240,
                      height: 240,
                      child: RijviaEducationalImage(
                        url: content.imageUrl ?? '',
                        radius: 20,
                        frameRadius: 24,
                        label: name,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  LayoutBuilder(
                    builder: (context, box) => box.maxWidth >= 1100
                        ? Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(child: overview),
                              const SizedBox(width: 16),
                              SizedBox(width: 320, child: practice),
                            ],
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              overview,
                              const SizedBox(height: 16),
                              practice,
                            ],
                          ),
                  ),
                  const RijviaWebFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
