import 'package:equatable/equatable.dart';

import '../config/app_config.dart';

class Product extends Equatable {
  final int id;
  final String name;
  final String description;
  final double price;
  final double? originalPrice;
  final List<String> images;
  final String category;
  final List<String> tags;
  final double rating;
  final int reviewCount;
  final bool inStock;
  final List<String> sizes;
  final List<String> colors;
  final bool isNew;
  final bool isBestSeller;

  const Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.images,
    required this.category,
    this.tags = const [],
    this.rating = 4.5,
    this.reviewCount = 0,
    this.inStock = true,
    this.sizes = const [],
    this.colors = const [],
    this.isNew = false,
    this.isBestSeller = false,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    final images = _extractImages(json);

    return Product(
      id: (json['id'] as num).toInt(),
      name: json['name'] as String,
      description: json['description'] as String? ?? '',
      price: (json['price'] as num).toDouble(),
      originalPrice: (json['originalPrice'] as num?)?.toDouble(),
      images: images,
      category: json['category'] as String? ?? 'General',
      tags: (json['tags'] as List<dynamic>? ?? const [])
          .map((tag) => tag.toString())
          .toList(),
      rating: (json['rating'] as num?)?.toDouble() ?? 4.5,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
      inStock: json['inStock'] as bool? ?? true,
      sizes: (json['sizes'] as List<dynamic>? ?? const [])
          .map((size) => size.toString())
          .toList(),
      colors: (json['colors'] as List<dynamic>? ?? const [])
          .map((color) => color.toString())
          .toList(),
      isNew: json['isNew'] as bool? ?? false,
      isBestSeller: json['isBestSeller'] as bool? ?? false,
    );
  }

  static List<String> _extractImages(Map<String, dynamic> json) {
    final results = <String>[];

    void addImage(dynamic value) {
      final extracted = _extractImageValue(value);
      if (extracted == null) {
        return;
      }

      final resolved = AppConfig.resolveMediaUrl(extracted);
      if (resolved.isEmpty || results.contains(resolved)) {
        return;
      }

      results.add(resolved);
    }

    final rawImages = json['images'];
    if (rawImages is List<dynamic>) {
      for (final image in rawImages) {
        addImage(image);
      }
    } else {
      addImage(rawImages);
    }

    for (final fallbackKey in const [
      'image',
      'imageUrl',
      'imageURL',
      'imagePath',
      'featuredImage',
      'featuredImageUrl',
      'featured_image',
      'thumbnail',
      'thumbnailUrl',
      'thumbnailURL',
    ]) {
      addImage(json[fallbackKey]);
    }

    return results;
  }

  static String? _extractImageValue(dynamic value) {
    if (value == null) {
      return null;
    }

    if (value is String) {
      final trimmed = value.trim();
      if (trimmed.isEmpty || trimmed == 'null' || trimmed == 'undefined') {
        return null;
      }
      return trimmed;
    }

    if (value is Map) {
      for (final key in const [
        'url',
        'src',
        'sourceUrl',
        'source_url',
        'imageUrl',
        'image_url',
        'secure_url',
        'full',
        'fullUrl',
        'full_url',
        'original',
        'originalUrl',
        'original_url',
        'path',
        'image',
        'thumbnailUrl',
        'thumbnail_url',
        'thumbnail',
        'data',
      ]) {
        final extracted = _extractImageValue(value[key]);
        if (extracted != null) {
          return extracted;
        }
      }
    }

    return null;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'originalPrice': originalPrice,
      'images': images,
      'category': category,
      'tags': tags,
      'rating': rating,
      'reviewCount': reviewCount,
      'inStock': inStock,
      'sizes': sizes,
      'colors': colors,
      'isNew': isNew,
      'isBestSeller': isBestSeller,
    };
  }

  double? get discountPercent {
    if (originalPrice != null && originalPrice! > price) {
      return ((originalPrice! - price) / originalPrice! * 100).roundToDouble();
    }
    return null;
  }

  String? get primaryImage {
    for (final image in images) {
      if (image.trim().isNotEmpty) {
        return image;
      }
    }
    return null;
  }

  bool get hasPrimaryImage => primaryImage != null;

  @override
  List<Object?> get props => [id, name, price, originalPrice, images, category];
}

// Data source - Eckintoshmall products
class ProductData {
  static const String baseUrl = 'https://Eckintoshmall.com/wp-content/uploads';

  static final List<Product> products = [
    const Product(
      id: 1,
      name: 'Ladies Top',
      description:
          'Elegant ladies top crafted with premium fabric. Perfect for casual outings or formal events.',
      price: 150.0,
      images: [
        'assets/images/ladies top.jpg',
      ],
      category: 'Bags',
      tags: ['Top', 'Fashion'],
      rating: 4.8,
      reviewCount: 24,
      isNew: true,
      inStock: true,
      colors: ['Cream', 'White', 'Black'],
    ),
    const Product(
      id: 2,
      name: 'Premium Leather Tote',
      description:
          'Elegant leather tote crafted with premium full-grain leather. Spacious interior with multiple compartments, perfect for everyday use.',
      price: 50.0,
      originalPrice: 120.0,
      images: [
        'assets/images/download (7).jpg',
      ],
      category: 'Bags',
      tags: ['Bags', 'Leather', 'Tote'],
      rating: 4.7,
      reviewCount: 18,
      isBestSeller: true,
      colors: ['Brown', 'Black', 'Tan'],
    ),
    const Product(
      id: 3,
      name: 'Chic Crossbody',
      description:
          'Chic crossbody bag with adjustable strap, ideal for hands-free convenience without compromising style.',
      price: 85.0,
      images: [
        'assets/images/download (8).jpg',
      ],
      category: 'Bags',
      tags: ['Bags', 'Crossbody'],
      rating: 4.6,
      reviewCount: 12,
      colors: ['Black', 'Caramel'],
    ),
    const Product(
      id: 4,
      name: 'Luxury Clutch',
      description:
          'Luxurious clutch bag with magnetic clasp closure. Perfect companion for formal occasions and date nights.',
      price: 75.0,
      originalPrice: 150.0,
      images: [
        'assets/images/download (9).jpg',
      ],
      category: 'Bags',
      tags: ['Bags', 'Clutch', 'Formal'],
      rating: 4.9,
      reviewCount: 31,
      isBestSeller: true,
      colors: ['Black', 'Nude', 'Red'],
    ),
    const Product(
      id: 5,
      name: 'Classic Shoulder Bag',
      description:
          'Timeless shoulder bag with gold-tone hardware. A wardrobe staple that pairs beautifully with any outfit.',
      price: 50.0,
      originalPrice: 95.0,
      images: [
        'assets/images/download (10).jpg',
      ],
      category: 'Bags',
      tags: ['Bags', 'Shoulder'],
      rating: 4.5,
      reviewCount: 9,
      colors: ['Brown', 'Black'],
    ),
    const Product(
      id: 6,
      name: 'Modern Satchel',
      description:
          'Structured satchel with top handle and detachable strap. Sophisticated design for the modern professional.',
      price: 100.0,
      originalPrice: 150.0,
      images: [
        'assets/images/download (11).jpg',
      ],
      category: 'Bags',
      tags: ['Bags', 'Satchel', 'Professional'],
      rating: 4.4,
      reviewCount: 7,
      colors: ['Navy', 'Black', 'Burgundy'],
    ),
    const Product(
      id: 7,
      name: 'Sporty Jersey',
      description:
          'High-quality jersey for sports and casual wear. Breathable material and stylish fit.',
      price: 85.0,
      originalPrice: 165.0,
      images: [
        'assets/images/jersey.jpg',
      ],
      category: 'Accessories',
      tags: ['Jersey', 'Sports'],
      rating: 4.7,
      reviewCount: 15,
      isBestSeller: true,
    ),
    const Product(
      id: 8,
      name: 'Premium Slippers',
      description:
          'Comfortable and stylish slippers for home or outdoor use. Made with durable materials.',
      price: 100.0,
      originalPrice: 200.0,
      images: [
        'assets/images/slipper.jpg',
      ],
      category: 'Shoes',
      tags: ['Shoes', 'Slippers'],
      rating: 4.8,
      reviewCount: 22,
      isNew: true,
    ),
    const Product(
      id: 9,
      name: 'Luxury Watch',
      description:
          'A timeless luxury watch that combines precision and elegance. Water-resistant and crafted with a premium finish.',
      price: 350.0,
      images: [
        'assets/images/watch.jpg',
      ],
      category: 'Watches',
      tags: ['Watches', 'Luxury', 'Accessories'],
      rating: 4.9,
      reviewCount: 44,
      isNew: true,
    ),
    const Product(
      id: 10,
      name: 'Leather Wallet',
      description:
          'Slim leather wallet with multiple card slots and cash compartment. Minimalist design for the modern individual.',
      price: 150.0,
      images: [
        'assets/images/download (9).jpg',
      ],
      category: 'Wallets',
      tags: ['Wallets', 'Leather', 'Slim'],
      rating: 4.6,
      reviewCount: 19,
      colors: ['Brown', 'Black', 'Tan'],
    ),
  ];

  static final List<String> categories = [
    'All',
    'Bags',
    'Accessories',
    'Wallets',
    'Shoes',
    'Watches',
    'Men',
    'Baby',
  ];

  static List<Product> getByCategory(String category) {
    if (category == 'All') return products;
    return products.where((p) => p.category == category).toList();
  }

  static List<Product> getSaleProducts() {
    return products.where((p) => p.discountPercent != null).toList();
  }

  static List<Product> getNewArrivals() {
    return products.where((p) => p.isNew).toList();
  }

  static List<Product> getBestSellers() {
    return products.where((p) => p.isBestSeller).toList();
  }
}
