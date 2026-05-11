import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;

import '../config/app_config.dart';
import '../models/app_order.dart';
import '../models/cart_item.dart';

class OrderService {
  OrderService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  Future<List<AppOrder>> listOrders({
    String? customerEmail,
    String? customerPhone,
  }) async {
    final uri = Uri.parse('${AppConfig.apiBaseUrl}/orders').replace(
      queryParameters: {
        if (customerEmail != null && customerEmail.trim().isNotEmpty)
          'email': customerEmail.trim(),
        if (customerPhone != null && customerPhone.trim().isNotEmpty)
          'phone': customerPhone.trim(),
      },
    );

    late final http.Response response;

    try {
      response = await _client.get(uri).timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw Exception(
        'The orders service took too long to respond. Make sure the backend is running at ${AppConfig.apiBaseUrl}.',
      );
    } on http.ClientException {
      throw Exception(
        'We could not reach the orders service at ${AppConfig.apiBaseUrl}.',
      );
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        payload['error'] as String? ?? 'We could not load your orders.',
      );
    }

    return (payload['orders'] as List<dynamic>? ?? const [])
        .map((item) => AppOrder.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<AppOrder> createOrder({
    required String idToken,
    required String customerName,
    required String customerPhone,
    required List<CartItem> items,
    String? customerEmail,
    String? deliveryAddress,
    String? notes,
  }) async {
    late final http.Response response;

    try {
      response = await _client
          .post(
            Uri.parse('${AppConfig.apiBaseUrl}/orders'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer $idToken',
            },
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
    } on TimeoutException {
      throw Exception(
        'The checkout service took too long to respond. Make sure the backend is running at ${AppConfig.apiBaseUrl}.',
      );
    } on http.ClientException {
      throw Exception(
        'We could not reach the checkout service at ${AppConfig.apiBaseUrl}. If you are running the web app locally, make sure the backend is running and CORS allows the Authorization header.',
      );
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        payload['error'] as String? ?? 'We could not place the order.',
      );
    }

    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }

  Future<AppOrder> trackOrder(String orderId) async {
    late final http.Response response;

    try {
      response = await _client
          .get(Uri.parse('${AppConfig.apiBaseUrl}/orders/$orderId'))
          .timeout(const Duration(seconds: 10));
    } on TimeoutException {
      throw Exception(
        'The order tracking service took too long to respond. Make sure the backend is running at ${AppConfig.apiBaseUrl}.',
      );
    } on http.ClientException {
      throw Exception(
        'We could not reach the order tracking service at ${AppConfig.apiBaseUrl}.',
      );
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        payload['error'] as String? ?? 'We could not find that order.',
      );
    }

    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }
}
