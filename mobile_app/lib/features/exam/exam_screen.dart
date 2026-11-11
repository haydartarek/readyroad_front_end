import '../../design_system/widgets/rijvia_focused_question_card.dart';
import '../../design_system/rijvia_tokens.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_answer_option.dart';
import '../../core/constants/app_theme.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import 'dart:async';
import 'dart:math';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/language_provider.dart';
import 'exam_question_service.dart';
import 'exam_payment_service.dart';
import 'exam_flow_policy.dart';
import 'exam_session_coordinator.dart';
import 'exam_results_screen.dart';
import 'package:url_launcher/url_launcher.dart';

/// Persistent Belgian theory exam screen.
/// Question access and scoring always come from the backend.
class ExamScreen extends StatefulWidget {
  const ExamScreen({
    super.key,
    this.examId,
    this.allowAnonymousEntry = false,
    this.initialExam,
  });
  final int? examId;
  final bool allowAnonymousEntry;
  final Map<String, dynamic>? initialExam;

  @override
  State<ExamScreen> createState() => _ExamScreenState();
}

/// In-memory handoff of a reconciled server response; never restored from URLs.
class ExamEntrySnapshot {
  ExamEntrySnapshot(Map<String, dynamic> payload)
    : payload = Map.unmodifiable(payload),
      examId = (payload['examId'] as num?)?.toInt();
  final Map<String, dynamic> payload;
  final int? examId;
}

/// Shared subscription surface for exam and profile entry points. Prices and
/// default selection are read from the same payment service used by checkout.
class PlansScreen extends StatefulWidget {
  const PlansScreen({
    super.key,
    this.initialPlan = ExamPaymentService.defaultPlan,
  });

  final String initialPlan;

  @override
  State<PlansScreen> createState() => _PlansScreenState();
}

class _PlansScreenState extends State<PlansScreen> {
  final ExamPaymentService _payment = getIt<ExamPaymentService>();
  late String _selected;
  bool _loading = false;
  Map<String, dynamic>? _access;

  @override
  void initState() {
    super.initState();
    _selected = ExamPaymentService.plans.contains(widget.initialPlan)
        ? widget.initialPlan
        : ExamPaymentService.defaultPlan;
    _loadAccess();
  }

  Future<void> _loadAccess() async {
    try {
      final access = await _payment.accountAccess();
      if (mounted) setState(() => _access = access);
    } catch (_) {
      // The checkout action remains available when access lookup is down.
    }
  }

  Future<void> _checkout() async {
    final locale = context.read<LanguageProvider>().currentLanguage;
    setState(() => _loading = true);
    try {
      final uri = await _payment.checkout(_selected, 0, locale);
      if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
        throw StateError('Unable to open Checkout');
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Checkout opened securely')),
        );
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final access = _access;
    return Scaffold(
      appBar: RijviaAppBar(
        title: Text(AppLocalizations.of(context).t('plans.title')),
      ),
      body: RijviaScrollFrame(
        maxWidth: 620,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(
                AppLocalizations.of(context).t('story.plans_subtitle'),
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
            if (access != null)
              Card(
                child: ListTile(
                  leading: Icon(
                    access['active'] == true || access['unlimited'] == true
                        ? Icons.verified
                        : Icons.lock_outline,
                  ),
                  title: Text(
                    access['unlimited'] == true
                        ? AppLocalizations.of(context).t('plans.unlimited')
                        : access['active'] == true
                        ? AppLocalizations.of(context).t('plans.active')
                        : AppLocalizations.of(context).t('plans.inactive'),
                  ),
                ),
              ),
            ...ExamPaymentService.plans.map(
              (plan) => Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Card(
                  color: _selected == plan
                      ? Theme.of(
                          context,
                        ).colorScheme.primary.withValues(alpha: 0.06)
                      : null,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                    side: BorderSide(
                      color: _selected == plan
                          ? Theme.of(context).colorScheme.primary
                          : Theme.of(context).colorScheme.outlineVariant,
                      width: 1,
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    selected: _selected == plan,
                    selectedColor: Theme.of(context).colorScheme.onSurface,
                    onTap: () => setState(() => _selected = plan),
                    leading: const RijviaIconBadge(
                      icon: Icons.calendar_today_outlined,
                    ),
                    title: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_planLabel(plan)),
                        Text(
                          ExamPaymentService.prices[plan]!,
                          textDirection: TextDirection.ltr,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        if (plan == ExamPaymentService.defaultPlan)
                          Chip(
                            label: Text(
                              AppLocalizations.of(context).t('plans.default'),
                            ),
                          ),
                      ],
                    ),
                    trailing: Icon(
                      _selected == plan
                          ? Icons.radio_button_checked
                          : Icons.radio_button_off,
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppLocalizations.of(context).t('home.pricing.subtitle'),
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 16),
                  for (final feature in const [
                    'questions',
                    'exam',
                    'explanations',
                    'progress',
                    'languages',
                  ])
                    Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.check_circle_outline, size: 24),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              AppLocalizations.of(
                                context,
                              ).t('home.pricing.feature_$feature'),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            RijviaNotice(
              message:
                  '${AppLocalizations.of(context).t('home.pricing.one_time')} · ${AppLocalizations.of(context).t('home.pricing.no_renewal')}',
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _loading ? null : _checkout,
              icon: _loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.lock),
              label: Text(AppLocalizations.of(context).t('plans.checkout')),
            ),
          ],
        ),
      ),
    );
  }

  String _planLabel(String plan) => switch (plan) {
    'RIJVIA_3_DAYS' => AppLocalizations.of(context).t('plans.three_days'),
    'RIJVIA_4_WEEKS' => AppLocalizations.of(context).t('plans.four_weeks'),
    _ => AppLocalizations.of(context).t('plans.one_week'),
  };
}

class _ExamScreenState extends State<ExamScreen> with WidgetsBindingObserver {
  final ExamQuestionService _questionService = getIt<ExamQuestionService>();
  final ExamPaymentService _paymentService = getIt<ExamPaymentService>();
  late final ExamSessionCoordinator _session = ExamSessionCoordinator(
    loadActive: _questionService.getActiveExam,
    startNew: _questionService.startExam,
    markPresented: _questionService.recordPresented,
  );
  List<Map<String, dynamic>> _questions = [];
  final Map<int, int> _answers = {};
  final Map<int, Map<String, dynamic>> _previewFeedback = {};
  final Set<int> _finalizedQuestionIds = {};
  int? _examId;
  int _currentQuestionIndex = 0;
  bool _isLoading = true;
  bool _isSubmitting = false;
  // Never create an exam just because the learner opened the exam page.
  bool _showEntry = true;
  Map<String, dynamic>? _entryExam;
  String? _error;
  String? _answerSubmitError;
  String? _accessState;
  String? _accessMode;
  int _totalQuestions = 50;
  int _freeQuestionLimit = 10;
  bool _isExamActive = false;
  Timer? _questionTimer;
  Stopwatch? _questionStopwatch;
  int _secondsRemaining = 15;
  DateTime? _questionDeadline;
  bool _accessCheckInFlight = false;
  bool _initialExamConsumed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _loadExam();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _questionTimer?.cancel();
    _questionStopwatch?.stop();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      unawaited(_refreshAccessAfterReturn());
    }
  }

  Future<void> _refreshAccessAfterReturn() async {
    if (_accessCheckInFlight || !mounted) return;
    _accessCheckInFlight = true;
    try {
      // Only poll for Stripe webhook confirmation if a checkout was started.
      // Ordinary app resumes must refresh the server-owned exam deadline.
      final pendingCheckout = await _paymentService.pendingCheckout();
      if (pendingCheckout != null) {
        for (var attempt = 0; attempt < 6; attempt++) {
          if (!mounted) return;
          if (await _paymentService.hasConfirmedAccess()) break;
          if (attempt < 5) {
            await Future<void>.delayed(const Duration(seconds: 2));
          }
        }
      }
      if (mounted) await _loadExam();
    } catch (_) {
      // Do not start an unrelated exam or grant access while offline.
      // Existing timer continues to use its last known deadline.
    } finally {
      _accessCheckInFlight = false;
    }
  }

  Future<void> _loadExam() async {
    if (!mounted) return;
    _questionTimer?.cancel();
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      if (widget.allowAnonymousEntry &&
          context.read<AuthBloc>().state is! Authenticated) {
        setState(() {
          _showEntry = true;
          _entryExam = null;
          _isLoading = false;
        });
        return;
      }
      final initial = widget.initialExam;
      if (!_initialExamConsumed &&
          initial != null &&
          (initial['examId'] as num?)?.toInt() == widget.examId) {
        _initialExamConsumed = true;
        _hydrate(initial);
        return;
      }
      if (widget.examId != null && _examId == null) {
        final ready = await _session.resumeExisting(widget.examId!);
        if (mounted) _hydrate(ready);
        return;
      }
      final active = await _session.activeExam();
      if (!mounted) return;
      if (active == null || _showEntry) {
        setState(() {
          _entryExam = active;
          _showEntry = true;
          _isExamActive = false;
          _questions = [];
          _examId = null;
          _isLoading = false;
          _accessState = active?['accessState']?.toString();
          _accessMode = active?['accessMode']?.toString();
        });
        return;
      }
      final ready = await _session.presentAndRefresh(active);
      if (mounted) _hydrate(ready);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = AppLocalizations.of(context).t('common.error_desc');
        _isLoading = false;
      });
    }
  }

  /// Re-read the server before beginning: another device or a successful
  /// checkout may have changed the active attempt since entry was displayed.
  Future<void> _startOrResumeExam() async {
    if (_isSubmitting || !mounted) return;
    if (widget.allowAnonymousEntry &&
        context.read<AuthBloc>().state is! Authenticated) {
      await Navigator.pushNamed(context, '/login?returnUrl=%2Fexam');
      if (mounted) await _loadExam();
      return;
    }
    setState(() {
      _isSubmitting = true;
      _error = null;
    });
    try {
      final ready = await _session.enter();
      if (!mounted) return;
      if (widget.allowAnonymousEntry) {
        final snapshot = ExamEntrySnapshot(ready);
        if (snapshot.examId == null || snapshot.examId! <= 0) {
          throw StateError('Missing exam ID from server');
        }
        Navigator.pushNamed(
          context,
          '/exam/${snapshot.examId}',
          arguments: snapshot,
        ).then((_) {
          if (mounted) _loadExam();
        });
      } else {
        _hydrate(ready);
      }
    } catch (error) {
      if (!mounted) return;
      setState(
        () => _error = AppLocalizations.of(context).t('common.error_desc'),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Widget _buildExamEntry() {
    final t = AppLocalizations.of(context);
    final action = ExamFlowPolicy.entryAction(
      hasActiveExam: _entryExam != null,
      accessMode: _entryExam?['accessMode']?.toString(),
      accessState: _entryExam?['accessState']?.toString(),
    );
    final paused = action == ExamEntryAction.restartPreview;
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 1024),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RijviaPageSection(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          t.t('practice_exam.intro_title'),
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                fontWeight: FontWeight.w900,
                                color: Theme.of(context).colorScheme.secondary,
                              ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          t.t('practice_exam.intro_subtitle'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                            height: 1.7,
                          ),
                        ),
                        const SizedBox(height: 24),
                        RijviaAdaptiveGrid(
                          minCellWidth: 180,
                          children: [
                            RijviaMetricCard(
                              label: t.t('exam.total_questions'),
                              value: '50',
                              icon: Icons.quiz_outlined,
                            ),
                            RijviaMetricCard(
                              label: t.t('exam.duration'),
                              value: t.t('exam.duration_value', {
                                'minutes': 12,
                                'seconds': 30,
                              }),
                              icon: Icons.schedule,
                            ),
                            RijviaMetricCard(
                              label: t.t('exam.pass_score'),
                              value: '41/50',
                              icon: Icons.emoji_events_outlined,
                            ),
                          ],
                        ),
                        if (paused) ...[
                          const SizedBox(height: 16),
                          Text(t.t('exam.paywall.preview_ended')),
                        ],
                        const SizedBox(height: 24),
                        RijviaAdaptiveGrid(
                          minCellWidth: MediaQuery.textScalerOf(
                            context,
                          ).scale(300),
                          maxColumns: 2,
                          children: [
                            FilledButton.icon(
                              key: const Key('rijvia_exam_entry_primary'),
                              onPressed: _isSubmitting
                                  ? null
                                  : _startOrResumeExam,
                              icon: _isSubmitting
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Icon(
                                      _entryExam == null
                                          ? Icons.play_arrow
                                          : Icons.restart_alt,
                                    ),
                              label: Text(
                                _isSubmitting
                                    ? t.t('exam.starting')
                                    : _entryExam == null
                                    ? t.t('practice_exam.start_btn')
                                    : paused
                                    ? t.t('exam.entry.restart')
                                    : t.t('exam.back_to_exam_start'),
                              ),
                            ),
                            OutlinedButton(
                              onPressed: () =>
                                  Navigator.pushNamed(context, '/practice'),
                              child: Text(t.t('practice_exam.back_practice')),
                            ),
                          ],
                        ),
                        if (paused) ...[
                          const SizedBox(height: 12),
                          OutlinedButton(
                            key: const Key('rijvia_exam_entry_checkout'),
                            onPressed: _isSubmitting
                                ? null
                                : () {
                                    final id = (_entryExam?['examId'] as num?)
                                        ?.toInt();
                                    if (id == null) return;
                                    setState(() => _examId = id);
                                    _openCheckout();
                                  },
                            child: Text(t.t('exam.paywall.subscribe')),
                          ),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),
                  RijviaPageSection(
                    title: t.t('exam.rules.title'),
                    description: t.t('exam.rules.subtitle'),
                    child: RijviaAdaptiveGrid(
                      minCellWidth: 300,
                      children: [
                        for (final rule in const [
                          ('totalQuestions', Icons.fact_check_outlined),
                          ('timeLimit', Icons.timer_outlined),
                          ('passScore', Icons.emoji_events_outlined),
                          ('submission', Icons.assignment_turned_in_outlined),
                        ])
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: Theme.of(
                                  context,
                                ).colorScheme.primary.withValues(alpha: .1),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  rule.$2,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    t.t('exam.rules.content.${rule.$1}'),
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const RijviaWebFooter(),
        ],
      ),
    );
  }

  void _hydrate(Map<String, dynamic> payload) {
    final rawQuestions = payload['questions'];
    final questions = rawQuestions is List
        ? rawQuestions
              .whereType<Map>()
              .map((question) => Map<String, dynamic>.from(question))
              .toList()
        : <Map<String, dynamic>>[];

    if (!mounted) return;
    final nextExamId = (payload['examId'] as num?)?.toInt();
    // Backend owns finalized answers. Discard device-only selections on every
    // reconciliation; a different device may have finalized this question.
    _answers.clear();
    _previewFeedback.clear();
    final finalized = payload['finalizedQuestionIds'];
    setState(() {
      _examId = nextExamId;
      _entryExam = null;
      _showEntry = false;
      _accessState = payload['accessState']?.toString();
      _accessMode = payload['accessMode']?.toString();
      _totalQuestions = (payload['totalQuestions'] as num?)?.toInt() ?? 50;
      _freeQuestionLimit =
          (payload['freeQuestionLimit'] as num?)?.toInt() ?? 10;
      _questions = questions;
      _currentQuestionIndex = _resumeIndex(payload, questions);
      _isLoading = false;
      _isExamActive =
          payload['status'] == null ||
          payload['status'].toString() == 'IN_PROGRESS';
      final deadline = DateTime.tryParse(
        payload['questionDeadlineAt']?.toString() ?? '',
      );
      final serverTime = DateTime.tryParse(
        payload['serverTime']?.toString() ?? '',
      );
      _questionDeadline = deadline?.subtract(
        serverTime?.difference(DateTime.now()) ?? Duration.zero,
      );
      _finalizedQuestionIds
        ..clear()
        ..addAll(
          finalized is List
              ? finalized.whereType<num>().map((value) => value.toInt())
              : const <int>[],
        );
    });
    _startQuestionTimer();
  }

  bool get _atPreviewBoundary {
    if (_questions.isEmpty) return false;
    final question = _questions[_currentQuestionIndex];
    return ExamFlowPolicy.isPreviewBoundary(
      accessMode: _accessMode,
      accessState: _accessState,
      questionIndex: _currentQuestionIndex,
      visibleQuestionCount: _questions.length,
      questionOrder:
          (question['questionOrder'] as num?)?.toInt() ??
          _currentQuestionIndex + 1,
      freeQuestionLimit: _freeQuestionLimit,
    );
  }

  void _startQuestionTimer() {
    _questionTimer?.cancel();
    _questionStopwatch?.stop();
    if (!_isExamActive ||
        _questions.isEmpty ||
        _accessState == 'FREE_LIMIT_REACHED') {
      return;
    }
    final currentQuestionId = _questionId(_questions[_currentQuestionIndex]);
    if (currentQuestionId == null ||
        _finalizedQuestionIds.contains(currentQuestionId)) {
      return;
    }
    final deadline = _questionDeadline;
    if (deadline == null) {
      setState(
        () => _error =
            'Server question deadline is unavailable. Retry loading the exam.',
      );
      return;
    }
    // A monotonic Stopwatch cannot be extended by changing the phone clock.
    // Hydration always calibrates the starting interval against serverTime.
    final startingMilliseconds = max(
      0,
      deadline.difference(DateTime.now()).inMilliseconds,
    );
    _questionStopwatch = Stopwatch()..start();
    setState(() => _secondsRemaining = (startingMilliseconds + 999) ~/ 1000);
    _questionTimer = Timer.periodic(const Duration(milliseconds: 250), (timer) {
      if (!mounted || !_isExamActive || _isSubmitting) return;
      final elapsed = _questionStopwatch?.elapsedMilliseconds ?? 0;
      final left = startingMilliseconds - elapsed;
      if (left <= 0) {
        timer.cancel();
        unawaited(_handleTimeout());
        return;
      }
      final remaining = (left + 999) ~/ 1000;
      if (_secondsRemaining != remaining) {
        setState(() => _secondsRemaining = remaining);
      }
    });
  }

  Future<void> _handleTimeout() async {
    if (_isSubmitting || _questions.isEmpty) return;
    final examId = _examId;
    final questionId = _questionId(_questions[_currentQuestionIndex]);
    if (examId == null || questionId == null) return;
    setState(() => _isSubmitting = true);
    try {
      // Once the deadline has passed, never submit a late device selection.
      // Backend's timeout endpoint is idempotent even when a submitted answer
      // from Web or an earlier request already finalized the same question.
      await _questionService.recordTimeout(examId, questionId);
      final ready = await _session.resumeExisting(examId);
      if (!mounted) return;
      _hydrate(ready);
      setState(() => _isSubmitting = false);
      if (_accessState == 'FREE_LIMIT_REACHED') {
        _showPaywallMessage();
      } else if (ExamFlowPolicy.canSubmitFullExam(
        accessMode: _accessMode,
        accessState: _accessState,
        visibleQuestionCount: _questions.length,
        totalQuestionCount: _totalQuestions,
        finalizedCount: _finalizedQuestionIds.length,
      )) {
        await _submitExam(requireConfirmation: false);
      }
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _error = AppLocalizations.of(context).t('common.error_desc');
      });
    }
  }

  int _resumeIndex(
    Map<String, dynamic> payload,
    List<Map<String, dynamic>> questions,
  ) {
    final requestedOrder = (payload['resumeQuestionOrder'] as num?)?.toInt();
    if (requestedOrder == null) return 0;
    final index = questions.indexWhere(
      (question) =>
          (question['questionOrder'] as num?)?.toInt() == requestedOrder,
    );
    if (index >= 0) return index;
    return payload['accessState']?.toString() == 'FREE_LIMIT_REACHED' &&
            questions.isNotEmpty
        ? questions.length - 1
        : 0;
  }

  int? _questionId(Map<String, dynamic> question) =>
      (question['questionId'] as num?)?.toInt();

  List<Map<String, dynamic>> _options(Map<String, dynamic> question) {
    final rawOptions = question['options'];
    if (rawOptions is! List) return const <Map<String, dynamic>>[];
    return rawOptions
        .whereType<Map>()
        .map((option) => Map<String, dynamic>.from(option))
        .toList();
  }

  Future<bool> _submitCurrentAnswer() async {
    _answerSubmitError = null;
    final examId = _examId;
    final question = _questions[_currentQuestionIndex];
    final questionId = _questionId(question);
    final selectedOptionId = _answers[_currentQuestionIndex];
    if (examId == null || questionId == null || selectedOptionId == null) {
      return false;
    }

    if (_finalizedQuestionIds.contains(questionId)) {
      return _accessState != 'FREE_LIMIT_REACHED';
    }

    try {
      final response = await _questionService.submitAnswer(
        examId: examId,
        questionId: questionId,
        selectedOptionId: selectedOptionId,
        timeTakenSeconds: _elapsedSecondsForCurrentQuestion(),
      );
      final state = response['accessState']?.toString();
      if (state != null) _accessState = state;
      if (state == 'FREE_LIMIT_REACHED') _questionTimer?.cancel();
      _savePreviewFeedback(questionId, response);
      _finalizedQuestionIds.add(questionId);
      return state != 'FREE_LIMIT_REACHED';
    } catch (error) {
      _answerSubmitError = error.toString();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.toString())));
      }
      return false;
    }
  }

  Future<void> _selectAnswer(int optionId) async {
    if (_isSubmitting || !_isExamActive) return;
    final examId = _examId;
    final questionId = _questionId(_questions[_currentQuestionIndex]);
    if (examId == null ||
        questionId == null ||
        _finalizedQuestionIds.contains(questionId)) {
      return;
    }

    setState(() => _answers[_currentQuestionIndex] = optionId);
    setState(() => _isSubmitting = true);
    try {
      final response = await _questionService.submitAnswer(
        examId: examId,
        questionId: questionId,
        selectedOptionId: optionId,
        timeTakenSeconds: _elapsedSecondsForCurrentQuestion(),
      );
      final state = response['accessState']?.toString();
      if (state != null) _accessState = state;
      if (state == 'FREE_LIMIT_REACHED') _questionTimer?.cancel();
      _savePreviewFeedback(questionId, response);
      _finalizedQuestionIds.add(questionId);
    } catch (error) {
      _answerSubmitError = error.toString();
      if (mounted) _showMessage(_answerSubmitError!);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  int _elapsedSecondsForCurrentQuestion() =>
      max(0, min(15, 15 - _secondsRemaining));

  void _savePreviewFeedback(int questionId, Map<String, dynamic> response) {
    if (_accessMode == 'PREVIEW' &&
        response['correct'] is bool &&
        response['correctOptionId'] is num) {
      _previewFeedback[questionId] = {
        'correct': response['correct'] == true,
        'correctOptionId': (response['correctOptionId'] as num).toInt(),
      };
    }
  }

  Future<void> _nextQuestion() async {
    if (_accessState == 'FREE_LIMIT_REACHED') {
      _showPaywallMessage();
      return;
    }
    if (_answers[_currentQuestionIndex] == null) {
      _showMessage(AppLocalizations.of(context).t('exam.select_answer'));
      return;
    }
    setState(() => _isSubmitting = true);
    final canContinue = await _submitCurrentAnswer();
    if (!mounted) return;
    setState(() => _isSubmitting = false);
    if (!canContinue) {
      if (_accessState == 'FREE_LIMIT_REACHED') {
        _showPaywallMessage();
      } else if (_answerSubmitError != null) {
        _showMessage(_answerSubmitError!);
      }
      return;
    }
    if (_atPreviewBoundary) {
      setState(() => _accessState = 'FREE_LIMIT_REACHED');
      _questionTimer?.cancel();
      _showPaywallMessage();
      return;
    }
    if (_currentQuestionIndex < _questions.length - 1) {
      final examId = _examId;
      if (examId == null) return;
      setState(() => _isSubmitting = true);
      try {
        final ready = await _session.resumeExisting(examId);
        if (mounted) _hydrate(ready);
      } catch (error) {
        if (mounted) {
          setState(() => _error = error.toString());
        }
      } finally {
        if (mounted) setState(() => _isSubmitting = false);
      }
    }
  }

  Future<void> _submitExam({bool requireConfirmation = true}) async {
    if (_atPreviewBoundary) {
      _showPaywallMessage();
      return;
    }
    final locallyAnsweredUnfinalized = _answers.keys.where((index) {
      final questionId = _questionId(_questions[index]);
      return questionId != null && !_finalizedQuestionIds.contains(questionId);
    }).length;
    if (!ExamFlowPolicy.canSubmitFullExam(
      accessMode: _accessMode,
      accessState: _accessState,
      visibleQuestionCount: _questions.length,
      totalQuestionCount: _totalQuestions,
      finalizedCount: _finalizedQuestionIds.length + locallyAnsweredUnfinalized,
    )) {
      _showMessage(AppLocalizations.of(context).t('exam.answer_all'));
      return;
    }
    final examId = _examId;
    if (examId == null) return;

    final confirmed = !requireConfirmation
        ? true
        : await showDialog<bool>(
            context: context,
            builder: (dialogContext) => AlertDialog(
              title: Text(
                AppLocalizations.of(context).t('exam.confirm_submission_title'),
              ),
              content: Text(
                AppLocalizations.of(
                  context,
                ).t('exam.confirm_submission_message'),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogContext, false),
                  child: Text(AppLocalizations.of(context).commonCancel),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.pop(dialogContext, true),
                  child: Text(AppLocalizations.of(context).examSubmit),
                ),
              ],
            ),
          );
    if (confirmed != true || !mounted) return;

    setState(() => _isSubmitting = true);
    try {
      final currentQuestionId = _questionId(_questions[_currentQuestionIndex]);
      final canContinue =
          currentQuestionId != null &&
              _finalizedQuestionIds.contains(currentQuestionId)
          ? true
          : await _submitCurrentAnswer();
      if (!mounted) return;
      if (!canContinue) {
        if (!mounted) return;
        setState(() => _isSubmitting = false);
        if (_accessState == 'FREE_LIMIT_REACHED') {
          _showPaywallMessage();
        } else if (_answerSubmitError != null) {
          _showMessage(_answerSubmitError!);
        }
        return;
      }
      if (!ExamFlowPolicy.canSubmitFullExam(
        accessMode: _accessMode,
        accessState: _accessState,
        visibleQuestionCount: _questions.length,
        totalQuestionCount: _totalQuestions,
        finalizedCount: _finalizedQuestionIds.length,
      )) {
        setState(() => _isSubmitting = false);
        _showMessage(AppLocalizations.of(context).t('exam.answer_all'));
        return;
      }
      await _questionService.completeExam(examId);
      final results = await _questionService.getResults(examId);
      if (!mounted) return;
      setState(() {
        _isSubmitting = false;
        _isExamActive = false;
      });
      _questionTimer?.cancel();
      _showResults(results);
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);
      _showMessage(error.toString());
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  void _showPaywallMessage() {
    final localizations = AppLocalizations.of(context);
    showDialog<void>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(localizations.t('exam.paywall.title')),
        content: Text(localizations.t('exam.paywall.description')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: Text(AppLocalizations.of(context).commonClose),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _startOrResumeExam();
            },
            child: Text(localizations.t('exam.entry.restart')),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(dialogContext);
              _openCheckout();
            },
            child: Text(localizations.t('exam.paywall.subscribe')),
          ),
        ],
      ),
    );
  }

  Future<void> _openCheckout() async {
    final examId = _examId;
    if (examId == null || !mounted) return;
    final plan = await showModalBottomSheet<String>(
      context: context,
      builder: (sheetContext) {
        var selectedPlan = ExamPaymentService.defaultPlan;
        final localizations = AppLocalizations.of(sheetContext);
        String planLabel(String value) =>
            localizations.t('payment.plan.$value');

        String planPerDay(String value) =>
            localizations.t('home.pricing.per_day.$value');

        return StatefulBuilder(
          builder: (context, setSheetState) => SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Text(
                    localizations.t('payment.plans_title'),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ),
                ...ExamPaymentService.plans.map((value) {
                  final selected = selectedPlan == value;
                  final recommended = value == ExamPaymentService.defaultPlan;
                  return ListTile(
                    leading: Icon(
                      selected
                          ? Icons.radio_button_checked
                          : Icons.radio_button_off,
                      color: selected
                          ? Theme.of(context).colorScheme.primary
                          : null,
                    ),
                    title: Text(planLabel(value)),
                    subtitle: Text(
                      '${ExamPaymentService.prices[value]} · ${planPerDay(value)}'
                      '${recommended ? ' · ${localizations.t('home.pricing.recommended')}' : ''}',
                    ),
                    onTap: () {
                      setSheetState(() => selectedPlan = value);
                    },
                  );
                }),
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                  child: SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () =>
                          Navigator.pop(sheetContext, selectedPlan),
                      child: Text(
                        '${localizations.t('payment.choose_plan')} · '
                        '${ExamPaymentService.prices[selectedPlan]}',
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
    if (plan == null || !mounted) return;
    try {
      final locale = Provider.of<LanguageProvider>(
        context,
        listen: false,
      ).currentLanguage;
      final checkoutUrl = await _paymentService.checkout(plan, examId, locale);
      if (!await launchUrl(checkoutUrl, mode: LaunchMode.externalApplication)) {
        throw StateError('Could not open Checkout');
      }
      if (mounted) {
        _showMessage(AppLocalizations.of(context).t('payment.return_to_app'));
      }
    } catch (error) {
      if (error is DioException &&
          (error.response?.statusCode == 409 ||
              error.response?.statusCode == 410)) {
        await _paymentService.forgetCheckout();
        if (mounted) {
          _showMessage(AppLocalizations.of(context).t('payment.expired'));
        }
      } else if (mounted) {
        _showMessage(error.toString());
      }
    }
  }

  void _showResults(ExamResults results) {
    final examId = _examId;
    if (examId == null || !mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) =>
            ExamResultsScreen(examId: examId, initialResult: results),
      ),
    );
  }

  Future<bool> _onBackPressed() async {
    if (!_isExamActive ||
        _questions.isEmpty ||
        _accessState == 'FREE_LIMIT_REACHED') {
      return true;
    }
    final leave = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: Text(AppLocalizations.of(context).examExitTitle),
        content: Text(AppLocalizations.of(context).examExitMessage),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: Text(AppLocalizations.of(context).examExitStay),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: Text(AppLocalizations.of(context).examExitLeave),
          ),
        ],
      ),
    );
    if (leave == true && _examId != null) {
      _questionTimer?.cancel();
      await _questionService.abandonExam(_examId!);
    }
    return leave == true;
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final language = languageProvider.currentLanguage;
    return PopScope(
      canPop: !_isExamActive || _questions.isEmpty,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final shouldPop = await _onBackPressed();
        if (!context.mounted || !shouldPop) return;
        Navigator.pushReplacementNamed(context, '/exam');
      },
      child: Scaffold(
        appBar: const RijviaAppBar(),
        body: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    TextButton(
                      onPressed: _loadExam,
                      child: Text(
                        AppLocalizations.of(
                          context,
                        ).t('exam.results_retry_load'),
                      ),
                    ),
                  ],
                ),
              )
            : _showEntry
            ? RijviaScrollFrame(maxWidth: 1024, child: _buildExamEntry())
            : _questions.isEmpty
            ? Center(
                child: Text(
                  AppLocalizations.of(context).t('exam.no_questions'),
                ),
              )
            : RijviaScrollFrame(
                maxWidth: 1680,
                child: _buildExamView(language),
              ),
        bottomNavigationBar: !_isLoading && !_showEntry && _questions.isNotEmpty
            ? _buildNavigationBar()
            : null,
      ),
    );
  }

  Future<void> _leaveTo(String path) async {
    if (await _onBackPressed() && mounted) {
      Navigator.pushReplacementNamed(context, path);
    }
  }

  Widget _buildExamView(String language) {
    final colors = Theme.of(context).colorScheme;
    final question = _questions[_currentQuestionIndex];
    final questionText = language == 'ar'
        ? question['questionTextAr']
        : language == 'nl'
        ? question['questionTextNl']
        : language == 'fr'
        ? question['questionTextFr']
        : question['questionTextEn'];
    final options = _options(question);
    final selectedOptionId = _answers[_currentQuestionIndex];
    final questionId = _questionId(question);
    final feedback = questionId == null ? null : _previewFeedback[questionId];
    final previewCorrectOptionId = (feedback?['correctOptionId'] as num?)
        ?.toInt();
    final previewCorrectOption = previewCorrectOptionId == null
        ? null
        : options.cast<Map<String, dynamic>?>().firstWhere(
            (option) =>
                (option?['optionId'] as num?)?.toInt() ==
                previewCorrectOptionId,
            orElse: () => null,
          );
    final previewCorrectText = previewCorrectOption == null
        ? null
        : previewCorrectOption[language == 'ar'
                  ? 'optionTextAr'
                  : language == 'nl'
                  ? 'optionTextNl'
                  : language == 'fr'
                  ? 'optionTextFr'
                  : 'optionTextEn']
              ?.toString();
    final imageUrl = question['imageUrl']?.toString();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RijviaFocusedQuestionCard(
            title: questionText?.toString() ?? '',
            media: imageUrl == null || imageUrl.isEmpty
                ? null
                : RijviaEducationalImage(
                    url: imageUrl,
                    radius: RijviaDesignLayout.questionImageRadius,
                    label: AppLocalizations.of(
                      context,
                    ).t('media.question_image'),
                    maxHeight: MediaQuery.sizeOf(context).width >= 1024
                        ? 440
                        : 240,
                  ),
            options: options.map((option) {
              final optionId = (option['optionId'] as num?)?.toInt();
              final textKey = language == 'ar'
                  ? 'optionTextAr'
                  : language == 'nl'
                  ? 'optionTextNl'
                  : language == 'fr'
                  ? 'optionTextFr'
                  : 'optionTextEn';
              final isSelected =
                  optionId != null && optionId == selectedOptionId;
              final correctOptionId = (feedback?['correctOptionId'] as num?)
                  ?.toInt();
              final isCorrectOption =
                  optionId != null && optionId == correctOptionId;
              final isWrongSelection =
                  feedback != null && isSelected && !isCorrectOption;
              return RijviaAnswerOption(
                index: options.indexOf(option),
                text: option[textKey]?.toString() ?? '',
                state: isCorrectOption
                    ? RijviaAnswerState.correct
                    : isWrongSelection
                    ? RijviaAnswerState.incorrect
                    : isSelected
                    ? RijviaAnswerState.selected
                    : feedback != null
                    ? RijviaAnswerState.neutral
                    : RijviaAnswerState.idle,
                onSelect:
                    optionId == null ||
                        _isSubmitting ||
                        (questionId != null &&
                            _finalizedQuestionIds.contains(questionId))
                    ? null
                    : () => _selectAnswer(optionId),
              );
            }).toList(),
            feedback: feedback == null
                ? null
                : Card(
                    color: feedback['correct'] == true
                        ? AppColors.success.withValues(alpha: .12)
                        : colors.error.withValues(alpha: .12),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            AppLocalizations.of(context).t(
                              feedback['correct'] == true
                                  ? 'exam.preview_correct'
                                  : 'exam.preview_incorrect',
                            ),
                          ),
                          if (previewCorrectText != null &&
                              previewCorrectText.isNotEmpty &&
                              feedback['correct'] != true)
                            Text(
                              '${AppLocalizations.of(context).t('exam.results_correct_answer')}: $previewCorrectText',
                            ),
                        ],
                      ),
                    ),
                  ),
          ),
          RijviaExamInformation(
            current: _currentQuestionIndex + 1,
            total: _totalQuestions,
            seconds: _secondsRemaining,
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              FilledButton(
                onPressed: _isSubmitting ? null : () => _leaveTo('/exam'),
                style: FilledButton.styleFrom(backgroundColor: colors.error),
                child: Text(
                  AppLocalizations.of(context).t('practice_exam.end_exam'),
                ),
              ),
              OutlinedButton.icon(
                onPressed: _isSubmitting ? null : () => _leaveTo('/contact'),
                icon: const Icon(Icons.flag_outlined),
                label: Text(
                  AppLocalizations.of(
                    context,
                  ).t('practice_exam.report_question'),
                ),
              ),
            ],
          ),
          if (_accessState == 'FREE_LIMIT_REACHED')
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Text(
                      AppLocalizations.of(
                        context,
                      ).t('exam.paywall.preview_ended'),
                    ),
                    TextButton(
                      onPressed: _isSubmitting ? null : _startOrResumeExam,
                      child: Text(
                        AppLocalizations.of(context).t('exam.entry.restart'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildNavigationBar() {
    final isLast = _currentQuestionIndex >= _questions.length - 1;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: FilledButton(
                onPressed: _isSubmitting
                    ? null
                    : isLast && !_atPreviewBoundary
                    ? _submitExam
                    : _nextQuestion,
                child: Text(
                  _atPreviewBoundary && _accessState == 'FREE_LIMIT_REACHED'
                      ? AppLocalizations.of(context).t('exam.paywall.subscribe')
                      : isLast && !_atPreviewBoundary
                      ? AppLocalizations.of(context).examSubmit
                      : AppLocalizations.of(context).examNext,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
