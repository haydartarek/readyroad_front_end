import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';

class PublicContentRepository {
  Future<Map<String, dynamic>>? _content;
  Map<String, dynamic>? _value;
  Future<Map<String, dynamic>> load() {
    if (_value != null) return SynchronousFuture(_value!);
    return _content ??= rootBundle
        .loadString('assets/web_reference/public-content.json')
        .then(
          (value) =>
              _value = Map<String, dynamic>.from(jsonDecode(value) as Map),
        );
  }
}

final publicContentRepository = PublicContentRepository();

class PublicDocumentScreen extends StatelessWidget {
  const PublicDocumentScreen({super.key, required this.page});
  final String page;

  @override
  Widget build(BuildContext context) => FutureBuilder<Map<String, dynamic>>(
    future: publicContentRepository.load(),
    builder: (context, snapshot) {
      final t = AppLocalizations.of(context);
      if (!snapshot.hasData) {
        return Scaffold(
          appBar: const RijviaAppBar(),
          body: Center(
            child: snapshot.hasError
                ? Text(t.t('common.load_error'))
                : const CircularProgressIndicator(),
          ),
        );
      }
      final bundle = Map<String, dynamic>.from(
        snapshot.data![t.locale.languageCode] as Map,
      );
      final faq = page == 'faq';
      final document = Map<String, dynamic>.from(
        faq ? bundle['faq'] as Map : (bundle['documents'] as Map)[page] as Map,
      );
      final title = document['title'].toString();
      final colors = Theme.of(context).colorScheme;
      return Scaffold(
        appBar: RijviaAppBar(title: Text(title)),
        body: RijviaScrollFrame(
          maxWidth: 1024,
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
            children: [
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  TextButton(
                    onPressed: () =>
                        Navigator.of(context).popUntil((r) => r.isFirst),
                    child: Text(bundle['breadcrumbHome'].toString()),
                  ),
                  const Icon(Icons.chevron_right, size: 16),
                  Text(title),
                ],
              ),
              const SizedBox(height: 24),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: colors.primary.withValues(alpha: .1),
                      borderRadius: BorderRadius.circular(22),
                    ),
                    child: Icon(_icon, color: colors.primary),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          document['eyebrow'].toString(),
                          style: TextStyle(
                            color: colors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          title,
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(fontWeight: FontWeight.w900),
                        ),
                        if (document['lastUpdated'] != null) ...[
                          const SizedBox(height: 8),
                          Text(
                            document['lastUpdated'].toString(),
                            style: TextStyle(color: colors.onSurfaceVariant),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              SelectableText(
                document['intro'].toString(),
                style: TextStyle(
                  fontSize: 16,
                  height: 2,
                  color: colors.onSurfaceVariant,
                ),
              ),
              const SizedBox(height: 32),
              const Divider(height: 1),
              if (faq) ...[
                for (final raw in document['items'] as List)
                  ExpansionTile(
                    tilePadding: EdgeInsets.zero,
                    title: Text(
                      raw['question'].toString(),
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    children: [
                      Padding(
                        padding: const EdgeInsetsDirectional.only(
                          end: 32,
                          bottom: 20,
                        ),
                        child: SelectableText(
                          raw['answer'].toString(),
                          style: TextStyle(
                            fontSize: 15,
                            height: 1.85,
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 32),
                Text(document['contactPrompt'].toString()),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => Navigator.pushNamed(context, '/contact'),
                  icon: const Icon(Icons.mail_outline),
                  label: Text(document['contactLabel'].toString()),
                ),
              ] else
                for (final raw in document['sections'] as List) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 32),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(
                          raw['title'].toString(),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        for (final paragraph in raw['paragraphs'] as List) ...[
                          const SizedBox(height: 16),
                          SelectableText(
                            paragraph.toString(),
                            style: TextStyle(
                              fontSize: 15,
                              height: 1.85,
                              color: colors.onSurfaceVariant,
                            ),
                          ),
                        ],
                        for (final item in raw['items'] as List? ?? []) ...[
                          const SizedBox(height: 12),
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '•',
                                style: TextStyle(color: colors.primary),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: SelectableText(
                                  item.toString(),
                                  style: TextStyle(
                                    fontSize: 14,
                                    height: 2,
                                    color: colors.onSurfaceVariant,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                        for (final reference
                            in raw['references'] as List? ?? [])
                          TextButton.icon(
                            onPressed: () => _launch(
                              context,
                              Uri.parse(reference['url'].toString()),
                            ),
                            icon: const Icon(Icons.open_in_new, size: 16),
                            label: Text(reference['label'].toString()),
                          ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                ],
              const SizedBox(height: 32),
              const RijviaWebFooter(),
            ],
          ),
        ),
      );
    },
  );

  IconData get _icon => switch (page) {
    'privacy' => Icons.shield_outlined,
    'terms' => Icons.description_outlined,
    'cookies' => Icons.cookie_outlined,
    'disclaimer' => Icons.info_outline,
    'faq' => Icons.help_outline,
    _ => Icons.explore_outlined,
  };

  Future<void> _launch(BuildContext context, Uri uri) async {
    try {
      if (await launchUrl(uri, mode: LaunchMode.externalApplication)) return;
    } catch (_) {
      /* Localized error below. */
    }
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context).t('wire.open_link_error')),
      ),
    );
  }
}
