import '../models/app_order.dart';
import '../models/cart_item.dart';
import 'api_client.dart';

class OrderService {
  OrderService(this._api);

  final ApiClient _api;

  /// Orders placed by the signed-in customer, on the app or the website.
  Future<List<AppOrder>> listMyOrders() async {
    final payload = await _api.get('/orders', auth: true);
    return (payload['orders'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(AppOrder.fromJson)
        .toList();
  }

  Future<AppOrder> createOrder({
    required String requestId,
    required String customerName,
    required String customerPhone,
    required String deliveryAddress,
    required String paymentMethod,
    required List<CartItem> items,
    required double expectedTotal,
    String? notes,
  }) async {
    final payload = await _api.post(
      '/orders',
      auth: true,
      headers: {'Idempotency-Key': requestId},
      body: {
        'customerName': customerName,
        'customerPhone': customerPhone,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod,
        'notes': notes,
        'expectedTotal': expectedTotal,
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
      },
    );

    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }

  /// Looks an order up by tracking code. Signed-in owners get full details;
  /// everyone else gets the public view.
  Future<AppOrder> trackOrder(String reference) async {
    final cleaned = reference.trim().replaceFirst('#', '');
    final payload = await _api.get('/orders/${Uri.encodeComponent(cleaned)}');
    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }

  Future<AppOrder> cancelOrder(String orderId) async {
    final payload = await _api.post(
      '/orders/${Uri.encodeComponent(orderId)}/cancel',
      auth: true,
    );
    return AppOrder.fromJson(payload['order'] as Map<String, dynamic>);
  }
}
