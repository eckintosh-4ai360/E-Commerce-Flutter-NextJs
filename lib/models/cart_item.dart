import 'package:equatable/equatable.dart';
import 'product.dart';

class CartItem extends Equatable {
  final Product product;
  final int quantity;
  final String? selectedColor;
  final String? selectedSize;

  const CartItem({
    required this.product,
    this.quantity = 1,
    this.selectedColor,
    this.selectedSize,
  });

  /// Identifies a cart line: the same product in another colour or size is a
  /// separate line.
  static String keyFor(int productId, String? color, String? size) =>
      '$productId|${color ?? ''}|${size ?? ''}';

  String get lineKey => keyFor(product.id, selectedColor, selectedSize);

  CartItem copyWith({int? quantity, Product? product}) {
    return CartItem(
      product: product ?? this.product,
      quantity: quantity ?? this.quantity,
      selectedColor: selectedColor,
      selectedSize: selectedSize,
    );
  }

  double get totalPrice => product.price * quantity;

  String get optionsLabel => [
        if (selectedColor != null) selectedColor!,
        if (selectedSize != null) 'Size $selectedSize',
      ].join(' · ');

  Map<String, dynamic> toJson() => {
        'product': product.toJson(),
        'quantity': quantity,
        'selectedColor': selectedColor,
        'selectedSize': selectedSize,
      };

  static CartItem? tryParse(Map<String, dynamic> json) {
    try {
      final quantity = (json['quantity'] as num?)?.toInt() ?? 1;
      if (quantity < 1) {
        return null;
      }
      return CartItem(
        product: Product.fromJson(json['product'] as Map<String, dynamic>),
        quantity: quantity,
        selectedColor: json['selectedColor'] as String?,
        selectedSize: json['selectedSize'] as String?,
      );
    } catch (_) {
      return null;
    }
  }

  @override
  List<Object?> get props => [product, quantity, selectedColor, selectedSize];
}
