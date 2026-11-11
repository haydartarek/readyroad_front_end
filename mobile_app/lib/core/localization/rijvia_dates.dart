import 'package:intl/intl.dart' show DateFormat;
import 'package:timezone/data/latest.dart' as data;
import 'package:timezone/timezone.dart' as tz;

/// Expiry dates use the web contract's Europe/Brussels zone on every device.
abstract final class RijviaDates {
  static final tz.Location _brussels = _initialize();
  static tz.Location _initialize() {
    data.initializeTimeZones();
    return tz.getLocation('Europe/Brussels');
  }

  static DateTime brussels(DateTime value) =>
      tz.TZDateTime.from(value, _brussels);
  static String expiry(Object? value, String language, {bool long = false}) {
    final parsed = value is DateTime
        ? value
        : DateTime.tryParse(value?.toString() ?? '');
    if (parsed == null) return '—';
    return (long ? DateFormat.yMMMMd(language) : DateFormat.yMMMd(language))
        .add_Hm()
        .format(brussels(parsed));
  }
}
