import '../widgets/rijvia_auth_field.dart';
import '../../../../core/navigation/web_route_registry.dart';
import '../widgets/rijvia_auth_frame.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/localization/app_localizations.dart';
import '../bloc/auth_bloc.dart';
import '../bloc/auth_event.dart';
import '../bloc/auth_state.dart';
import '../widgets/google_auth_button.dart';

/// Login Screen
/// Note: AuthBloc is provided by main.dart - no local BlocProvider needed
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.onBack, this.onAuthenticated});
  final VoidCallback? onBack;
  final VoidCallback? onAuthenticated;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin(BuildContext context) {
    if (_formKey.currentState!.validate()) {
      context.read<AuthBloc>().add(
        LoginEvent(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RijviaAuthFrame(
        page: "login",
        title: AppLocalizations.of(context).authLogin,
        onBack: widget.onBack,
        child: SafeArea(
          child: BlocConsumer<AuthBloc, AuthState>(
            listener: (context, state) {
              if (state is Authenticated) {
                if (widget.onAuthenticated != null) {
                  widget.onAuthenticated!();
                } else {
                  Navigator.of(context).popUntil((route) => route.isFirst);
                }
              }
              // Show error messages
              if (state is AuthError && state.messageKey == null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      state.message,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onErrorContainer,
                      ),
                    ),
                    backgroundColor: Theme.of(
                      context,
                    ).colorScheme.errorContainer,
                  ),
                );
              }
              // Note: Navigation to HomeScreen is handled by main.dart's BlocConsumer
              // when state becomes Authenticated - no manual navigation needed here
            },
            builder: (context, state) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 440),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            AppLocalizations.of(
                              context,
                            ).t('auth.login_form_subtitle'),
                          ),
                          const SizedBox(height: 24),
                          // Email Field
                          RijviaAuthField(
                            label: AppLocalizations.of(
                              context,
                            ).t('auth.username'),
                            child: TextFormField(
                              controller: _emailController,
                              keyboardType: TextInputType.text,
                              autofillHints: const [AutofillHints.username],
                              textDirection: TextDirection.ltr,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(Icons.person_outline),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return AppLocalizations.of(
                                    context,
                                  ).t('auth.validation.username_required');
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Password Field
                          RijviaAuthField(
                            label: AppLocalizations.of(context).authPassword,
                            child: TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                prefixIcon: const Icon(Icons.lock_outline),
                                suffixIcon: IconButton(
                                  tooltip: AppLocalizations.of(
                                    context,
                                  ).authPassword,
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return AppLocalizations.of(
                                    context,
                                  ).t('auth.validation.password_required');
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Login Button
                          BlocBuilder<AuthBloc, AuthState>(
                            builder: (context, state) {
                              final isLoading = state is AuthLoading;
                              return FilledButton(
                                onPressed: isLoading
                                    ? null
                                    : () => _handleLogin(context),
                                child: isLoading
                                    ? const SizedBox(
                                        height: 20,
                                        width: 20,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          valueColor:
                                              AlwaysStoppedAnimation<Color>(
                                                Colors.white,
                                              ),
                                        ),
                                      )
                                    : Text(
                                        AppLocalizations.of(
                                          context,
                                        ).t('auth.sign_in'),
                                      ),
                              );
                            },
                          ),
                          const SizedBox(height: 16),

                          TextButton(
                            onPressed: () => Navigator.pushNamed(
                              context,
                              WebRouteRegistry.authDestination(
                                ModalRoute.of(context)?.settings.name,
                                '/forgot-password',
                              ),
                            ),
                            child: Text(
                              AppLocalizations.of(context).authForgotPassword,
                            ),
                          ),
                          const SizedBox(height: 8),
                          const GoogleAuthButton(),
                          const SizedBox(height: 24),
                          Row(
                            children: [
                              const Expanded(child: Divider()),
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                ),
                                child: Text(
                                  AppLocalizations.of(context).t('auth.or'),
                                ),
                              ),
                              const Expanded(child: Divider()),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Wrap(
                            alignment: WrapAlignment.center,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(AppLocalizations.of(context).authNoAccount),
                              TextButton(
                                onPressed: () => Navigator.pushNamed(
                                  context,
                                  WebRouteRegistry.authDestination(
                                    ModalRoute.of(context)?.settings.name,
                                    '/register',
                                  ),
                                ),
                                child: Text(
                                  AppLocalizations.of(context).authRegister,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
