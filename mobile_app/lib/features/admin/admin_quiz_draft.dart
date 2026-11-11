/// Matches web/lib/admin-quiz-form.ts and its optimistic version contract.
class AdminQuizDraft {
  AdminQuizDraft.newQuestion()
    : fields = {
        'categoryCode': '',
        'difficultyLevel': 'EASY',
        'contentImageUrl': '',
        'isActive': true,
        for (final suffix in suffixes) ...{
          'question$suffix': '',
          'explanation$suffix': '',
        },
      },
      options = [blankOption(1), blankOption(2)],
      referenced = false;
  AdminQuizDraft.fromJson(Map<String, dynamic> data)
    : fields = {...data}..remove('options'),
      options =
          (data['options'] as List)
              .map((o) => Map<String, dynamic>.from(o as Map))
              .toList()
            ..sort(
              (a, b) => (a['displayOrder'] as num).compareTo(
                b['displayOrder'] as num,
              ),
            ),
      referenced = data['isReferenced'] == true;
  static const suffixes = ['En', 'Ar', 'Nl', 'Fr'];
  static const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  final Map<String, dynamic> fields;
  final List<Map<String, dynamic>> options;
  final bool referenced;
  static Map<String, dynamic> blankOption(int order) => {
    'displayOrder': order,
    'isCorrect': false,
    for (final suffix in suffixes) 'text$suffix': '',
  };

  Map<String, String> validate(Set<String> categories) {
    final errors = <String, String>{};
    if (!categories.contains(fields['categoryCode']?.toString().trim())) {
      errors['categoryCode'] = 'error_category';
    }
    if (!difficulties.contains(fields['difficultyLevel'])) {
      errors['difficultyLevel'] = 'error_difficulty';
    }
    if (options.length < 2 || options.length > 3) {
      errors['options'] = options.length < 2
          ? 'error_min_options'
          : 'error_max_options';
    }
    if (options.where((o) => o['isCorrect'] == true).length != 1) {
      errors['correct'] = 'error_exactly_one_correct';
    }
    for (final suffix in suffixes) {
      if ((fields['question$suffix']?.toString().trim() ?? '').isEmpty) {
        errors['question$suffix'] = 'error_question_all_languages';
      }
      final seen = <String, int>{};
      for (var index = 0; index < options.length; index++) {
        final value = options[index]['text$suffix']?.toString().trim() ?? '';
        final normalized = value.replaceAll(RegExp(r'\s+'), ' ').toLowerCase();
        if (value.isEmpty) {
          errors['option_$index'] = 'error_option_all_languages';
        } else if (RegExp(
              r'^(option|optie)\s+[a-z]$',
              caseSensitive: false,
            ).hasMatch(value) ||
            RegExp(r'\?{2,}').hasMatch(value)) {
          errors['option_$index'] = 'error_option_placeholder';
        } else if (seen.containsKey(normalized)) {
          errors['option_$index'] = 'error_option_duplicate';
          errors['option_${seen[normalized]}'] = 'error_option_duplicate';
        }
        seen[normalized] = index;
      }
    }
    final image = fields['contentImageUrl']?.toString().trim() ?? '';
    if (image.isNotEmpty &&
        !RegExp(
          r'^/images/quiz/[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp)$',
          caseSensitive: false,
        ).hasMatch(image)) {
      final url = Uri.tryParse(image);
      if (url == null ||
          url.scheme != 'https' ||
          url.host.isEmpty ||
          url.userInfo.isNotEmpty) {
        errors['contentImageUrl'] = 'error_image_reference';
      }
    }
    return errors;
  }

  void selectCorrect(int index) {
    for (var i = 0; i < options.length; i++) {
      options[i]['isCorrect'] = index == i;
    }
  }

  void move(int index, int delta) {
    final target = index + delta;
    if (target < 0 || target >= options.length) return;
    final option = options.removeAt(index);
    options.insert(target, option);
    _order();
  }

  void addOption() {
    if (options.length < 3) options.add(blankOption(options.length + 1));
  }

  void removeOption(int index) {
    if (options.length > 2) {
      options.removeAt(index);
      _order();
    }
  }

  void _order() {
    for (var i = 0; i < options.length; i++) {
      options[i]['displayOrder'] = i + 1;
    }
  }

  Map<String, dynamic> payload({required bool editing}) => {
    if (editing) 'version': fields['version'],
    'categoryCode': fields['categoryCode'].toString().trim(),
    'difficultyLevel': fields['difficultyLevel'],
    for (final suffix in suffixes) ...{
      'question$suffix': fields['question$suffix']?.toString().trim() ?? '',
      'explanation$suffix':
          fields['explanation$suffix']?.toString().trim() ?? '',
    },
    'contentImageUrl':
        (fields['contentImageUrl']?.toString().trim().isEmpty ?? true)
        ? null
        : fields['contentImageUrl'].toString().trim(),
    'isActive': fields['isActive'] == true,
    'options': [
      for (final option in options)
        {
          if (editing) 'id': option['id'],
          for (final suffix in suffixes)
            'text$suffix': option['text$suffix']?.toString().trim() ?? '',
          'isCorrect': option['isCorrect'] == true,
          'displayOrder': option['displayOrder'],
        },
    ],
  };
}
