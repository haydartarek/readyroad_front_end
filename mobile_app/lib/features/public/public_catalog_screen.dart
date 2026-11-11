import 'rijvia_video_player.dart';
import 'package:flutter/material.dart';
import '../../design_system/widgets/rijvia_components.dart';
import 'package:intl/intl.dart' hide TextDirection;
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/api_constants.dart';
import '../../core/di/service_locator.dart';
import '../../core/localization/app_localizations.dart';
import '../../core/network/api_client.dart';
import '../../design_system/widgets/rijvia_app_bar.dart';
import '../../design_system/widgets/rijvia_content.dart';
import '../../design_system/widgets/rijvia_page_surface.dart';
import '../../design_system/widgets/rijvia_web_navigation.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';
import '../../shared/widgets/rijvia_markdown.dart';
import 'public_page_service.dart';

class PublicCatalogScreen extends StatefulWidget {
  const PublicCatalogScreen({
    super.key,
    required this.kind,
    this.slug,
    this.service,
  });
  final String kind;
  final String? slug;
  final PublicPageService? service;
  @override
  State<PublicCatalogScreen> createState() => _PublicCatalogScreenState();
}

class _PublicCatalogScreenState extends State<PublicCatalogScreen> {
  late final PublicPageService _service =
      widget.service ?? PublicPageService(getIt<ApiClient>());
  String? _language;
  List<Map<String, dynamic>> _items = [];
  Map<String, dynamic>? _article;
  Map<String, dynamic>? _videoPage;
  Object? _error;
  String _query = '';
  bool _loading = true;
  bool _moreLoading = false;
  bool _moreFailed = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final language = AppLocalizations.of(context).locale.languageCode;
    if (_language != language) {
      _language = language;
      _load();
    }
  }

  Future<void> _load() async {
    final language = _language!;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      if (widget.kind == 'videos') {
        final page = await _service.videos();
        if (!mounted || language != _language) return;
        _videoPage = page;
        _items = _maps(page['videos']);
      } else if (widget.slug != null) {
        final article = await _service.article(widget.slug!, language);
        if (!mounted || language != _language) return;
        _article = article;
      } else {
        final items = await _service.articles(language);
        if (!mounted || language != _language) return;
        _items = items;
      }
    } catch (error) {
      if (mounted && language == _language) _error = error;
    } finally {
      if (mounted && language == _language) setState(() => _loading = false);
    }
  }

  Future<void> _more() async {
    if (_moreLoading || _videoPage?['nextPageToken'] == null) return;
    setState(() {
      _moreLoading = true;
      _moreFailed = false;
    });
    try {
      final page = await _service.videos(
        pageToken: _videoPage!['nextPageToken'].toString(),
      );
      if (!mounted) return;
      final known = _items.map((item) => item['videoId']).toSet();
      _items.addAll(
        _maps(page['videos']).where((item) => !known.contains(item['videoId'])),
      );
      _videoPage = page;
    } catch (_) {
      if (mounted) _moreFailed = true;
    } finally {
      if (mounted) setState(() => _moreLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    final videos = widget.kind == 'videos';
    final title =
        _article?['title']?.toString() ??
        t.t(videos ? 'videos.hero_title' : 'blog.title');
    final visible = _items
        .where(
          (item) =>
              _query.isEmpty ||
              '${item['title']} ${item['description'] ?? item['summary'] ?? ''}'
                  .toLowerCase()
                  .contains(_query.toLowerCase()),
        )
        .toList();
    return Scaffold(
      appBar: RijviaAppBar(title: Text(title)),
      body: RijviaScrollFrame(
        child: RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              RijviaPageHero(
                title: title,
                description:
                    _article?['summary']?.toString() ??
                    t.t(
                      videos ? 'videos.hero_description' : 'blog.introduction',
                    ),
                actions: videos
                    ? [
                        OutlinedButton.icon(
                          onPressed: () => _external(
                            _videoPage?['channel']?['url']?.toString() ??
                                'https://www.youtube.com/@RijBewijsBe/featured',
                          ),
                          icon: const Icon(Icons.open_in_new),
                          label: Text(t.t('videos.visit_channel')),
                        ),
                      ]
                    : [],
              ),
              const SizedBox(height: 32),
              if (_loading)
                const Center(child: CircularProgressIndicator())
              else if (_error != null)
                _state(
                  t.t(videos ? 'videos.error_title' : 'common.load_error'),
                  t.t(
                    videos ? 'videos.error_description' : 'common.error_desc',
                  ),
                  onRetry: _load,
                )
              else if (_article != null)
                ..._articleWidgets(_article!, t)
              else ...[
                if (videos) ...[
                  if (_videoPage?['stale'] == true)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(t.t('videos.stale_notice')),
                    ),
                  TextField(
                    onChanged: (value) => setState(() => _query = value),
                    decoration: InputDecoration(
                      labelText: t.t('videos.search_label'),
                      hintText: t.t('videos.search_placeholder'),
                      prefixIcon: const Icon(Icons.search),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                if (visible.isEmpty)
                  _state(
                    t.t(
                      videos
                          ? _query.isEmpty
                                ? 'videos.empty_title'
                                : 'videos.no_search_results'
                          : 'blog.empty_title',
                    ),
                    t.t(
                      videos
                          ? _query.isEmpty
                                ? 'videos.empty_description'
                                : 'videos.no_search_results_description'
                          : 'blog.empty_description',
                    ),
                  )
                else
                  RijviaAdaptiveGrid(
                    maxCellWidth: 440,
                    children: [
                      for (final item in visible) _catalogCard(item, t, videos),
                    ],
                  ),
                if (videos && _videoPage?['nextPageToken'] != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 24),
                    child: OutlinedButton(
                      onPressed: _moreLoading ? null : _more,
                      child: Text(
                        t.t(
                          _moreLoading
                              ? 'videos.loading_more'
                              : 'videos.load_more',
                        ),
                      ),
                    ),
                  ),
                if (_moreFailed)
                  Text(
                    t.t('videos.load_more_error'),
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.error,
                    ),
                  ),
              ],
              const SizedBox(height: 32),
              const RijviaWebFooter(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _state(String title, String description, {VoidCallback? onRetry}) =>
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: [
            Text(
              title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(description, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              FilledButton(
                onPressed: onRetry,
                child: Text(AppLocalizations.of(context).commonRetry),
              ),
            ],
          ],
        ),
      );

  Widget _catalogCard(
    Map<String, dynamic> item,
    AppLocalizations t,
    bool video,
  ) {
    final image = item[video ? 'thumbnail' : 'image'];
    final rawUrl = image is Map
        ? image[video ? 'url' : 'cardUrl']?.toString()
        : null;
    final url = ApiConstants.resolveMediaUrl(rawUrl);
    void open() => video
        ? _openVideo(item)
        : Navigator.pushNamed(
            context,
            '/blog/${Uri.encodeComponent(item['slug'].toString())}',
          );
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: open,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (url != null)
              AspectRatio(
                aspectRatio: 16 / 9,
                child: Image.network(
                  url,
                  fit: BoxFit.cover,
                  semanticLabel: image is Map
                      ? (image['altText'] ?? item['title']).toString()
                      : item['title'].toString(),
                  errorBuilder: (_, _, _) => const Center(
                    child: Icon(Icons.image_not_supported_outlined),
                  ),
                ),
              ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    item['title'].toString(),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      height: 1.4,
                    ),
                  ),
                  if (!video) ...[
                    const SizedBox(height: 12),
                    Text(
                      item['summary'].toString(),
                      style: const TextStyle(height: 1.7),
                    ),
                  ],
                  if (item['publishedAt'] != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _date(item['publishedAt'].toString()),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                  const SizedBox(height: 16),
                  TextButton.icon(
                    onPressed: open,
                    icon: Icon(
                      video ? Icons.play_circle_outline : Icons.arrow_forward,
                    ),
                    label: Text(
                      t.t(video ? 'videos.watch_video' : 'blog.read_article'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _articleWidgets(
    Map<String, dynamic> article,
    AppLocalizations t,
  ) {
    final image = article['image'];
    return [
      if (image is Map) ...[
        RijviaEducationalImage(
          url: image['heroUrl'].toString(),
          radius: 16,
          label: image['altText'].toString(),
          maxHeight: 560,
        ),
        if (image['caption'] != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(image['caption'].toString()),
          ),
        if (image['photographerName'] != null)
          TextButton(
            onPressed: image['sourceUrl'] == null
                ? null
                : () => _external(image['sourceUrl'].toString()),
            child: Text(
              t.t('blog.photo_credit', {
                'photographer': image['photographerName'].toString(),
                'source': (image['sourcePlatform'] ?? '').toString(),
              }),
            ),
          ),
        const SizedBox(height: 32),
      ],
      RijviaMarkdown(
        text: article['body'].toString(),
        typography: article['typography'] is Map
            ? Map<String, dynamic>.from(article['typography'] as Map)
            : const {},
        afterSecondParagraph: const _ArticleLearningCards(),
      ),
      const SizedBox(height: 32),
      if (_maps(article['internalLinks']).isNotEmpty)
        RijviaPageSection(
          title: t.t('blog.continue_learning'),
          child: Column(
            children: [
              for (final link in _maps(article['internalLinks']))
                ListTile(
                  title: Text(link['anchorText'].toString()),
                  trailing: const Icon(Icons.arrow_forward),
                  onTap: () => Navigator.pushNamed(
                    context,
                    link['targetPath'].toString(),
                  ),
                ),
            ],
          ),
        ),
    ];
  }

  Future<void> _openVideo(Map<String, dynamic> video) async {
    final t = AppLocalizations.of(context);
    final raw = Uri.tryParse(video['embedUrl']?.toString() ?? '');
    if (raw == null ||
        raw.scheme != 'https' ||
        ![
          'www.youtube.com',
          'youtube.com',
          'www.youtube-nocookie.com',
          'youtube-nocookie.com',
        ].contains(raw.host) ||
        !RegExp(r'^/embed/[a-zA-Z0-9_-]+$').hasMatch(raw.path)) {
      return;
    }
    final url = raw
        .replace(queryParameters: {...raw.queryParameters, 'rel': '0'})
        .toString();
    await showDialog<void>(
      context: context,
      builder: (context) => Dialog(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 896),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        video['title']?.toString() ?? '',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      tooltip: t.t('common.close'),
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(t.t('videos.external_media_notice')),
                const SizedBox(height: 16),
                AspectRatio(
                  aspectRatio: 16 / 9,
                  child: RijviaVideoPlayer(
                    url: url,
                    title: t.t('videos.player_title', {
                      'title': video['title'] ?? '',
                    }),
                    onOpenExternal: () =>
                        _external(video['watchUrl'].toString()),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _date(String raw) {
    final date = DateTime.tryParse(raw);
    return date == null
        ? raw
        : DateFormat.yMMMd(_language).format(date.toLocal());
  }

  Future<void> _external(String link) async {
    try {
      if (await launchUrl(
        Uri.parse(link),
        mode: LaunchMode.externalApplication,
      )) {
        return;
      }
    } catch (_) {
      /* Keep the current catalogue on failure. */
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).t('wire.open_link_error')),
        ),
      );
    }
  }

  List<Map<String, dynamic>> _maps(dynamic value) => value is List
      ? value
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList()
      : [];
}

class _ArticleLearningCards extends StatelessWidget {
  const _ArticleLearningCards();
  @override
  Widget build(BuildContext context) {
    final t = AppLocalizations.of(context);
    return LayoutBuilder(
      builder: (context, box) => Semantics(
        label: t.t('blog.continue_learning'),
        child: RijviaAdaptiveGrid(
          columnsOverride: box.maxWidth >= 640 ? 3 : 1,
          maxCellWidth: double.infinity,
          children: [
            for (final card in const [
              ('/traffic-signs', 'traffic-signs', 'traffic_signs'),
              ('/practice', 'practice', 'practice'),
              ('/exam', 'exam', 'exam'),
            ])
              Card(
                margin: EdgeInsets.zero,
                clipBehavior: Clip.antiAlias,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(
                    color: Theme.of(context).colorScheme.outlineVariant,
                  ),
                ),
                child: Semantics(
                  link: true,
                  label: t.t('blog.cards.${card.$3}'),
                  child: InkWell(
                    onTap: () => Navigator.pushNamed(context, card.$1),
                    child: ExcludeSemantics(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          AspectRatio(
                            aspectRatio: 1672 / 941,
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Image.asset(
                                  'assets/web_reference/blog-card-${card.$2}.png',
                                  fit: BoxFit.cover,
                                  cacheWidth: 640,
                                ),
                                const ColoredBox(color: Color(0x66000000)),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    t.t('blog.cards.${card.$3}'),
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      height: 1.6,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Icon(
                                  Directionality.of(context) ==
                                          TextDirection.rtl
                                      ? Icons.arrow_back
                                      : Icons.arrow_forward,
                                  size: 18,
                                  color: Theme.of(context).colorScheme.primary,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
