import '../widgets/rijvia_auth_field.dart';
import '../widgets/rijvia_auth_frame.dart';
import '../../../../design_system/widgets/rijvia_content.dart';
import 'package:flutter/material.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../data/services/auth_recovery_service.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String? token;

  const ResetPasswordScreen({super.key, this.token});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _success = false;
  String? _error;

  @override
  void dispose() {
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _submit(AppLocalizations l10n) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await getIt<AuthRecoveryService>().resetPassword(
        widget.token!.trim(),
        _password.text,
      );
      if (!mounted) return;
      setState(() => _success = true);
    } catch (error) {
      if (!mounted) return;
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      body: RijviaAuthFrame(
        page: "reset",
        title: l10n.t(
          widget.token?.trim().isNotEmpty != true
              ? 'auth.reset_password_invalid_token'
              : _success
              ? 'auth.reset_password_success_title'
              : 'auth.reset_password_title',
        ),
        child: RijviaScrollFrame(
          maxWidth: 520,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _success
                  ? _MessageView(
                      message: l10n.authResetPasswordSuccess,
                      action: l10n.authBackToLogin,
                      onPressed: () =>
                          Navigator.pushReplacementNamed(context, '/login'),
                    )
                  : widget.token?.trim().isNotEmpty != true
                  ? _MessageView(
                      message: l10n.t('auth.reset_password_invalid_token'),
                      action: l10n.t('auth.forgot_password_back'),
                      icon: Icons.link_off,
                      onPressed: () => Navigator.pushReplacementNamed(
                        context,
                        '/forgot-password',
                      ),
                    )
                  : Form(
                      key: _formKey,
                      child: ListView(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          if (_error != null)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Text(
                                _error!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          _field(
                            controller: _password,
                            label: l10n.authResetPasswordNew,
                            obscureText: true,
                            validator: (value) =>
                                value == null || value.length < 8
                                ? l10n.authValidationPasswordShort
                                : null,
                          ),
                          const SizedBox(height: 16),
                          _field(
                            controller: _confirm,
                            label: l10n.authResetPasswordConfirm,
                            obscureText: true,
                            validator: (value) => value != _password.text
                                ? l10n.authValidationPasswordMismatch
                                : null,
                          ),
                          const SizedBox(height: 20),
                          FilledButton(
                            onPressed: _loading ? null : () => _submit(l10n),
                            child: _loading
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Text(l10n.authResetPasswordSubmit),
                          ),
                        ],
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required String? Function(String?) validator,
    bool obscureText = false,
  }) {
    return RijviaAuthField(
      label: label,
      child: TextFormField(
        controller: controller,
        obscureText: obscureText,
        validator: validator,
        decoration: const InputDecoration(),
      ),
    );
  }
}

class _MessageView extends StatelessWidget {
  final String message;
  final String action;
  final VoidCallback onPressed;
  final IconData icon;

  const _MessageView({
    required this.message,
    required this.action,
    required this.onPressed,
    this.icon = Icons.check_circle_outline,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 72),
          const SizedBox(height: 20),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton(onPressed: onPressed, child: Text(action)),
        ],
      ),
    );
  }
}
