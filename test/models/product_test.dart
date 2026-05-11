import 'package:eckintosh/config/app_config.dart';
import 'package:eckintosh/models/product.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Product.fromJson image parsing', () {
    test('uses direct image strings from the images list', () {
      final product = Product.fromJson(const {
        'id': 1,
        'name': 'Structured Bag',
        'description': 'Test product',
        'price': 120,
        'images': [
          '/products/structured-bag.jpg',
        ],
      });

      expect(
        product.primaryImage,
        AppConfig.resolveMediaUrl('/products/structured-bag.jpg'),
      );
    });

    test('prefers full image urls from CMS objects before thumbnails', () {
      final product = Product.fromJson(const {
        'id': 2,
        'name': 'CMS Product',
        'description': 'Test product',
        'price': 200,
        'images': [
          {
            'thumbnail': 'https://cdn.example.com/thumb.jpg',
            'url': 'https://cdn.example.com/full.jpg',
          },
        ],
      });

      expect(product.primaryImage, 'https://cdn.example.com/full.jpg');
      expect(
          product.images, isNot(contains('https://cdn.example.com/thumb.jpg')));
    });

    test('falls back to imagePath when images is missing', () {
      final product = Product.fromJson(const {
        'id': 3,
        'name': 'Fallback Product',
        'description': 'Test product',
        'price': 80,
        'imagePath': '/products/fallback.jpg',
      });

      expect(
        product.primaryImage,
        AppConfig.resolveMediaUrl('/products/fallback.jpg'),
      );
    });
  });
}
