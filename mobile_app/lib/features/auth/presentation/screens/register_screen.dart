import '../widgets/rijvia_auth_field.dart';
import '../../../../core/navigation/web_route_registry.dart';
import '../widgets/rijvia_auth_frame.dart';
import '../../../../design_system/widgets/rijvia_content.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/localization/app_localizations.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/google_auth_button.dart';
import '../../../../shared/widgets/rijvia_legal_links.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key, this.onAuthenticated});
  final VoidCallback? onAuthenticated;

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _username = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    for (final controller in [
      _firstName,
      _lastName,
      _username,
      _email,
      _password,
      _confirmPassword,
    ]) {
      controller.dispose();
    }
    super.dispose();
  }

  String? _required(String? value, AppLocalizations l10n) {
    return value == null || value.trim().isEmpty
        ? l10n.authValidationRequired
        : null;
  }

  String? _validatePassword(String? value, AppLocalizations l10n) {
    if (value == null || value.isEmpty) return l10n.authValidationRequired;
    if (value.length < 8) return l10n.authValidationPasswordShort;
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return l10n.t('auth.validation.password_upper');
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return l10n.t('auth.validation.password_lower');
    }
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return l10n.t('auth.validation.password_number');
    }
    if (!RegExp(r'[^a-zA-Z0-9]').hasMatch(value)) {
      return l10n.t('auth.validation.password_special');
    }
    return null;
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    context.read<AuthBloc>().add(
      RegisterEvent(
        username: _username.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        name: '${_firstName.text.trim()} ${_lastName.text.trim()}',
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      body: RijviaAuthFrame(
        page: "register",
        title: l10n.t('auth.register_title'),
        child: RijviaScrollFrame(
          maxWidth: 520,
          child: BlocConsumer<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is Authenticated) {
                if (widget.onAuthenticated != null) {
                  widget.onAuthenticated!();
                } else {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              }
              if (state is AuthError && state.messageKey == null) {
                ScaffoldMessenger.of(
                  context,
                ).showSnackBar(SnackBar(content: Text(state.message)));
              }
            },
            builder: (context, state) {
              final loading = state is AuthLoading;
              return SafeArea(
                child: Form(
                  key: _formKey,
                  child: ListView(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 24,
                      vertical: 24,
                    ),
                    children: [
                      Text(
                        l10n.t('auth.register_subtitle'),
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 20),
                      _field(
                        controller: _firstName,
                        label: l10n.authFirstName,
                        validator: (value) => _required(value, l10n),
                      ),
                      const SizedBox(height: 16),
                      _field(
                        controller: _lastName,
                        label: l10n.authLastName,
                        validator: (value) => _required(value, l10n),
                      ),
                      const SizedBox(height: 16),
                      _field(
                        controller: _username,
                        label: l10n.authUsername,
                        validator: (value) {
                          final required = _required(value, l10n);
                          if (required != null) return required;
                          if (value!.length < 4 || value.length > 20) {
                            return l10n.authValidationUsernameLength;
                          }
                          if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                            return l10n.authValidationUsernameChars;
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      _field(
                        controller: _email,
                        label: l10n.authEmail,
                        keyboardType: TextInputType.emailAddress,
                        validator: (value) {
                          final required = _required(value, l10n);
                          if (required != null) return required;
                          return RegExp(
                                r'^[^@\s]+@[^@\s]+\.[^@\s]+$',
                              ).hasMatch(value!.trim())
                              ? null
                              : l10n.authValidationEmailInvalid;
                        },
                      ),
                      const SizedBox(height: 16),
                      _field(
                        controller: _password,
                        label: l10n.authPassword,
                        obscureText: _obscurePassword,
                        validator: (value) => _validatePassword(value, l10n),
                        suffix: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility
                                : Icons.visibility_off,
                          ),
                          onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      _field(
                        controller: _confirmPassword,
                        label: l10n.authConfirmPassword,
                        obscureText: _obscureConfirm,
                        validator: (value) {
                          final required = _required(value, l10n);
                          if (required != null) return required;
                          return value == _password.text
                              ? null
                              : l10n.authValidationPasswordMismatch;
                        },
                        suffix: IconButton(
                          icon: Icon(
                            _obscureConfirm
                                ? Icons.visibility
                                : Icons.visibility_off,
                          ),
                          onPressed: () => setState(
                            () => _obscureConfirm = !_obscureConfirm,
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),
                      FilledButton(
                        onPressed: loading ? null : _submit,
                        child: loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(l10n.authRegistrationSubmit),
                      ),
                      TextButton(
                        onPressed: loading
                            ? null
                            : () => Navigator.pushReplacementNamed(
                                context,
                                WebRouteRegistry.authDestination(
                                  ModalRoute.of(context)?.settings.name,
                                  '/login',
                                ),
                              ),
                        child: Text(l10n.authBackToLogin),
                      ),
                      const SizedBox(height: 8),
                      const GoogleAuthButton(registration: true),
                      const SizedBox(height: 16),
                      const RijviaLegalLinks(),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _field({
    required TextEditingController controller,
    required String label,
    required String? Function(String?) validator,
    TextInputType? keyboardType,
    bool obscureText = false,
    Widget? suffix,
  }) {
    return RijviaAuthField(
      label: label,
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        textDirection: keyboardType == TextInputType.emailAddress
            ? TextDirection.ltr
            : null,
        obscureText: obscureText,
        validator: validator,
        decoration: InputDecoration(suffixIcon: suffix),
      ),
    );
  }
}
