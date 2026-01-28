import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// AppLocalizations - Centralized translation system
/// Loads JSON translations and provides typed access to strings
class AppLocalizations {
  final Locale locale;
  late Map<String, String> _localizedStrings;

  AppLocalizations(this.locale);

  /// Get the current instance from context
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  /// Load JSON translation file for the given locale
  Future<bool> load() async {
    String jsonString = await rootBundle.loadString(
      'lib/l10n/${locale.languageCode}.json',
    );
    Map<String, dynamic> jsonMap = json.decode(jsonString);

    _localizedStrings = jsonMap.map((key, value) {
      return MapEntry(key, value.toString());
    });

    return true;
  }

  /// Get translation for a key, with fallback to the key itself
  String translate(String key) {
    return _localizedStrings[key] ?? key;
  }

  /// Shorthand for translate
  String t(String key) => translate(key);

  // ========== APP ==========
  String get appName => translate('app.name');
  String get appTagline => translate('app.tagline');

  // ========== NAVIGATION ==========
  String get navHome => translate('nav.home');
  String get navDashboard => translate('nav.dashboard');
  String get navExam => translate('nav.exam');
  String get navPractice => translate('nav.practice');
  String get navAnalytics => translate('nav.analytics');
  String get navProgress => translate('nav.progress');
  String get navProfile => translate('nav.profile');
  String get navTrafficSigns => translate('nav.traffic_signs');
  String get navLessons => translate('nav.lessons');
  String get navLanguage => translate('nav.language');
  String get navMore => translate('nav.more');
  String get navSearch => translate('nav.search');

  // ========== AUTH ==========
  String get authLogin => translate('auth.login');
  String get authRegister => translate('auth.register');
  String get authLogout => translate('auth.logout');
  String get authEmail => translate('auth.email');
  String get authUsername => translate('auth.username');
  String get authPassword => translate('auth.password');
  String get authConfirmPassword => translate('auth.confirm_password');
  String get authFirstName => translate('auth.first_name');
  String get authLastName => translate('auth.last_name');
  String get authRememberMe => translate('auth.remember_me');
  String get authForgotPassword => translate('auth.forgot_password');
  String get authNoAccount => translate('auth.no_account');
  String get authHaveAccount => translate('auth.have_account');
  String get authSignIn => translate('auth.sign_in');
  String get authSignUp => translate('auth.sign_up');

  // ========== EXAM ==========
  String get examStart => translate('exam.start');
  String get examRules => translate('exam.rules');
  String get examRulesTitle => translate('exam.rules.title');
  String get examRulesSubtitle => translate('exam.rules.subtitle');
  String get examRulesExamRules => translate('exam.rules.examRules');
  String get examRulesDescription => translate('exam.rules.description');
  String get examRulesTotalQuestions => translate('exam.rules.totalQuestions');
  String get examRulesTimeLimit => translate('exam.rules.timeLimit');
  String get examRulesPassScore => translate('exam.rules.passScore');
  String get examRulesNavigation => translate('exam.rules.navigation');
  String get examRulesSubmission => translate('exam.rules.submission');
  String get examRulesAutoSubmit => translate('exam.rules.autoSubmit');
  String get examTotalQuestions => translate('exam.total_questions');
  String get examDuration => translate('exam.duration');
  String get examPassScore => translate('exam.pass_score');
  String get examSubmit => translate('exam.submit');
  String get examOverview => translate('exam.overview');
  String get examTimeRemaining => translate('exam.time_remaining');
  String get examQuestion => translate('exam.question');
  String get examOf => translate('exam.of');
  String get examAnswered => translate('exam.answered');
  String get examUnanswered => translate('exam.unanswered');
  String get examPrevious => translate('exam.previous');
  String get examNext => translate('exam.next');
  String get examResults => translate('exam.results');
  String get examPassed => translate('exam.passed');
  String get examFailed => translate('exam.failed');
  String get examScore => translate('exam.score');
  String get examCorrectAnswers => translate('exam.correct_answers');

  // ========== PRACTICE ==========
  String get practiceTitle => translate('practice.title');
  String get practiceSubtitle => translate('practice.subtitle');
  String get practiceStart => translate('practice.start');
  String get practiceSelectCategory => translate('practice.select_category');
  String get practiceSelectDifficulty =>
      translate('practice.select_difficulty');
  String get practiceEasy => translate('practice.easy');
  String get practiceMedium => translate('practice.medium');
  String get practiceHard => translate('practice.hard');

  // ========== ANALYTICS ==========
  String get analyticsErrorPatterns => translate('analytics.error_patterns');
  String get analyticsWeakAreas => translate('analytics.weak_areas');
  String get analyticsStrongAreas => translate('analytics.strong_areas');
  String get analyticsRecommendations => translate('analytics.recommendations');

  // ========== PROGRESS ==========
  String get progressOverview => translate('progress.overview');
  String get progressExamsTaken => translate('progress.exams_taken');
  String get progressAverageScore => translate('progress.average_score');
  String get progressPassRate => translate('progress.pass_rate');
  String get progressCurrentStreak => translate('progress.current_streak');

  // ========== COMMON ==========
  String get commonLoading => translate('common.loading');
  String get commonSave => translate('common.save');
  String get commonCancel => translate('common.cancel');
  String get commonConfirm => translate('common.confirm');
  String get commonDelete => translate('common.delete');
  String get commonEdit => translate('common.edit');
  String get commonView => translate('common.view');
  String get commonClose => translate('common.close');
  String get commonSearch => translate('common.search');
  String get commonFilter => translate('common.filter');
  String get commonSort => translate('common.sort');
  String get commonActions => translate('common.actions');

  // ========== DELEGATE ==========
  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// Supported locales (EN, AR, NL, FR)
  static const List<Locale> supportedLocales = [
    Locale('en'),
    Locale('ar'),
    Locale('nl'),
    Locale('fr'),
  ];
}

/// Delegate for loading AppLocalizations
class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) {
    return ['en', 'ar', 'nl', 'fr'].contains(locale.languageCode);
  }

  @override
  Future<AppLocalizations> load(Locale locale) async {
    AppLocalizations localizations = AppLocalizations(locale);
    await localizations.load();
    return localizations;
  }

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
