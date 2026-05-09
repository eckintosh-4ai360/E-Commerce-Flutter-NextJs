import '../models/product.dart';
import '../services/catalog_api_service.dart';

class CatalogRepositoryResult {
  const CatalogRepositoryResult({
    required this.products,
    required this.categories,
    required this.isFallback,
    required this.source,
    this.message,
  });

  final List<Product> products;
  final List<String> categories;
  final bool isFallback;
  final String source;
  final String? message;
}

class CatalogRepository {
  CatalogRepository({CatalogApiService? apiService})
      : _apiService = apiService ?? CatalogApiService();

  final CatalogApiService _apiService;

  Future<CatalogRepositoryResult> fetchCatalog() async {
    try {
      final response = await _apiService.fetchCatalog();
      return CatalogRepositoryResult(
        products: response.products,
        categories: response.categories,
        isFallback: false,
        source: response.source,
      );
    } catch (_) {
      return CatalogRepositoryResult(
        products: ProductData.products,
        categories: _fallbackCategories(ProductData.products),
        isFallback: true,
        source: 'embedded-demo',
        message:
            'Backend unavailable, so the app is showing the built-in demo catalog.',
      );
    }
  }

  List<String> _fallbackCategories(List<Product> products) {
    final categories = <String>{};
    for (final product in products) {
      categories.add(product.category);
    }

    final sortedCategories = categories.toList()..sort();
    return sortedCategories;
  }
}
