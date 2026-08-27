import '../models/account_models.dart';
import '../models/product.dart';
import '../models/return_request.dart';
import 'api_client.dart';

/// Account data shared with the website: profile, addresses, wishlist and
/// return requests.
class AccountService {
  AccountService(this._api);

  final ApiClient _api;

  Future<CustomerProfile> getProfile() async {
    final payload = await _api.get('/me', auth: true);
    return CustomerProfile.fromJson(payload['profile'] as Map<String, dynamic>);
  }

  Future<CustomerProfile> updateProfile({
    String? name,
    String? phone,
    String? preferredPaymentMethod,
  }) async {
    final payload = await _api.patch('/me', body: {
      if (name != null) 'name': name,
      if (phone != null) 'phone': phone,
      if (preferredPaymentMethod != null)
        'preferredPaymentMethod': preferredPaymentMethod,
    });
    return CustomerProfile.fromJson(payload['profile'] as Map<String, dynamic>);
  }

  Future<List<DeliveryAddress>> listAddresses() async {
    final payload = await _api.get('/me/addresses', auth: true);
    return (payload['addresses'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DeliveryAddress.fromJson)
        .toList();
  }

  Future<DeliveryAddress> saveAddress(Map<String, dynamic> body,
      {String? id}) async {
    final payload = id == null
        ? await _api.post('/me/addresses', auth: true, body: body)
        : await _api.put('/me/addresses/$id', body: body);
    return DeliveryAddress.fromJson(payload['address'] as Map<String, dynamic>);
  }

  Future<void> deleteAddress(String id) => _api.delete('/me/addresses/$id');

  Future<List<Product>> mergeWishlist(List<int> productIds) async {
    final payload = await _api.post(
      '/me/wishlist',
      auth: true,
      body: {'productIds': productIds},
    );
    return _products(payload);
  }

  Future<void> removeFromWishlist(int productId) =>
      _api.delete('/me/wishlist/$productId');

  Future<List<ReturnRequest>> listReturns() async {
    final payload = await _api.get('/me/returns', auth: true);
    return (payload['returns'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ReturnRequest.fromJson)
        .toList();
  }

  Future<String> requestReturn({
    required String orderId,
    required String reason,
    String? details,
  }) async {
    final payload = await _api.post('/me/returns', auth: true, body: {
      'orderId': orderId,
      'reason': reason,
      'details': details,
    });
    return payload['message'] as String? ?? 'Return request submitted.';
  }

  List<Product> _products(Map<String, dynamic> payload) {
    return (payload['products'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(Product.fromJson)
        .toList();
  }
}
