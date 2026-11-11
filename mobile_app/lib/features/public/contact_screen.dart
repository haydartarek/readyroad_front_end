import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_client.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import 'public_page_service.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key, this.service});
  final PublicPageService? service;
  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _key = GlobalKey<FormState>();
  final _fields = {
    for (final name in ['firstName', 'lastName', 'email', 'subject', 'message'])
      name: TextEditingController(),
  };
  bool _busy = false;
  bool _sent = false;
  String? _error;
  @override
  void dispose() {
    for (final controller in _fields.values) {
      controller.dispose();
    }
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy || !_key.currentState!.validate()) return;
    final language = AppLocalizations.of(context).locale.languageCode;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await (widget.service ?? PublicPageService(getIt<ApiClient>())).contact(
        _fields.map((key, controller) => MapEntry(key, controller.text.trim())),
        language,
      );
      if (!mounted) return;
      for (final controller in _fields.values) {
        controller.clear();
      }
      setState(() => _sent = true);
    } catch (_) {
      if (mounted) {
        setState(
          () => _error = AppLocalizations.of(context).t('common.error_desc'),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final methods = RijviaPageSection(
      title: t.t('contact.methods'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ListTile(
            leading: const Icon(Icons.mail_outline),
            title: Text(t.t('contact.directEmail')),
            subtitle: const Text(
              'info@rijvia.be',
              textDirection: TextDirection.ltr,
            ),
            onTap: () async {
              try {
                await launchUrl(Uri.parse('mailto:info@rijvia.be'));
              } catch (_) {
                /* Form remains available. */
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.schedule_outlined),
            title: Text(t.t('contact.responseTime')),
            subtitle: Text(t.t('contact.responseTimeValue')),
          ),
        ],
      ),
    );
    final form = RijviaPageSection(
      child: Form(
        key: _key,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final field in _fields.entries) ...[
              TextFormField(
                key: ValueKey('contact-${field.key}'),
                controller: field.value,
                enabled: !_busy,
                keyboardType: field.key == 'email'
                    ? TextInputType.emailAddress
                    : field.key == 'message'
                    ? TextInputType.multiline
                    : TextInputType.text,
                textDirection: field.key == 'email' ? TextDirection.ltr : null,
                minLines: field.key == 'message' ? 5 : 1,
                maxLines: field.key == 'message' ? null : 1,
                decoration: InputDecoration(
                  labelText: t.t('contact.${field.key}'),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return t.t('contact.required');
                  }
                  if (field.key == 'email' &&
                      !RegExp(
                        r'^[^\s@]+@[^\s@]+\.[^\s@]+$',
                      ).hasMatch(value.trim())) {
                    return t.t('contact.invalidEmail');
                  }
                  if (field.key == 'message' && value.trim().length < 20) {
                    return t.t('contact.minMessage');
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
            ],
            if (_sent)
              Semantics(
                liveRegion: true,
                child: Column(
                  children: [
                    const Icon(Icons.check_circle_outline, color: Colors.green),
                    Text(
                      t.t('contact.successTitle'),
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    Text(t.t('contact.successMsg')),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            if (_error != null)
              Semantics(
                liveRegion: true,
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    _error!,
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
                ),
              ),
            FilledButton.icon(
              onPressed: _busy ? null : _submit,
              icon: _busy
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.send_outlined),
              label: Text(t.t(_busy ? 'contact.sending' : 'contact.send')),
            ),
          ],
        ),
      ),
    );
    return Scaffold(
      appBar: RijviaAppBar(title: Text(t.t('contact.title'))),
      body: RijviaScrollFrame(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              RijviaPageHero(
                title: t.t('contact.title'),
                description: t.t('contact.subtitle'),
              ),
              const SizedBox(height: 32),
              LayoutBuilder(
                builder: (context, constraints) => constraints.maxWidth >= 900
                    ? Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: methods),
                          const SizedBox(width: 24),
                          Expanded(flex: 2, child: form),
                        ],
                      )
                    : Column(
                        children: [methods, const SizedBox(height: 24), form],
                      ),
              ),
              const SizedBox(height: 32),
              const RijviaWebFooter(),
            ],
          ),
        ),
      ),
    );
  }
}
