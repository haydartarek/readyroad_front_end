import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../auth/presentation/bloc/auth_bloc.dart';
import '../auth/presentation/bloc/auth_state.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/providers/favorites_provider.dart';
import '../../core/providers/language_provider.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_components.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../../shared/models/content_item.dart';
import '../../shared/services/content_service.dart';
import 'sign_details_screen.dart';
import 'web_sign_groups.dart';

String signName(ContentItem sign, String language) => sign
    .getName(language)
    .replaceFirst(
      RegExp(
        '^\\s*${RegExp.escape(sign.code)}\\s*[-–—:]\\s*',
        caseSensitive: false,
      ),
      '',
    )
    .trim();

String signGroupText(String group, String field, String language) {
  final values = webSignGroups[group]?[field];
  return values is Map
      ? (values[language] ?? values['en'] ?? '').toString()
      : '';
}

int compareSignCodes(ContentItem a, ContentItem b) {
  final chunks = RegExp(r'\d+|\D+');
  final left = chunks.allMatches(a.code).map((v) => v.group(0)!).toList();
  final right = chunks.allMatches(b.code).map((v) => v.group(0)!).toList();
  for (var i = 0; i < left.length && i < right.length; i++) {
    final n = int.tryParse(left[i]);
    final m = int.tryParse(right[i]);
    final order = n != null && m != null
        ? n.compareTo(m)
        : left[i].compareTo(right[i]);
    if (order != 0) return order;
  }
  return left.length.compareTo(right.length);
}

class TrafficSignsScreen extends StatefulWidget {
  const TrafficSignsScreen({
    super.key,
    this.category,
    this.search = '',
    this.favoritesOnly = false,
    this.service,
  });
  final String? category;
  final String search;
  final bool favoritesOnly;
  final ContentService? service;
  @override
  State<TrafficSignsScreen> createState() => _TrafficSignsScreenState();
}

class _TrafficSignsScreenState extends State<TrafficSignsScreen> {
  late final _service = widget.service ?? getIt<ContentService>();
  late final _search = TextEditingController(text: widget.search);
  late String? _category = widget.category;
  List<ContentItem>? _signs;
  bool _failed = false;
  String? _favoriteOwner;
  @override
  void initState() {
    super.initState();
    if (!widget.favoritesOnly) _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final owner = context.watch<FavoritesProvider>().boundUserId;
    if (widget.favoritesOnly && owner != null && owner != _favoriteOwner) {
      _favoriteOwner = owner;
      _load();
    }
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _failed = false;
      _signs = null;
    });
    try {
      final signs = await _service.getAllContent();
      signs.sort(compareSignCodes);
      if (mounted) setState(() => _signs = signs);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final favorites = context.watch<FavoritesProvider>();
    final auth = context.watch<AuthBloc>().state;
    final query = _search.text.trim().toLowerCase();
    final signs = (_signs ?? [])
        .where(
          (s) =>
              (!widget.favoritesOnly || favorites.isFavorite(s.id)) &&
              (_category == null || s.categoryCode == _category) &&
              (query.isEmpty ||
                  '${s.code} ${s.getName(language)} ${s.getDescription(language) ?? ''}'
                      .toLowerCase()
                      .contains(query)),
        )
        .toList();
    return Scaffold(
      appBar: const RijviaAppBar(),
      body: SingleChildScrollView(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 1536),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  RijviaPageHero(
                    title: t.t(
                      widget.favoritesOnly
                          ? 'favorites.web.collection'
                          : 'traffic_signs.page_title',
                    ),
                    description: t.t(
                      widget.favoritesOnly
                          ? 'favorites.web.collectionDescription'
                          : 'traffic_signs.page_subtitle',
                    ),
                    actions: widget.favoritesOnly
                        ? [
                            OutlinedButton(
                              onPressed: () => Navigator.pushNamed(
                                context,
                                '/traffic-signs',
                              ),
                              child: Text(t.t('favorites.web.back')),
                            ),
                          ]
                        : [],
                  ),
                  const SizedBox(height: 24),
                  if (!widget.favoritesOnly) ...[
                    TextField(
                      controller: _search,
                      onChanged: (_) => setState(() {}),
                      decoration: InputDecoration(
                        hintText: t.t('traffic_signs.search_placeholder'),
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: query.isEmpty
                            ? null
                            : IconButton(
                                tooltip: t.t('traffic_signs.clear_filters'),
                                onPressed: () {
                                  _search.clear();
                                  setState(() {});
                                },
                                icon: const Icon(Icons.close),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        ChoiceChip(
                          label: Text(t.t('traffic_signs.category_all_signs')),
                          selected: _category == null,
                          onSelected: (_) => setState(() => _category = null),
                        ),
                        for (final group in webSignGroupOrder)
                          ChoiceChip(
                            label: Text(
                              signGroupText(group, 'title', language),
                            ),
                            selected: _category == group,
                            onSelected: (_) =>
                                setState(() => _category = group),
                          ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 24),
                  if (widget.favoritesOnly && auth is! Authenticated)
                    FilledButton(
                      onPressed: () => Navigator.pushNamed(
                        context,
                        '/login?returnUrl=%2Ftraffic-signs%2Ffavorites',
                      ),
                      child: Text(t.t('favorites.web.login')),
                    )
                  else if (_failed ||
                      widget.favoritesOnly &&
                          (favorites.syncError != null ||
                              favorites.isLoaded &&
                                  favorites.favoritesCount > 0 &&
                                  _signs != null &&
                                  signs.isEmpty))
                    Center(
                      child: Column(
                        children: [
                          Text(
                            t.t(
                              widget.favoritesOnly
                                  ? 'favorites.web.error'
                                  : 'signs.load_error',
                            ),
                          ),
                          TextButton(
                            onPressed: () async {
                              await _load();
                              if (widget.favoritesOnly) {
                                try {
                                  await favorites.refresh();
                                } catch (_) {
                                  /* Provider retains the visible retry state. */
                                }
                              }
                            },
                            child: Text(t.t('common.retry')),
                          ),
                        ],
                      ),
                    )
                  else if (_signs == null ||
                      widget.favoritesOnly &&
                          !favorites.isLoaded &&
                          favorites.syncError == null)
                    const Center(child: CircularProgressIndicator())
                  else if (signs.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(32),
                      child: Text(
                        t.t(
                          widget.favoritesOnly
                              ? 'favorites.web.empty'
                              : 'traffic_signs.no_results_title',
                        ),
                        textAlign: TextAlign.center,
                      ),
                    )
                  else if (widget.favoritesOnly)
                    TrafficSignCatalogGrid(signs: signs)
                  else
                    for (final group in webSignGroupOrder) ...[
                      if (signs.any((s) => s.categoryCode == group)) ...[
                        Text(
                          signGroupText(group, 'title', language),
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text(signGroupText(group, 'description', language)),
                        const SizedBox(height: 16),
                        TrafficSignCatalogGrid(
                          signs: signs
                              .where((s) => s.categoryCode == group)
                              .toList(),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ],
                  const RijviaWebFooter(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class TrafficSignCatalogGrid extends StatelessWidget {
  const TrafficSignCatalogGrid({super.key, required this.signs});
  final List<ContentItem> signs;
  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) => RijviaAdaptiveGrid(
      columnsOverride: box.maxWidth >= 1500
          ? 4
          : box.maxWidth >= 1248
          ? 3
          : box.maxWidth >= 608
          ? 2
          : 1,
      maxCellWidth: double.infinity,
      children: [for (final sign in signs) TrafficSignCatalogCard(sign: sign)],
    ),
  );
}

class TrafficSignCatalogCard extends StatelessWidget {
  const TrafficSignCatalogCard({super.key, required this.sign});
  final ContentItem sign;
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final language = context.watch<LanguageProvider>().currentLanguage;
    final name = signName(sign, language);
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(28),
        side: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.pushNamed(
          context,
          '/traffic-signs/${Uri.encodeComponent(sign.routeCode)}',
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                signGroupText(sign.categoryCode ?? '', 'title', language),
                style: Theme.of(context).textTheme.labelMedium,
              ),
              const SizedBox(height: 16),
              AspectRatio(
                aspectRatio: 4 / 3,
                child: RijviaEducationalImage(
                  url: sign.imageUrl ?? '',
                  label: name,
                  radius: 17.6,
                  frameRadius: 22.4,
                ),
              ),
              const SizedBox(height: 16),
              ConstrainedBox(
                constraints: const BoxConstraints(minHeight: 56),
                child: Text(
                  name,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const Spacer(),
              const Divider(height: 24),
              Row(
                children: [
                  Expanded(
                    child: Text(
                      t.t('common.view'),
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                      ),
                    ),
                  ),
                  const Icon(Icons.arrow_outward),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class TrafficSignDetailRoute extends StatefulWidget {
  const TrafficSignDetailRoute({super.key, required this.code});
  final String code;
  @override
  State<TrafficSignDetailRoute> createState() => _TrafficSignDetailRouteState();
}

class _TrafficSignDetailRouteState extends State<TrafficSignDetailRoute> {
  late Future<ContentItem> _future = getIt<ContentService>().getContentByCode(
    widget.code,
  );
  @override
  Widget build(BuildContext context) => FutureBuilder<ContentItem>(
    future: _future,
    builder: (context, snapshot) {
      if (snapshot.hasData) return SignDetailsScreen(content: snapshot.data!);
      final t = AppLocalizations.of(context);
      return Scaffold(
        appBar: const RijviaAppBar(),
        body: Center(
          child: snapshot.hasError
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(t.t('sign_detail.not_found')),
                    TextButton(
                      onPressed: () => setState(
                        () => _future = getIt<ContentService>()
                            .getContentByCode(widget.code),
                      ),
                      child: Text(t.t('common.retry')),
                    ),
                  ],
                )
              : const CircularProgressIndicator(),
        ),
      );
    },
  );
}
