import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/core/network/api_client.dart';
import 'package:mobile_app/features/public/public_page_service.dart';

import '../../tool/local_contact_gateway.dart';

void main() {
  late HttpServer source;
  late LocalContactGateway gateway;
  late HttpClient client;
  late int calls;
  late int sourceStatus;
  late Map<String, Object> sourceReply;
  late Map<String, dynamic> received;
  late Duration sourceDelay;

  setUp(() async {
    calls = 0;
    sourceStatus = 200;
    sourceReply = {'success': true};
    received = {};
    sourceDelay = Duration.zero;
    source = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    source.listen((request) async {
      try {
        calls++;
        received = {
          'path': request.uri.toString(),
          'method': request.method,
          'language': request.headers.value('accept-language'),
          'authorization': request.headers.value('authorization'),
          'cookie': request.headers.value('cookie'),
          'body': await utf8.decoder.bind(request).join(),
        };
        if (sourceDelay != Duration.zero) {
          await Future<void>.delayed(sourceDelay);
        }
        request.response
          ..statusCode = sourceStatus
          ..headers.contentType = ContentType.json
          ..write(jsonEncode(sourceReply));
        await request.response.close();
      } catch (_) {
        // Timeout/disconnection cases intentionally close the upstream socket.
      }
    });
    gateway = await LocalContactGateway.start(
      port: 0,
      contactEndpoint: Uri.parse('http://127.0.0.1:${source.port}/api/contact'),
      timeout: const Duration(milliseconds: 500),
    );
    client = HttpClient()..findProxy = (_) => 'DIRECT';
  });
  tearDown(() async {
    client.close(force: true);
    await gateway.close();
    await source.close(force: true);
  });

  Future<({int status, Map<String, String> headers, String body})> send({
    String method = 'POST',
    String path = '/api/contact',
    String? origin = LocalContactGateway.allowedOrigin,
    Map<String, String> headers = const {},
    String body = '{}',
  }) async {
    final request = await client.openUrl(
      method,
      Uri.parse('http://127.0.0.1:${gateway.port}$path'),
    );
    if (origin != null) request.headers.set('Origin', origin);
    if (method == 'POST') request.headers.contentType = ContentType.json;
    headers.forEach(request.headers.set);
    if (method == 'POST') {
      final bytes = utf8.encode(body);
      request.contentLength = bytes.length;
      request.add(bytes);
    }
    final reply = await request.close();
    return (
      status: reply.statusCode,
      headers: {
        for (final name in [
          'access-control-allow-origin',
          'access-control-allow-methods',
          'access-control-allow-headers',
          'access-control-allow-credentials',
        ])
          name: reply.headers.value(name) ?? '',
      },
      body: await utf8.decoder.bind(reply).join(),
    );
  }

  test(
    'health identifies the local runner without contacting the web service',
    () async {
      final reply = await send(method: 'GET', path: '/health', origin: null);
      expect(reply.status, 200);
      expect(jsonDecode(reply.body), {
        'service': 'rijvia-local-contact-gateway',
        'processId': pid,
        'port': gateway.port,
      });
      expect(calls, 0);
    },
  );

  test('the exact Flutter preflight permits JSON and language only', () async {
    final reply = await send(
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, accept-language',
      },
    );
    expect(reply.status, 204);
    expect(
      reply.headers['access-control-allow-origin'],
      LocalContactGateway.allowedOrigin,
    );
    expect(reply.headers['access-control-allow-methods'], 'POST, OPTIONS');
    expect(
      reply.headers['access-control-allow-headers'],
      'Content-Type, Accept-Language',
    );
    expect(reply.headers['access-control-allow-credentials'], isEmpty);
    expect(reply.body, isEmpty);
    expect(calls, 0);
  });

  test('foreign and missing origins never reach the web service', () async {
    for (final origin in [
      null,
      'http://localhost:63785',
      'https://example.test',
      'null',
    ]) {
      final reply = await send(origin: origin);
      expect(reply.status, 403);
      expect(reply.headers['access-control-allow-origin'], isEmpty);
    }
    expect(calls, 0);
  });

  test(
    'unrelated routes, methods and headers cannot turn it into a general proxy',
    () async {
      expect((await send(path: '/api/users/me')).status, 404);
      expect(
        (await send(path: '/api/contact?target=http://example.test')).status,
        404,
      );
      expect((await send(method: 'GET')).status, 405);
      expect(
        (await send(
          method: 'OPTIONS',
          headers: {
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'authorization',
          },
        )).status,
        403,
      );
      expect((await send(headers: {'Content-Type': 'text/plain'})).status, 415);
      expect(calls, 0);
    },
  );

  for (final status in [200, 400, 429, 500]) {
    test(
      'upstream $status and JSON are preserved without fabricated success',
      () async {
        sourceStatus = status;
        sourceReply = status == 200
            ? {'success': true}
            : {'error': 'خطأ من الخدمة'};
        const form = {
          'firstName': 'Fixture',
          'lastName': 'Only',
          'email': 'fixture@example.test',
          'subject': 'Fixture',
          'message': 'اختبار محلي لا يغادر الخادم التجريبي',
        };
        final reply = await send(
          headers: {
            'Accept-Language': 'ar',
            'Authorization': 'test-only',
            'Cookie': 'test-only=1',
          },
          body: jsonEncode(form),
        );
        expect(reply.status, status);
        expect(jsonDecode(reply.body), sourceReply);
        expect(
          reply.headers['access-control-allow-origin'],
          LocalContactGateway.allowedOrigin,
        );
        expect(calls, 1);
        expect(received['method'], 'POST');
        expect(received['path'], '/api/contact');
        expect(received['language'], 'ar');
        expect(jsonDecode(received['body'] as String), form);
        expect(received['authorization'], isNull);
        expect(received['cookie'], isNull);
      },
    );
  }

  test(
    'oversized requests are rejected before contacting the web service',
    () async {
      final reply = await send(
        body: 'x' * (LocalContactGateway.maxBodyBytes + 1),
      );
      expect(reply.status, 413);
      expect(calls, 0);
    },
  );

  test(
    'a stopped upstream produces a bounded gateway failure and never success',
    () async {
      await source.close(force: true);
      final reply = await send();
      // Windows may time out while establishing the refused local connection.
      expect(reply.status, anyOf(502, 504));
      expect(jsonDecode(reply.body), contains('error'));
      expect(jsonDecode(reply.body), isNot(contains('success')));
    },
  );

  test('a stalled upstream produces a bounded 504 response', () async {
    sourceDelay = const Duration(seconds: 1);
    final reply = await send();
    expect(reply.status, 504);
    expect(jsonDecode(reply.body), isNot(contains('success')));
  });

  test(
    'Flutter contact service sends the actual fields and language through the gateway',
    () async {
      final dio = Dio(
        BaseOptions(
          baseUrl: 'http://127.0.0.1:${gateway.port}',
          headers: {'Origin': LocalContactGateway.allowedOrigin},
        ),
      );
      addTearDown(() => dio.close(force: true));
      final service = PublicPageService(ApiClient(), webClient: dio);
      const form = {
        'firstName': 'Fixture',
        'lastName': 'Only',
        'email': 'fixture@example.test',
        'subject': 'Fixture',
        'message': 'Isolated transport test only',
      };
      await service.contact(form, 'nl');
      expect(jsonDecode(received['body'] as String), form);
      expect(received['language'], 'nl');
      sourceReply = {'success': false};
      await expectLater(service.contact(form, 'fr'), throwsStateError);
      expect(received['language'], 'fr');
      expect(calls, 2);
    },
  );

  test('contact override does not change the web source URL', () {
    const configured = String.fromEnvironment('CONTACT_BASE_URL');
    expect(
      PublicPageService.contactOrigin,
      configured.isEmpty ? PublicPageService.webOrigin : configured,
    );
    expect(PublicPageService.webOrigin, isNot('http://127.0.0.1:63784'));
  });

  test(
    'an external or credential-bearing upstream cannot be configured',
    () async {
      for (final endpoint in [
        'https://example.test/api/contact',
        'http://user:pass@localhost/api/contact',
        'http://localhost/api/users',
        'http://localhost/api/contact?target=other',
      ]) {
        await expectLater(
          LocalContactGateway.start(
            port: 0,
            contactEndpoint: Uri.parse(endpoint),
          ),
          throwsArgumentError,
        );
      }
    },
  );
}
