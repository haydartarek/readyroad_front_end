import 'package:flutter/material.dart';
import '../../../../core/localization/app_localizations.dart';
import '../../../../design_system/widgets/rijvia_components.dart';
import '../../../../shared/widgets/rijvia_legal_links.dart';

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key, required this.onContinue});
  final VoidCallback onContinue;
  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  int _page = 0;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final slides = [
      (t.t('wire.welcome_title'), t.t('wire.welcome_description')),
      (t.navLessons, t.t('story.welcome_lessons')),
      (t.navPractice, t.t('practice.random_signs_subtitle')),
    ];
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Semantics(
                    image: true,
                    label: t.appName,
                    child: Image.asset(
                      'assets/branding/rijvia-app-icon.png',
                      height: 96,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'RIJVIA',
                    textAlign: TextAlign.center,
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(letterSpacing: 3),
                  ),
                  const SizedBox(height: 28),
                  Text(
                    slides[_page].$1,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    slides[_page].$2,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: 32),
                  FilledButton(
                    onPressed: widget.onContinue,
                    child: Text(t.t('wire.begin')),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: widget.onContinue,
                    child: Text(t.t('wire.have_account')),
                  ),
                  const SizedBox(height: 16),
                  RijviaPagerIndicator(
                    count: slides.length,
                    selected: _page,
                    onSelected: (index) => setState(() => _page = index),
                  ),
                  const SizedBox(height: 16),
                  const RijviaLegalLinks(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
