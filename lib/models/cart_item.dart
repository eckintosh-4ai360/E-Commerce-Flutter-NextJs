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

  CartItem copyWith({int? quantity, String? selectedColor, String? selectedSize}) {
    return CartItem(
      product: product,
      quantity: quantity ?? this.quantity,
      selectedColor: selectedColor ?? this.selectedColor,
      selectedSize: selectedSize ?? this.selectedSize,
    );
  }

  double get totalPrice => product.price * quantity;

  @override
  List<Object?> get props => [product.id, quantity, selectedColor, selectedSize];
}
