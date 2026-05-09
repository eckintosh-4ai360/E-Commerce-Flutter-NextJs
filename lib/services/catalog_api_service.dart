import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/product.dart';

class CatalogApiResponse {
  const CatalogApiResponse({
    required this.products,
    required this.categories,
    this.source = 'database',
  });

  final List<Product> products;
  final List<String> categories;
  final String source;
}

class CatalogApiService {
  CatalogApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<CatalogApiResponse> fetchCatalog() async {
    final response = await _client
        .get(Uri.parse('${AppConfig.apiBaseUrl}/catalog'))
        .timeout(const Duration(seconds: 6));

    if (response.statusCode != 200) {
      throw Exception('Catalog request failed with ${response.statusCode}');
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    final products = (payload['products'] as List<dynamic>? ?? const [])
        .map((item) => Product.fromJson(item as Map<String, dynamic>))
        .toList();
    final categories = (payload['categories'] as List<dynamic>? ?? const [])
        .map((item) => item.toString())
        .toList();

    return CatalogApiResponse(
      products: products,
      categories: categories,
      source: payload['source'] as String? ?? 'database',
    );
  }
}
