import '../domain/entities/session_validation_failure.dart';

/// Small feature-owned translation set for auth recovery states.
/// These messages are intentionally available before network/localizations load.
class AuthSessionMessages {
  static const _text = <String, Map<String, String>>{
    'ar': {
      'offline':
          'الاتصال غير متاح. بقي تسجيل دخولك محفوظًا، لكن البيانات تحتاج تحديثًا عند عودة الاتصال.',
      'server':
          'الخادم غير متاح مؤقتًا. بقي تسجيل دخولك محفوظًا. حاول التحقق مرة أخرى.',
      'forbidden':
          'الخادم منع الوصول إلى بيانات الحساب (403). لم نلغِ تسجيل دخولك؛ حاول مجددًا.',
      'unexpected':
          'تعذّر التحقق من الحساب الآن. لم يتم حذف بيانات تسجيل الدخول.',
      'retry': 'إعادة المحاولة',
    },
    'nl': {
      'offline':
          'Geen verbinding. Je aanmelding is bewaard, maar gegevens moeten opnieuw worden gecontroleerd.',
      'server':
          'De server is tijdelijk niet bereikbaar. Je aanmelding is bewaard. Probeer opnieuw.',
      'forbidden':
          'De server weigert toegang tot accountgegevens (403). Je bent niet uitgelogd. Probeer opnieuw.',
      'unexpected':
          'Je account kan momenteel niet worden gecontroleerd. Je aanmelding is bewaard.',
      'retry': 'Opnieuw proberen',
    },
    'fr': {
      'offline':
          'Connexion indisponible. Votre session est conservée, mais les données doivent être vérifiées à nouveau.',
      'server':
          'Serveur temporairement indisponible. Votre session est conservée. Réessayez.',
      'forbidden':
          'Le serveur refuse les données du compte (403). Votre session est conservée. Réessayez.',
      'unexpected':
          'Impossible de vérifier le compte pour le moment. Votre session est conservée.',
      'retry': 'Réessayer',
    },
    'en': {
      'offline':
          'Connection unavailable. Your session is saved, but data needs revalidation when online.',
      'server':
          'Server temporarily unavailable. Your session is saved. Try again.',
      'forbidden':
          'Server denied access to account data (403). Your session was not deleted. Try again.',
      'unexpected':
          'Account validation is currently unavailable. Your saved session was not deleted.',
      'retry': 'Retry',
    },
  };

  static String issue(SessionValidationIssue issue, String language) {
    final key = switch (issue) {
      SessionValidationIssue.offline => 'offline',
      SessionValidationIssue.serverUnavailable => 'server',
      SessionValidationIssue.forbidden => 'forbidden',
      SessionValidationIssue.unexpected => 'unexpected',
    };
    return (_text[language] ?? _text['en']!)[key]!;
  }

  static String retry(String language) =>
      (_text[language] ?? _text['en']!)['retry']!;
}
