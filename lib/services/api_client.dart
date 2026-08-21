import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';

class ApiException implements Exception {
  const ApiException(this.message, {this.statusCode, this.details});

  final String message;
  final int? statusCode;
  final Object? details;

  bool get isUnauthorized => statusCode == 401;
  bool get isConflict => statusCode == 409;

  @override
  String toString() => message;
}

/// Supplies a fresh Firebase ID token, or null when signed out.
typedef TokenProvider = Future<String?> Function();

/// Thin JSON client for the Next.js API: timeouts, auth header and error
/// messages in one place.
class ApiClient {
  ApiClient({http.Client? client, TokenProvider? tokenProvider})
      : _client = client ?? http.Client(),
        _tokenProvider = tokenProvider;

  final http.Client _client;
  final TokenProvider? _tokenProvider;

  static const _timeout = Duration(seconds: 15);

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = AppConfig.apiBaseUrl.endsWith('/')
        ? AppConfig.apiBaseUrl.substring(0, AppConfig.apiBaseUrl.length - 1)
        : AppConfig.apiBaseUrl;
    final uri = Uri.parse('$base$path');
    return query == null || query.isEmpty
        ? uri
        : uri.replace(queryParameters: query);
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, String>? query,
    bool auth = false,
  }) =>
      _send('GET', path, query: query, auth: auth);

  Future<Map<String, dynamic>> post(
    String path, {
    Object? body,
    bool auth = false,
    Map<String, String>? headers,
  }) =>
      _send('POST', path, body: body, auth: auth, headers: headers);

  Future<Map<String, dynamic>> put(String path, {Object? body}) =>
      _send('PUT', path, body: body, auth: true);

  Future<Map<String, dynamic>> patch(String path, {Object? body}) =>
      _send('PATCH', path, body: body, auth: true);

  Future<Map<String, dynamic>> delete(String path) =>
      _send('DELETE', path, auth: true);

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
    bool auth = false,
    Map<String, String>? headers,
  }) async {
    final requestHeaders = <String, String>{
      'Accept': 'application/json',
      if (body != null) 'Content-Type': 'application/json',
      ...?headers,
    };

    final provider = _tokenProvider;
    if (provider != null) {
      final token = await provider();
      if (token != null && token.isNotEmpty) {
        requestHeaders['Authorization'] = 'Bearer $token';
      } else if (auth) {
        throw const ApiException('Sign in with Google to continue.',
            statusCode: 401);
      }
    } else if (auth) {
      throw const ApiException('Sign in with Google to continue.',
          statusCode: 401);
    }

    final request = http.Request(method, _uri(path, query))
      ..headers.addAll(requestHeaders);
    if (body != null) {
      request.body = jsonEncode(body);
    }

    late http.Response response;
    try {
      final streamed = await _client.send(request).timeout(_timeout);
      response = await http.Response.fromStream(streamed).timeout(_timeout);
    } on TimeoutException {
      throw const ApiException(
        'The store is taking too long to respond. Check your connection and try again.',
      );
    } on http.ClientException {
      throw ApiException(
        'We could not reach the store at ${AppConfig.apiBaseUrl}. Check your connection and try again.',
      );
    }

    Map<String, dynamic> payload = const {};
    if (response.body.isNotEmpty) {
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          payload = decoded;
        }
      } on FormatException {
        payload = const {};
      }
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        payload['error'] as String? ??
            'Request failed (${response.statusCode}). Please try again.',
        statusCode: response.statusCode,
        details: payload['details'],
      );
    }

    return payload;
  }
}
