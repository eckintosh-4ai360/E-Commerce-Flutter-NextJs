import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// Small JSON persistence layer over SharedPreferences. Corrupt or outdated
/// data is discarded instead of crashing the app on start-up.
class LocalStore {
  LocalStore(this._prefs);

  final SharedPreferences? _prefs;

  static const cartKey = 'globalcart.cart.v1';
  static const wishlistKey = 'globalcart.wishlist.v1';

  static Future<LocalStore> open() async {
    try {
      return LocalStore(await SharedPreferences.getInstance());
    } catch (_) {
      // Storage unavailable: the app still works, just without persistence.
      return LocalStore(null);
    }
  }

  List<Map<String, dynamic>> readList(String key) {
    final raw = _prefs?.getString(key);
    if (raw == null || raw.isEmpty) {
      return const [];
    }
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) {
        return const [];
      }
      return decoded.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return const [];
    }
  }

  Future<void> writeList(String key, List<Map<String, dynamic>> value) async {
    final prefs = _prefs;
    if (prefs == null) {
      return;
    }
    if (value.isEmpty) {
      await prefs.remove(key);
    } else {
      await prefs.setString(key, jsonEncode(value));
    }
  }
}
