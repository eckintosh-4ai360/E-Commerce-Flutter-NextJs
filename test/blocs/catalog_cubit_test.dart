import 'package:eckintosh/blocs/catalog/catalog_cubit.dart';
import 'package:eckintosh/models/product.dart';
import 'package:eckintosh/repositories/catalog_repository.dart';
import 'package:flutter_test/flutter_test.dart';

class _RecoveringCatalogRepository extends CatalogRepository {
  int calls = 0;

  @override
  Future<CatalogRepositoryResult> fetchCatalog() async {
    calls += 1;
    if (calls == 1) {
      return CatalogRepositoryResult(
        products: ProductData.products,
        categories: const ['Bags'],
        isFallback: true,
        source: 'embedded-demo',
        message: 'Using the demo catalog.',
      );
    }

    return CatalogRepositoryResult(
      products: ProductData.products,
      categories: const ['Bags'],
      isFallback: false,
      source: 'database',
    );
  }
}

void main() {
  test('quietly retries the demo catalog and switches back to the backend',
      () async {
    final repository = _RecoveringCatalogRepository();
    final cubit = CatalogCubit(
      repository: repository,
      retryDelay: const Duration(milliseconds: 20),
    );

    await cubit.loadCatalog();
    expect(cubit.state.isFallback, isTrue);
    expect(cubit.state.source, 'embedded-demo');

    await Future<void>.delayed(const Duration(milliseconds: 80));

    expect(repository.calls, 2);
    expect(cubit.state.isFallback, isFalse);
    expect(cubit.state.source, 'database');
    expect(cubit.state.message, isNull);

    await cubit.close();
  });
}
