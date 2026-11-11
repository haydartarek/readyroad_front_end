import 'package:flutter/material.dart';
import 'package:markdown/markdown.dart' as md;
import 'package:url_launcher/url_launcher.dart';
import '../../core/localization/app_localizations.dart';
import '../../design_system/widgets/rijvia_educational_image.dart';

class _SkipInlineHtml extends md.InlineHtmlSyntax {
  @override
  bool onMatch(md.InlineParser parser, Match match) {
    parser.addNode(md.Element.empty('raw-html'));
    return true;
  }
}

class _SkipHtmlBlock extends md.HtmlBlockSyntax {
  const _SkipHtmlBlock();
  @override
  md.Node parse(md.BlockParser parser) {
    super.parse(parser);
    return md.Element.empty('raw-html');
  }
}

/// The web ArticleMarkdown's GFM, typography and skipHtml, rendered natively.
class RijviaMarkdown extends StatefulWidget {
  const RijviaMarkdown({
    super.key,
    required this.text,
    this.typography = const {},
    this.afterSecondParagraph,
  });
  final String text;
  final Map<String, dynamic> typography;
  final Widget? afterSecondParagraph;
  @override
  State<RijviaMarkdown> createState() => _RijviaMarkdownState();
}

class _RijviaMarkdownState extends State<RijviaMarkdown> {
  late List<md.Node> _nodes;
  int _paragraphs = 0;
  double _width = 0;
  @override
  void initState() {
    super.initState();
    _parse();
  }

  @override
  void didUpdateWidget(RijviaMarkdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text) _parse();
  }

  void _parse() {
    _nodes = md.Document(
      extensionSet: md.ExtensionSet.gitHubFlavored,
      encodeHtml: false,
      blockSyntaxes: [const _SkipHtmlBlock()],
      inlineSyntaxes: [_SkipInlineHtml()],
    ).parseLines(widget.text.replaceAll('\r\n', '\n').split('\n'));
  }

  static bool _safe(String link) {
    final uri = Uri.tryParse(link);
    return uri != null &&
        uri.userInfo.isEmpty &&
        ((link.startsWith('/') && !link.startsWith('//')) ||
            ['https', 'http', 'mailto'].contains(uri.scheme));
  }

  Future<void> _open(String link) async {
    if (!_safe(link)) return;
    if (link.startsWith('/')) {
      await Navigator.pushNamed(context, link);
      return;
    }
    try {
      if (await launchUrl(
        Uri.parse(link),
        mode: LaunchMode.externalApplication,
      )) {
        return;
      }
    } catch (_) {
      /* Show the existing localized failure. */
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).t('wire.open_link_error')),
        ),
      );
    }
  }

  Color get _color {
    final colors = Theme.of(context).colorScheme;
    return switch (widget.typography['textColor']) {
      'MUTED' => colors.onSurfaceVariant,
      'PRIMARY' => colors.primary,
      'SECONDARY' => colors.secondary,
      _ => colors.onSurface,
    };
  }

  double get _paragraphSize => switch (widget.typography['paragraphSize']) {
    'COMPACT' => 14,
    'LARGE' => 18,
    _ => 16,
  };
  double _headingSize(int level) {
    final wide = _width >= 640;
    final size = widget.typography['h${level}Size'];
    final index = size == 'COMPACT'
        ? 0
        : size == 'LARGE'
        ? 2
        : 1;
    return switch (level) {
      1 => (wide ? [30.0, 36.0, 48.0] : [24.0, 30.0, 36.0])[index],
      2 => (wide ? [24.0, 30.0, 36.0] : [20.0, 24.0, 30.0])[index],
      3 => (wide ? [18.0, 24.0, 30.0] : [16.0, 20.0, 24.0])[index],
      4 => (wide ? [14.0, 18.0, 20.0] : [14.0, 16.0, 18.0])[index],
      _ => 16,
    };
  }

  List<InlineSpan> _inline(List<md.Node> nodes, {TextStyle? style}) {
    final spans = <InlineSpan>[];
    for (final node in nodes) {
      if (node is md.Text) {
        spans.add(TextSpan(text: node.textContent, style: style));
        continue;
      }
      if (node is! md.Element || node.tag == 'raw-html') continue;
      if (node.tag == 'a') {
        final href = node.attributes['href'];
        if (href != null && _safe(href)) {
          spans.add(
            WidgetSpan(
              alignment: PlaceholderAlignment.baseline,
              baseline: TextBaseline.alphabetic,
              child: ConstrainedBox(
                constraints: BoxConstraints(maxWidth: _width),
                child: Semantics(
                  link: true,
                  label: node.textContent,
                  onTap: () => _open(href),
                  child: ExcludeSemantics(
                    child: TextButton(
                      onPressed: () => _open(href),
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        alignment: AlignmentDirectional.centerStart,
                      ),
                      child: Text.rich(
                        TextSpan(
                          children: _inline(node.children ?? [], style: style),
                        ),
                        style: TextStyle(
                          fontSize: _paragraphSize,
                          height: 1.85,
                          color: Theme.of(context).colorScheme.primary,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          );
          continue;
        }
      }
      if (node.tag == 'br') {
        spans.add(const TextSpan(text: '\n'));
        continue;
      }
      if (node.tag == 'img') {
        final src = node.attributes['src'];
        if (src != null) {
          spans.add(
            WidgetSpan(
              child: SizedBox(
                width: _width.clamp(0, 640),
                child: RijviaEducationalImage(
                  url: src,
                  radius: 16,
                  label: node.attributes['alt'] ?? '',
                ),
              ),
            ),
          );
        }
        continue;
      }
      if (node.tag == 'input') {
        spans.add(
          WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: Checkbox(
              value: node.attributes.containsKey('checked'),
              onChanged: null,
            ),
          ),
        );
        continue;
      }
      TextStyle? addition;
      switch (node.tag) {
        case 'strong':
          addition = const TextStyle(fontWeight: FontWeight.w900);
        case 'em':
          addition = const TextStyle(fontStyle: FontStyle.italic);
        case 'del':
          addition = const TextStyle(decoration: TextDecoration.lineThrough);
        case 'code':
          addition = TextStyle(
            fontFamily: 'monospace',
            fontSize: _paragraphSize * .9,
            backgroundColor: Theme.of(context).colorScheme.surfaceContainerHigh,
          );
      }
      spans.addAll(
        _inline(node.children ?? [], style: style?.merge(addition) ?? addition),
      );
    }
    return spans;
  }

  Widget _text(List<md.Node> nodes, {TextStyle? style, TextAlign? align}) =>
      Text.rich(
        TextSpan(children: _inline(nodes)),
        textAlign: align,
        style: TextStyle(
          fontSize: _paragraphSize,
          height: 1.85,
          color: _color,
        ).merge(style),
      );
  Widget _block(md.Node node, {bool first = false}) {
    if (node is! md.Element) return _text([node]);
    final children = node.children ?? [];
    switch (node.tag) {
      case 'raw-html':
        return const SizedBox.shrink();
      case 'p':
        _paragraphs++;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: EdgeInsets.only(top: first ? 0 : 20),
              child: _text(children),
            ),
            if (_paragraphs == 2 && widget.afterSecondParagraph != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: widget.afterSecondParagraph!,
              ),
          ],
        );
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        final level = int.parse(node.tag.substring(1));
        return Padding(
          padding: EdgeInsets.only(
            top: first
                ? 0
                : level < 3
                ? 40
                : level == 3
                ? 32
                : 28,
            bottom: 8,
          ),
          child: Semantics(
            header: true,
            child: _text(
              children,
              style: TextStyle(
                fontSize: _headingSize(level),
                fontWeight: FontWeight.w900,
                height: 1.25,
              ),
            ),
          ),
        );
      case 'ul':
      case 'ol':
        final items = children
            .whereType<md.Element>()
            .where((e) => e.tag == 'li')
            .toList();
        final start = int.tryParse(node.attributes['start'] ?? '') ?? 1;
        return Padding(
          padding: const EdgeInsets.only(top: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (var i = 0; i < items.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 28,
                        child: Text(
                          node.tag == 'ol' ? '${start + i}.' : '•',
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.primary,
                            fontSize: _paragraphSize,
                            fontWeight: FontWeight.w700,
                            height: 1.85,
                          ),
                        ),
                      ),
                      Expanded(child: _listItem(items[i])),
                    ],
                  ),
                ),
            ],
          ),
        );
      case 'blockquote':
        return Container(
          margin: const EdgeInsets.only(top: 24),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: .04),
            border: BorderDirectional(
              start: BorderSide(
                width: 4,
                color: Theme.of(
                  context,
                ).colorScheme.primary.withValues(alpha: .4),
              ),
            ),
          ),
          child: DefaultTextStyle.merge(
            style: const TextStyle(
              fontStyle: FontStyle.italic,
              fontWeight: FontWeight.w700,
            ),
            child: _blocks(children),
          ),
        );
      case 'pre':
        return Container(
          margin: const EdgeInsets.only(top: 20),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(12),
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Text(
              node.textContent,
              textDirection: TextDirection.ltr,
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: _paragraphSize * .9,
                height: 1.6,
                color: _color,
              ),
            ),
          ),
        );
      case 'hr':
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Divider(),
        );
      case 'table':
        return _table(node);
      default:
        return _text([node]);
    }
  }

  Widget _listItem(md.Element item) {
    final blocks = <Widget>[];
    final inline = <md.Node>[];
    void flush() {
      if (inline.isNotEmpty) {
        blocks.add(_text([...inline]));
        inline.clear();
      }
    }

    for (final child in item.children ?? <md.Node>[]) {
      if (child is md.Element &&
          ['p', 'ul', 'ol', 'pre', 'blockquote'].contains(child.tag)) {
        flush();
        blocks.add(_block(child, first: blocks.isEmpty));
      } else {
        inline.add(child);
      }
    }
    flush();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: blocks,
    );
  }

  Widget _blocks(List<md.Node> nodes) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      for (var i = 0; i < nodes.length; i++) _block(nodes[i], first: i == 0),
    ],
  );
  Widget _table(md.Element table) {
    final rows = <md.Element>[];
    void collect(md.Element element) {
      if (element.tag == 'tr') {
        rows.add(element);
      } else {
        for (final child
            in element.children?.whereType<md.Element>() ?? <md.Element>[]) {
          collect(child);
        }
      }
    }

    collect(table);
    if (rows.isEmpty) return const SizedBox.shrink();
    final columns = rows
        .map((row) => row.children?.length ?? 0)
        .reduce((a, b) => a > b ? a : b);
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Table(
          defaultColumnWidth: const IntrinsicColumnWidth(),
          border: TableBorder.all(
            color: Theme.of(context).colorScheme.outlineVariant,
          ),
          children: [
            for (final row in rows)
              TableRow(
                children: [
                  for (var column = 0; column < columns; column++)
                    Builder(
                      builder: (context) {
                        final cells =
                            row.children?.whereType<md.Element>().toList() ??
                            [];
                        final cell = column < cells.length
                            ? cells[column]
                            : md.Element.empty('td');
                        final header = cell.tag == 'th';
                        final alignment = cell.attributes['style'] ?? '';
                        return Semantics(
                          header: header,
                          child: Container(
                            constraints: const BoxConstraints(
                              minWidth: 120,
                              maxWidth: 320,
                            ),
                            color: header
                                ? Theme.of(
                                    context,
                                  ).colorScheme.surfaceContainerHigh
                                : null,
                            padding: const EdgeInsets.all(12),
                            child: _text(
                              cell.children ?? [],
                              align: alignment.contains('center')
                                  ? TextAlign.center
                                  : alignment.contains('right')
                                  ? TextAlign.right
                                  : null,
                              style: TextStyle(
                                fontWeight: header ? FontWeight.w700 : null,
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) {
      _paragraphs = 0;
      _width = box.maxWidth;
      return SelectionArea(child: _blocks(_nodes));
    },
  );
}
