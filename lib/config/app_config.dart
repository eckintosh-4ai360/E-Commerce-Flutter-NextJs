import 'package:flutter/foundation.dart';

class AppConfig {
  static const String _apiBaseUrlOverride =
      String.fromEnvironment('API_BASE_URL');

  static String get apiBaseUrl {
    if (_apiBaseUrlOverride.isNotEmpty) {
      return _apiBaseUrlOverride;
    }

    if (kIsWeb) {
      return 'http://localhost:3000/api';
    }

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3000/api';
      default:
        return 'http://127.0.0.1:3000/api';
    }
  }

  static Uri get apiBaseUri => Uri.parse(apiBaseUrl);

  static Uri get mediaBaseUri => apiBaseUri.resolve('/');

  static String resolveMediaUrl(String value) {
    final trimmedValue = value.trim();
    if (trimmedValue.isEmpty || trimmedValue.startsWith('assets/')) {
      return trimmedValue;
    }

    final parsed = Uri.tryParse(trimmedValue);
    if (parsed == null) {
      return mediaBaseUri.resolve(trimmedValue).toString();
    }

    if (!parsed.hasScheme) {
      return mediaBaseUri.resolveUri(parsed).toString();
    }

    final shouldRewriteLoopbackHost = _isLoopbackHost(parsed.host) &&
        (parsed.host != mediaBaseUri.host ||
            parsed.port != mediaBaseUri.port ||
            parsed.scheme != mediaBaseUri.scheme);

    if (!shouldRewriteLoopbackHost) {
      return trimmedValue;
    }

    return mediaBaseUri
        .replace(
          path: parsed.path.startsWith('/') ? parsed.path : '/${parsed.path}',
          query: parsed.hasQuery ? parsed.query : null,
          fragment: parsed.hasFragment ? parsed.fragment : null,
        )
        .toString();
  }

  static bool _isLoopbackHost(String host) {
    return host == 'localhost' || host == '127.0.0.1' || host == '10.0.2.2';
  }
}
