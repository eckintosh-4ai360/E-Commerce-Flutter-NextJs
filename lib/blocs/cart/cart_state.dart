import 'package:equatable/equatable.dart';

import '../../config/app_config.dart';
import '../../models/cart_item.dart';

class CartState extends Equatable {
  final List<CartItem> items;

  /// Names of products removed by the last catalog sync, for a one-off notice.
  final List<String> removedProducts;

  const CartState({this.items = const [], this.removedProducts = const []});

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _round(items.fold(0.0, (sum, item) => sum + item.totalPrice));

  /// Kept for older call sites; equals [subtotal].
  double get totalPrice => subtotal;

  double get shippingFee =>
      items.isEmpty ? 0 : AppConfig.shippingFeeFor(subtotal);

  double get total => _round(subtotal + shippingFee);

  bool get hasUnavailableItems => items.any((item) => !item.product.inStock);

  bool containsProduct(int productId) =>
      items.any((item) => item.product.id == productId);

  CartItem? itemFor(String lineKey) {
    for (final item in items) {
      if (item.lineKey == lineKey) {
        return item;
      }
    }
    return null;
  }

  CartState copyWith({List<CartItem>? items, List<String>? removedProducts}) =>
      CartState(
        items: items ?? this.items,
        removedProducts: removedProducts ?? const [],
      );

  static double _round(double value) => (value * 100).roundToDouble() / 100;

  @override
  List<Object?> get props => [items, removedProducts];
}
