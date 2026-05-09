import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/app_order.dart';
import '../models/cart_item.dart';

class OrderService {
  OrderService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<AppOrder> createOrder({
    required String customerName,
    required String customerPhone,
    required List<CartItem> items,
    String? customerEmail,
    String? deliveryAddress,
    String? notes,
  }) async {
    final response = await _client
        .post(
          Uri.parse('${AppConfig.apiBaseUrl}/orders'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({
            'customerName': customerName,
            'customerPhone': customerPhone,
            'customerEmail': customerEmail,
            'deliveryAddress': deliveryAddress,
            'notes': notes,
            'items': items
                .map(
                  (item) => {
                    'productId': item.product.id,
                    'quantity': item.quantity,
                    'selectedColor': item.selectedColor,
                    'selectedSize': item.selectedSize,
                  },
                )
                .toList(),
          }),
        )
        .timeout(const Duration(seconds: 10));

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        payload['error'] as String? ?? 'We could not place the order.',
      );
    }

    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }

  Future<AppOrder> trackOrder(String orderId) async {
    final response = await _client
        .get(Uri.parse('${AppConfig.apiBaseUrl}/orders/$orderId'))
        .timeout(const Duration(seconds: 10));
    final payload = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        payload['error'] as String? ?? 'We could not find that order.',
      );
    }

    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }
}
