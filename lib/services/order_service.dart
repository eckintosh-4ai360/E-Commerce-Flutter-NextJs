import '../models/app_order.dart';
import '../models/cart_item.dart';
import 'api_client.dart';

class HostedCheckout {
  const HostedCheckout({required this.order, required this.authorizationUrl});

  final AppOrder order;
  final String authorizationUrl;
}

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

  Future<HostedCheckout> initializePayment({
    required String requestId,
    required String customerName,
    required String customerPhone,
    required String deliveryAddress,
    required List<CartItem> items,
    required double expectedTotal,
    String? notes,
  }) async {
    final payload = await _api.post(
      '/payments/paystack/hosted',
      auth: true,
      timeout: const Duration(seconds: 30),
      headers: {'Idempotency-Key': requestId},
      body: {
        'customerName': customerName,
        'customerPhone': customerPhone,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': 'PAYSTACK',
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

    return HostedCheckout(
      order: AppOrder.fromJson(payload['order'] as Map<String, dynamic>),
      authorizationUrl: payload['authorizationUrl'] as String,
    );
  }

  /// Looks an order up by tracking code. Signed-in owners get full details;
  /// everyone else gets the public view.
  Future<AppOrder> trackOrder(String reference,
      {bool requireAuth = false}) async {
    final cleaned = reference.trim().replaceFirst('#', '');
    final payload = await _api.get('/orders/${Uri.encodeComponent(cleaned)}',
        auth: requireAuth);
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
