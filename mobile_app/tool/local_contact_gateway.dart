import 'dart:async';
import 'dart:convert';
import 'dart:io';

/// Development-only bridge to the existing web contact handler.
/// It accepts exactly the local Flutter origin and never forwards credentials.
class LocalContactGateway {
  LocalContactGateway._(this._server, this._endpoint, this._timeout);

  static const allowedOrigin = 'http://localhost:63783';
  static const defaultPort = 63784;
  static const maxBodyBytes = 64 * 1024;
  final HttpServer _server;
  final Uri _endpoint;
  final Duration _timeout;
  final HttpClient _client = HttpClient();

  int get port => _server.port;

  static Future<LocalContactGateway> start({
    int port = defaultPort,
    Uri? contactEndpoint,
    Duration timeout = const Duration(seconds: 30),
  }) async {
    final endpoint =
        contactEndpoint ?? Uri.parse('http://localhost:3000/api/contact');
    if (endpoint.scheme != 'http' ||
        !['localhost', '127.0.0.1'].contains(endpoint.host) ||
        endpoint.userInfo.isNotEmpty ||
        endpoint.path != '/api/contact' ||
        endpoint.hasQuery ||
        endpoint.hasFragment) {
      throw ArgumentError('The contact endpoint must be local /api/contact.');
    }
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, port);
    final gateway = LocalContactGateway._(server, endpoint, timeout);
    gateway._client
      ..connectionTimeout = timeout
      ..findProxy = (_) => 'DIRECT';
    server.listen((request) => unawaited(gateway._handle(request)));
    return gateway;
  }

  Future<void> close() async {
    _client.close(force: true);
    await _server.close(force: true);
  }

  Future<void> _handle(HttpRequest request) async {
    final response = request.response;
    response.headers
      ..set(HttpHeaders.cacheControlHeader, 'no-store')
      ..set('X-Content-Type-Options', 'nosniff')
      ..set(HttpHeaders.varyHeader, 'Origin');
    try {
      final host = request.headers.value(HttpHeaders.hostHeader);
      if (host != '127.0.0.1:$port' && host != 'localhost:$port') {
        _error(response, HttpStatus.forbidden, 'Local host required.');
        return;
      }
      if (request.method == 'GET' && request.uri.toString() == '/health') {
        response.headers.contentType = ContentType.json;
        response.write(
          jsonEncode({
            'service': 'rijvia-local-contact-gateway',
            'processId': pid,
            'port': port,
          }),
        );
        return;
      }
      if (request.uri.toString() != '/api/contact') {
        _error(response, HttpStatus.notFound, 'Not found.');
        return;
      }
      if (request.headers.value('Origin') != allowedOrigin) {
        _error(
          response,
          HttpStatus.forbidden,
          'Local Flutter origin required.',
        );
        return;
      }
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
      if (request.method == 'OPTIONS') {
        final requestedHeaders =
            (request.headers.value('Access-Control-Request-Headers') ?? '')
                .toLowerCase()
                .split(',')
                .map((header) => header.trim())
                .where((header) => header.isNotEmpty);
        if (request.headers.value('Access-Control-Request-Method') != 'POST' ||
            requestedHeaders.any(
              (header) => !['content-type', 'accept-language'].contains(header),
            )) {
          _error(response, HttpStatus.forbidden, 'Unsupported preflight.');
          return;
        }
        response.headers
          ..set('Access-Control-Allow-Methods', 'POST, OPTIONS')
          ..set(
            'Access-Control-Allow-Headers',
            'Content-Type, Accept-Language',
          );
        response.statusCode = HttpStatus.noContent;
        return;
      }
      if (request.method != 'POST') {
        response.headers.set(HttpHeaders.allowHeader, 'POST, OPTIONS');
        _error(response, HttpStatus.methodNotAllowed, 'POST required.');
        return;
      }
      if (request.headers.contentType?.mimeType != 'application/json') {
        _error(response, HttpStatus.unsupportedMediaType, 'JSON required.');
        return;
      }
      if (request.contentLength > maxBodyBytes) {
        _error(
          response,
          HttpStatus.requestEntityTooLarge,
          'Request too large.',
        );
        return;
      }
      final body = await _readLimited(request).timeout(_timeout);
      HttpClientRequest? outgoing;
      try {
        final result = await (() async {
          final upstream = await _client.postUrl(_endpoint);
          outgoing = upstream;
          upstream.followRedirects = false;
          upstream.headers.contentType = ContentType.json;
          final language = request.headers.value(
            HttpHeaders.acceptLanguageHeader,
          );
          if (language != null) {
            upstream.headers.set(HttpHeaders.acceptLanguageHeader, language);
          }
          upstream.add(body);
          final reply = await upstream.close();
          return (
            status: reply.statusCode,
            type: reply.headers.contentType,
            bytes: await _readLimited(reply),
          );
        })().timeout(_timeout);
        response.statusCode = result.status;
        response.headers.contentType =
            result.type?.mimeType == 'application/json'
            ? ContentType.json
            : ContentType.text;
        response.add(result.bytes);
      } on TimeoutException {
        outgoing?.abort();
        _error(
          response,
          HttpStatus.gatewayTimeout,
          'Contact service timed out.',
        );
      } catch (_) {
        outgoing?.abort();
        _error(response, HttpStatus.badGateway, 'Contact service unavailable.');
      }
    } on _BodyTooLarge {
      _error(response, HttpStatus.requestEntityTooLarge, 'Request too large.');
    } on TimeoutException {
      _error(response, HttpStatus.requestTimeout, 'Request timed out.');
    } catch (_) {
      _error(response, HttpStatus.badRequest, 'Invalid request.');
    } finally {
      try {
        await response.close();
      } catch (_) {
        // A disconnected browser must not terminate the local gateway.
      }
    }
  }

  static Future<List<int>> _readLimited(Stream<List<int>> stream) async {
    final bytes = <int>[];
    await for (final chunk in stream) {
      if (bytes.length + chunk.length > maxBodyBytes) throw _BodyTooLarge();
      bytes.addAll(chunk);
    }
    return bytes;
  }

  static void _error(HttpResponse response, int status, String message) {
    response
      ..statusCode = status
      ..persistentConnection = false;
    response.headers.contentType = ContentType.json;
    response.write(jsonEncode({'error': message}));
  }
}

class _BodyTooLarge implements Exception {}

Future<void> main() async {
  final gateway = await LocalContactGateway.start();
  stdout.writeln(
    'RIJVIA_CONTACT_GATEWAY_READY http://127.0.0.1:${gateway.port}',
  );
}
