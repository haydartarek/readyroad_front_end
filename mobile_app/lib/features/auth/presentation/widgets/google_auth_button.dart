import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/localization/app_localizations.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';

class GoogleAuthButton extends StatelessWidget {
  final bool registration;
  const GoogleAuthButton({super.key, this.registration = false});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        return OutlinedButton.icon(
          key: const ValueKey('google-auth-button'),
          onPressed: state is AuthLoading
              ? null
              : () {
                  FocusScope.of(context).unfocus();
                  context.read<AuthBloc>().add(
                    GoogleSignInEvent(l10n.locale.languageCode),
                  );
                },
          style: OutlinedButton.styleFrom(
            minimumSize: const Size.fromHeight(48),
          ),
          icon: const ExcludeSemantics(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CustomPaint(painter: _GoogleMark()),
            ),
          ),
          label: Text(l10n.t('auth.continue_with_google')),
        );
      },
    );
  }
}

/// The same four Google logo paths used by Rijvia Web; no network image needed.
class _GoogleMark extends CustomPainter {
  const _GoogleMark();
  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 24, size.height / 24);
    final blue = Path()
      ..moveTo(21.805, 10.023)
      ..relativeLineTo(-9.76, 0)
      ..relativeLineTo(0, 3.955)
      ..relativeLineTo(5.594, 0)
      ..relativeCubicTo(-.241, 1.271, -.965, 2.348, -2.058, 3.069)
      ..relativeLineTo(0, 2.545)
      ..relativeLineTo(3.327, 0)
      ..relativeCubicTo(1.948, -1.793, 3.067, -4.438, 2.897, -7.57)
      ..close();
    final green = Path()
      ..moveTo(12.045, 22)
      ..relativeCubicTo(2.79, 0, 5.132, -.924, 6.843, -2.5)
      ..relativeLineTo(-3.327, -2.545)
      ..relativeCubicTo(-.924, .62, -2.105, .986, -3.516, .986)
      ..relativeCubicTo(-2.699, 0, -4.986, -1.821, -5.804, -4.268)
      ..lineTo(2.81, 13.673)
      ..relativeLineTo(0, 2.626)
      ..arcToPoint(
        const Offset(12.045, 22),
        radius: const Radius.circular(10.33),
        clockwise: false,
      )
      ..close();
    final yellow = Path()
      ..moveTo(6.241, 13.673)
      ..arcToPoint(
        const Offset(6.241, 9.727),
        radius: const Radius.circular(6.204),
      )
      ..lineTo(6.241, 7.1)
      ..lineTo(2.81, 7.1)
      ..arcToPoint(
        const Offset(2.81, 16.3),
        radius: const Radius.circular(10.328),
        clockwise: false,
      )
      ..relativeLineTo(3.431, -2.627)
      ..close();
    final red = Path()
      ..moveTo(12.045, 5.455)
      ..relativeCubicTo(1.518, 0, 2.882, .522, 3.955, 1.546)
      ..relativeLineTo(2.967, -2.967)
      ..cubicTo(17.171, 2.362, 14.828, 1.4, 12.045, 1.4)
      ..arcToPoint(
        const Offset(2.81, 7.1),
        radius: const Radius.circular(10.33),
        clockwise: false,
      )
      ..relativeLineTo(3.431, 2.627)
      ..relativeCubicTo(.818, -2.448, 3.105, -4.272, 5.804, -4.272)
      ..close();
    for (final entry in <Path, Color>{
      blue: const Color(0xff4285f4),
      green: const Color(0xff34a853),
      yellow: const Color(0xfffbbc04),
      red: const Color(0xffea4335),
    }.entries) {
      canvas.drawPath(entry.key, Paint()..color = entry.value);
    }
    canvas.restore();
  }

  @override
  bool shouldRepaint(_GoogleMark oldDelegate) => false;
}
