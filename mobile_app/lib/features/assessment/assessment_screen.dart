import '../../design_system/widgets/rijvia_focused_question_card.dart';
import '../../design_system/widgets/rijvia_result_answer_block.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/authenticated_api_client.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_answer_option.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';

class AssessmentService {
  AssessmentService(this.api);
  final AuthenticatedApiClient api;
  Future<dynamic> load(
    String language, {
    String? category,
    String? level,
  }) async {
    final base =
        '/api/assessment/categories${category == null ? '' : '/${Uri.encodeComponent(category)}'}';
    final response = await api.get(
      level == null ? base : '$base/questions',
      queryParameters: {
        'lang': language,
        if (level != null) ...{'level': level.toUpperCase(), 'limit': 9},
      },
    );
    return response.data;
  }

  Future<Map<String, dynamic>> check(int question, int choice) async {
    final response = await api.post(
      '/api/assessment/questions/$question/check',
      data: {'choiceId': choice},
    );
    return Map<String, dynamic>.from(response.data);
  }
}

class AssessmentScreen extends StatefulWidget {
  const AssessmentScreen({super.key, this.category, this.level, this.service});
  final String? category;
  final String? level;
  final AssessmentService? service;
  @override
  State<AssessmentScreen> createState() => _AssessmentScreenState();
}

class _AssessmentScreenState extends State<AssessmentScreen> {
  late final _service =
      widget.service ?? AssessmentService(getIt<AuthenticatedApiClient>());
  dynamic _data;
  Object? _error;
  String? _language;
  int _revision = 0;
  int _index = 0;
  bool _checking = false;
  bool _finished = false;
  final Map<int, Map<String, dynamic>> _answers = {};
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final language = context.watch<LanguageProvider>().currentLanguage;
    if (_language != language) {
      _language = language;
      _load();
    }
  }

  Future<void> _load() async {
    final revision = ++_revision;
    setState(() {
      _data = null;
      _error = null;
      _answers.clear();
      _index = 0;
      _finished = false;
      _checking = false;
    });
    try {
      final data = await _service.load(
        _language!,
        category: widget.category,
        level: widget.level,
      );
      if (mounted && revision == _revision) setState(() => _data = data);
    } catch (error) {
      if (mounted && revision == _revision) setState(() => _error = error);
    }
  }

  Future<void> _answer(Map<String, dynamic> question, int choice) async {
    final id = question['id'] as int;
    if (_checking || _answers.containsKey(id)) return;
    final revision = _revision;
    setState(() => _checking = true);
    try {
      final check = await _service.check(id, choice);
      if (mounted && revision == _revision) {
        setState(() => _answers[id] = {...check, 'selectedId': choice});
      }
    } catch (error) {
      if (mounted && revision == _revision) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context).t('common.error_desc')),
          ),
        );
      }
    } finally {
      if (mounted && revision == _revision) setState(() => _checking = false);
    }
  }

  void _go(String path) => Navigator.pushNamed(context, path);
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    Widget body;
    if (_error != null) {
      body = Column(
        children: [
          Text(
            t.t(
              AuthenticatedApiClient.isServiceUnavailable(_error!)
                  ? 'common.service_unavailable'
                  : 'common.error_desc',
            ),
          ),
          TextButton(onPressed: _load, child: Text(t.t('common.retry'))),
        ],
      );
    } else if (_data == null) {
      body = const Center(child: CircularProgressIndicator());
    } else if (widget.level != null) {
      body = _quiz(t);
    } else if (widget.category != null) {
      body = _levels(t, Map<String, dynamic>.from(_data));
    } else {
      final categories = (_data as List)
          .map((v) => Map<String, dynamic>.from(v as Map))
          .toList();
      body = Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RijviaPageHero(
            title: t.t('assessment.title'),
            description: t.t('assessment.subtitle'),
          ),
          const SizedBox(height: 24),
          if (categories.isEmpty) Text(t.t('assessment.no_categories')),
          LayoutBuilder(
            builder: (context, box) {
              final columns = box.maxWidth >= 1000
                  ? 3
                  : box.maxWidth >= 650
                  ? 2
                  : 1;
              return Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  for (final category in categories)
                    SizedBox(
                      width: (box.maxWidth - 16 * (columns - 1)) / columns,
                      child: Card(
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => _go(
                            '/assessment/${Uri.encodeComponent(category['slug'])}',
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  category['name'],
                                  style: Theme.of(context).textTheme.titleLarge,
                                ),
                                if (category['description'] != null)
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 12,
                                    ),
                                    child: Text(category['description']),
                                  ),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: [
                                    Chip(
                                      label: Text(
                                        t.t('assessment.badge_minutes', {
                                          'count': category['timeLimitMinutes'],
                                        }),
                                      ),
                                    ),
                                    Chip(
                                      label: Text(
                                        t.t('assessment.badge_pass', {
                                          'count':
                                              category['passingScorePercent'],
                                        }),
                                      ),
                                    ),
                                    Chip(
                                      label: Text(
                                        t.t('assessment.badge_levels', {
                                          'count':
                                              (category['difficulties'] as List)
                                                  .length,
                                        }),
                                      ),
                                    ),
                                  ],
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
          ),
        ],
      );
    }
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: widget.level == null ? 1280 : 720,
            ),
            child: Padding(padding: const EdgeInsets.all(16), child: body),
          ),
        ),
      ),
    );
  }

  Widget _levels(AppLocalizations t, Map<String, dynamic> category) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      RijviaPageHero(
        title: category['name'],
        description: category['description'],
        actions: [
          TextButton(
            onPressed: () => _go('/assessment'),
            child: Text(t.t('assessment.back_to_categories')),
          ),
        ],
      ),
      const SizedBox(height: 24),
      Text(t.t('assessment.choose_level')),
      for (final level in category['difficulties'] as List)
        Padding(
          padding: const EdgeInsets.only(top: 16),
          child: Card(
            child: ListTile(
              contentPadding: const EdgeInsets.all(24),
              leading: const Icon(Icons.school_outlined),
              title: Text(
                t.t('assessment.level.${level.toString().toLowerCase()}'),
              ),
              subtitle: Text(
                t.t('assessment.level.${level.toString().toLowerCase()}_desc'),
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => _go(
                '/assessment/${Uri.encodeComponent(widget.category!)}/${level.toString().toLowerCase()}',
              ),
            ),
          ),
        ),
    ],
  );
  Widget _quiz(AppLocalizations t) {
    final questions = (_data as List)
        .map((v) => Map<String, dynamic>.from(v as Map))
        .toList();
    if (questions.isEmpty) {
      return Column(
        children: [
          Text(t.t('exam.no_questions')),
          TextButton(onPressed: _load, child: Text(t.t('common.retry'))),
        ],
      );
    }
    if (_finished) {
      final correct = _answers.values.where((a) => a['correct'] == true).length;
      final percent = (correct / questions.length * 100).round();
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          RijviaPageHero(
            title: '$percent%',
            description:
                '$correct/${questions.length} ${t.t('assessment.result.correct')}',
            eyebrow: t.t(
              percent >= 70
                  ? 'assessment.result.passed'
                  : 'assessment.result.failed',
            ),
          ),
          const SizedBox(height: 24),
          for (final question in questions) ...[
            _question(t, question, review: true),
            const SizedBox(height: 16),
          ],
          FilledButton(
            onPressed: _load,
            child: Text(t.t('assessment.result.retry')),
          ),
          TextButton(
            onPressed: () =>
                _go('/assessment/${Uri.encodeComponent(widget.category!)}'),
            child: Text(t.t('assessment.back_to_levels')),
          ),
          TextButton(
            onPressed: () => _go('/assessment'),
            child: Text(t.t('assessment.back_to_categories')),
          ),
        ],
      );
    }
    final question = questions[_index];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('${_index + 1}/${questions.length}', textAlign: TextAlign.end),
        const SizedBox(height: 8),
        LinearProgressIndicator(value: (_index + 1) / questions.length),
        const SizedBox(height: 24),
        _question(t, question),
        if (_answers.containsKey(question['id'])) ...[
          const SizedBox(height: 24),
          FilledButton(
            onPressed: () => setState(() {
              if (_index + 1 == questions.length) {
                _finished = true;
              } else {
                _index++;
              }
            }),
            child: Text(
              t.t(
                _index + 1 == questions.length
                    ? 'assessment.see_results'
                    : 'assessment.next_question',
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _question(
    AppLocalizations t,
    Map<String, dynamic> question, {
    bool review = false,
  }) {
    final answer = _answers[question['id']];
    final choices = (question['choices'] as List)
        .map((v) => Map<String, dynamic>.from(v as Map))
        .toList();
    return RijviaFocusedQuestionCard(
      title: question['question'],
      options: [
        for (var i = 0; i < choices.length; i++)
          RijviaAnswerOption(
            index: i,
            text: choices[i]['text'],
            onSelect: review || _checking || answer != null
                ? null
                : () => _answer(question, choices[i]['id']),
            state: answer == null
                ? RijviaAnswerState.idle
                : answer['correctChoiceId'] == choices[i]['id']
                ? RijviaAnswerState.correct
                : answer['selectedId'] == choices[i]['id']
                ? RijviaAnswerState.incorrect
                : RijviaAnswerState.neutral,
          ),
      ],
      feedback: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_checking && !review) const LinearProgressIndicator(),
          if (answer != null && question['explanation'] != null)
            RijviaResultAnswerBlock(
              label: t.t('assessment.explanation'),
              text: question['explanation'],
              explanation: true,
            ),
        ],
      ),
    );
  }
}
