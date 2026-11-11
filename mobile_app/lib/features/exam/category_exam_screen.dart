import '../../design_system/widgets/rijvia_focused_question_card.dart';
import '../../design_system/widgets/rijvia_result_answer_block.dart';
import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_answer_option.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import 'exam_payment_service.dart';

class CategoryExamService {
  CategoryExamService(this.api, this.payment);
  final AuthenticatedApiClient api;
  final ExamPaymentService payment;
  String _base(String code) =>
      '/api/practice/theory/categories/${Uri.encodeComponent(code)}';
  Future<Map<String, dynamic>> summary(String code, String language) async =>
      Map<String, dynamic>.from(
        (await api.get(
          '${_base(code)}/summary',
          queryParameters: {'lang': language},
        )).data,
      );
  Future<Map<String, dynamic>> exam(String code, String language) async =>
      Map<String, dynamic>.from(
        (await api.get(
          '${_base(code)}/exam',
          queryParameters: {'lang': language},
        )).data,
      );
  Future<Map<String, dynamic>> answer(
    String code,
    int question,
    int choice,
  ) async => Map<String, dynamic>.from(
    (await api.post(
      '${_base(code)}/questions/$question/answer',
      data: {'selectedOptionId': choice},
    )).data,
  );
  Future<Map<String, dynamic>> access() => payment.accountAccess();
}

/// Category practice obeys server entitlement, expiry and answer feedback.
class CategoryExamScreen extends StatefulWidget {
  const CategoryExamScreen({super.key, required this.category, this.service});
  final String category;
  final CategoryExamService? service;
  @override
  State<CategoryExamScreen> createState() => _CategoryExamScreenState();
}

class _CategoryExamScreenState extends State<CategoryExamScreen>
    with WidgetsBindingObserver {
  late final _service =
      widget.service ??
      CategoryExamService(
        getIt<AuthenticatedApiClient>(),
        getIt<ExamPaymentService>(),
      );
  Map<String, dynamic>? _category;
  Map<String, dynamic>? _exam;
  String? _error;
  String? _language;
  bool _loading = true;
  bool _paywall = false;
  bool _busy = false;
  bool _finished = false;
  int _index = 0;
  int? _selected;
  int _revision = 0;
  DateTime? _deadline;
  Duration _serverOffset = Duration.zero;
  Timer? _expiryTimer;
  final Map<int, Map<String, dynamic>> _answers = {};
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _expiryTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final language = context.watch<LanguageProvider>().currentLanguage;
    if (_language != language) {
      _language = language;
      _load();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && _exam != null) _revalidate();
  }

  bool get _expired =>
      _deadline != null &&
      !DateTime.now().add(_serverOffset).isBefore(_deadline!);
  void _lock() {
    _expiryTimer?.cancel();
    if (mounted) {
      setState(() {
        _exam = null;
        _selected = null;
        _paywall = true;
      });
    }
  }

  void _scheduleExpiry() {
    _expiryTimer?.cancel();
    final deadline = _deadline;
    if (deadline == null) return;
    final remaining = deadline.difference(DateTime.now().add(_serverOffset));
    if (remaining <= Duration.zero) {
      _lock();
    } else {
      _expiryTimer = Timer(remaining, _lock);
    }
  }

  bool _applyAccess(Map<String, dynamic> access) {
    if (access['unlimited'] == true) {
      _deadline = null;
      _scheduleExpiry();
      return true;
    }
    _deadline = DateTime.tryParse(access['expiresAt']?.toString() ?? '');
    if (access['active'] != true || _deadline == null || _expired) return false;
    _scheduleExpiry();
    return true;
  }

  Future<void> _revalidate() async {
    final revision = _revision;
    if (_expired) {
      _lock();
      return;
    }
    try {
      final access = await _service.access();
      if (mounted && revision == _revision && !_applyAccess(access)) _lock();
    } catch (_) {
      if (mounted && revision == _revision) _lock();
    }
  }

  Future<void> _load() async {
    final revision = ++_revision;
    _expiryTimer?.cancel();
    setState(() {
      _loading = true;
      _error = null;
      _exam = null;
      _finished = false;
      _index = 0;
      _answers.clear();
      _selected = null;
      _paywall = false;
      _deadline = null;
    });
    try {
      final values = await Future.wait([
        _service.summary(widget.category, _language!),
        _service.access(),
      ]);
      if (!mounted || revision != _revision) return;
      _category = values[0];
      if (values[1]['active'] != true && values[1]['unlimited'] != true) {
        _paywall = (_category!['questionCount'] as num) > 0;
        return;
      }
      final exam = await _service.exam(widget.category, _language!);
      if (!mounted || revision != _revision) return;
      final serverTime = DateTime.tryParse(
        exam['serverTime']?.toString() ?? '',
      );
      if (serverTime == null) {
        throw const FormatException('Missing category exam server time');
      }
      _serverOffset = serverTime.difference(DateTime.now());
      if (!_applyAccess(values[1])) {
        _paywall = true;
        return;
      }
      _category = Map<String, dynamic>.from(exam['category']);
      _exam = exam;
    } catch (error) {
      if (!mounted || revision != _revision) return;
      final status = error is DioException ? error.response?.statusCode : null;
      if (status == 403) {
        _paywall = true;
      } else {
        _error = status == 404
            ? 'category_exam.unavailable'
            : 'common.load_error';
      }
    } finally {
      if (mounted && revision == _revision) setState(() => _loading = false);
    }
  }

  Future<void> _next() async {
    if (_busy || _selected == null || _exam == null) return;
    if (_expired) {
      _lock();
      return;
    }
    final revision = _revision;
    final question = (_exam!['questions'] as List)[_index] as Map;
    final selected = _selected!;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      final answer = await _service.answer(
        widget.category,
        question['id'],
        selected,
      );
      if (!mounted || revision != _revision || _exam == null) return;
      if (_expired) {
        _lock();
        return;
      }
      setState(() {
        _answers[question['id']] = {...answer, 'selectedOptionId': selected};
        _selected = null;
        if (_index + 1 == (_exam!['questions'] as List).length) {
          _finished = true;
        } else {
          _index++;
        }
      });
    } catch (error) {
      if (mounted && revision == _revision) {
        if (error is DioException && error.response?.statusCode == 403) {
          _lock();
        } else {
          setState(() => _error = 'common.load_error');
        }
      }
    } finally {
      if (mounted && revision == _revision) setState(() => _busy = false);
    }
  }

  String _localized(Map data, String field) {
    final language = _language!;
    return (data['$field${language[0].toUpperCase()}${language.substring(1)}'] ??
            data['${field}En'] ??
            '')
        .toString();
  }

  Future<bool> _confirmFinish() async {
    if (_exam == null || _finished) return true;
    final t = AppLocalizations.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(t.t('practice_exam.end_exam')),
        content: Text(t.t('exam.exit_message')),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: Text(t.t('common.cancel')),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: Text(t.t('practice_exam.end_exam')),
          ),
        ],
      ),
    );
    return confirmed == true;
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final questions = (_exam?['questions'] as List? ?? [])
        .map((q) => Map<String, dynamic>.from(q as Map))
        .toList();
    final total = questions.isNotEmpty
        ? questions.length
        : (_category?['questionCount'] as num?)?.toInt() ?? 0;
    final name = _category == null
        ? t.t('category_exam.title')
        : _localized(_category!, 'name');
    return PopScope(
      canPop: _exam == null || _finished,
      onPopInvokedWithResult: (didPop, result) async {
        if (!didPop && !_busy && await _confirmFinish() && context.mounted) {
          setState(() => _finished = true);
        }
      },
      child: Scaffold(
        appBar: const RijviaAppBar(),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : SingleChildScrollView(
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 1000),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          if (_error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 16),
                              child: Text(
                                t.t(_error!),
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          if (_paywall) ...[
                            RijviaPageHero(
                              title: name,
                              description: t.t('category_exam.questions', {
                                'count': total,
                              }),
                            ),
                            const SizedBox(height: 24),
                            FilledButton(
                              onPressed: () =>
                                  Navigator.pushNamed(context, '/plans'),
                              child: Text(t.t('exam.paywall.choose_plan')),
                            ),
                            TextButton(
                              onPressed: _load,
                              child: Text(t.t('common.retry')),
                            ),
                          ] else if (_exam == null || questions.isEmpty) ...[
                            RijviaPageHero(title: name),
                            Text(t.t(_error ?? 'category_exam.empty')),
                            TextButton(
                              onPressed: _load,
                              child: Text(t.t('common.retry')),
                            ),
                          ] else if (_finished) ...[
                            RijviaPageHero(
                              title: t.t('category_exam.completed'),
                              description:
                                  '${_answers.values.where((a) => a['isCorrect'] == true).length} / $total',
                              actions: [
                                FilledButton(
                                  onPressed: _load,
                                  child: Text(t.t('category_exam.restart')),
                                ),
                              ],
                            ),
                            for (final question in questions)
                              Padding(
                                padding: const EdgeInsets.only(top: 20),
                                child: _question(question, review: true),
                              ),
                          ] else ...[
                            Text(
                              '${_index + 1} / $total',
                              textAlign: TextAlign.end,
                            ),
                            const SizedBox(height: 12),
                            LinearProgressIndicator(value: _index / total),
                            const SizedBox(height: 20),
                            _question(questions[_index]),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: _busy || _selected == null
                                  ? null
                                  : _next,
                              child: Text(
                                t.t(
                                  _index + 1 == total
                                      ? 'category_exam.finish'
                                      : 'category_exam.next',
                                ),
                              ),
                            ),
                            if (_busy) const LinearProgressIndicator(),
                            const SizedBox(height: 20),
                            Wrap(
                              spacing: 12,
                              runSpacing: 12,
                              children: [
                                OutlinedButton(
                                  onPressed: _busy
                                      ? null
                                      : () async {
                                          if (await _confirmFinish() &&
                                              mounted) {
                                            setState(() => _finished = true);
                                          }
                                        },
                                  child: Text(t.t('practice_exam.end_exam')),
                                ),
                                OutlinedButton.icon(
                                  onPressed: () =>
                                      Navigator.pushNamed(context, '/contact'),
                                  icon: const Icon(Icons.flag_outlined),
                                  label: Text(
                                    t.t('practice_exam.report_question'),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _question(Map<String, dynamic> question, {bool review = false}) {
    final answer = _answers[question['id']];
    final options = (question['options'] as List)
        .map((o) => Map<String, dynamic>.from(o as Map))
        .toList();
    return RijviaFocusedQuestionCard(
      title: _localized(question, 'question'),
      media: question['contentImageUrl'] == null
          ? null
          : RijviaEducationalImage(
              url: question['contentImageUrl'],
              radius: 12,
              label: _localized(question, 'question'),
              maxHeight: MediaQuery.sizeOf(context).width >= 1024 ? 440 : 240,
            ),
      options: [
        for (var i = 0; i < options.length; i++)
          RijviaAnswerOption(
            index: i,
            text: _localized(options[i], 'optionText'),
            onSelect: _busy || review
                ? null
                : () => setState(() => _selected = options[i]['id']),
            state: review
                ? (options[i]['id'] == answer?['correctOptionId']
                      ? RijviaAnswerState.correct
                      : options[i]['id'] == answer?['selectedOptionId']
                      ? RijviaAnswerState.incorrect
                      : RijviaAnswerState.neutral)
                : (options[i]['id'] == _selected
                      ? RijviaAnswerState.selected
                      : RijviaAnswerState.idle),
          ),
      ],
      feedback: review && answer != null
          ? RijviaResultAnswerBlock(
              label: AppLocalizations.of(context).t('exam.results_explanation'),
              text: _localized(answer, 'explanation'),
              explanation: true,
            )
          : null,
    );
  }
}
