import '../widgets/rijvia_auth_field.dart';
import '../../../../core/navigation/web_route_registry.dart';
import '../widgets/rijvia_auth_frame.dart';
import '../../../../design_system/widgets/rijvia_content.dart';
import 'package:flutter/material.dart';
import '../../../../core/di/service_locator.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../data/services/auth_recovery_service.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit(AppLocalizations l10n) async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await getIt<AuthRecoveryService>().requestReset(_email.text.trim());
      if (!mounted) return;
      setState(() => _sent = true);
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
        page: "forgot",
        title: AppLocalizations.of(context).authForgotPasswordTitle,
        child: RijviaScrollFrame(
          maxWidth: 520,
          child: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: _sent
                  ? _MessageView(
                      message: l10n.authForgotPasswordSent,
                      action: l10n.authBackToLogin,
                      onPressed: () => Navigator.pushReplacementNamed(
                        context,
                        WebRouteRegistry.authDestination(
                          ModalRoute.of(context)?.settings.name,
                          '/login',
                        ),
                      ),
                    )
                  : Form(
                      key: _formKey,
                      child: ListView(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        children: [
                          Text(l10n.authForgotPasswordDescription),
                          const SizedBox(height: 20),
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
                          RijviaAuthField(
                            label: l10n.authEmail,
                            child: TextFormField(
                              controller: _email,
                              keyboardType: TextInputType.emailAddress,
                              textDirection: TextDirection.ltr,
                              validator: (value) {
                                if (value == null || value.trim().isEmpty) {
                                  return l10n.authValidationRequired;
                                }
                                return RegExp(
                                      r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                                    ).hasMatch(value.trim())
                                    ? null
                                    : l10n.authValidationEmailInvalid;
                              },
                            ),
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
                                : Text(l10n.authForgotPasswordSubmit),
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
}

class _MessageView extends StatelessWidget {
  final String message;
  final String action;
  final VoidCallback onPressed;

  const _MessageView({
    required this.message,
    required this.action,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.mark_email_read_outlined, size: 72),
          const SizedBox(height: 20),
          Text(message, textAlign: TextAlign.center),
          const SizedBox(height: 20),
          FilledButton(onPressed: onPressed, child: Text(action)),
        ],
      ),
    );
  }
}
