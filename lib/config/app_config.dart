import 'package:flutter/foundation.dart';

class AppConfig {
  static const String storeName = 'GlobalCart GH';
  static const String shortName = 'GlobalCart';
  static const String tagline = 'Shop Global, Pay Local';

  static const String _apiBaseUrlOverride =
      String.fromEnvironment('API_BASE_URL');

  /// Public website, used for share links and "Shop on the web".
  /// Defaults to the host serving the API, since the Next.js backend also
  /// serves the storefront.
  static const String _webBaseUrlOverride =
      String.fromEnvironment('WEB_BASE_URL');

  /// Web OAuth client id from Firebase Console, needed by Google sign-in on
  /// Android to return an ID token when google-services.json lacks one.
  static const String googleServerClientId =
      String.fromEnvironment('GOOGLE_SERVER_CLIENT_ID');

  static const String supportPhone = '024 307 3148';
  static const String supportPhoneUri = 'tel:+233243073148';
  static const String secondaryPhone = '054 134 1263';
  static const String secondaryPhoneUri = 'tel:+233541341263';
  static const String instagramUrl = 'https://www.instagram.com/globalcart_gh';
  static const String facebookUrl = 'https://www.facebook.com/GlobalCartGH';
  static const String tiktokUrl = 'https://www.tiktok.com/@globalcart_gh';
  static const String whatsappUrl = 'https://wa.me/233243073148';
  static const String telegramUrl = 'https://t.me/globalcart_gh';

  static const double freeShippingThreshold = 300;
  static const double flatShippingFee = 25;
  static const int maxQuantityPerLine = 20;
  static const int returnWindowDays = 14;

  static double shippingFeeFor(double subtotal) =>
      subtotal >= freeShippingThreshold ? 0 : flatShippingFee;

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

  static Uri get webBaseUri => _webBaseUrlOverride.isNotEmpty
      ? Uri.parse(_webBaseUrlOverride)
      : mediaBaseUri;

  static Uri webUri(String path) => webBaseUri.resolve(path);

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
