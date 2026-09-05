import 'package:equatable/equatable.dart';
import '../../models/product.dart';

abstract class CartEvent extends Equatable {
  const CartEvent();
  @override
  List<Object?> get props => [];
}

/// Restores the cart saved on this device.
class CartStarted extends CartEvent {
  const CartStarted();
}

class AddToCart extends CartEvent {
  final Product product;
  final int quantity;
  final String? selectedColor;
  final String? selectedSize;
  const AddToCart(
    this.product, {
    this.quantity = 1,
    this.selectedColor,
    this.selectedSize,
  });
  @override
  List<Object?> get props => [product.id, quantity, selectedColor, selectedSize];
}

class RemoveFromCart extends CartEvent {
  final String lineKey;
  const RemoveFromCart(this.lineKey);
  @override
  List<Object?> get props => [lineKey];
}

class UpdateCartQuantity extends CartEvent {
  final String lineKey;
  final int quantity;
  const UpdateCartQuantity(this.lineKey, this.quantity);
  @override
  List<Object?> get props => [lineKey, quantity];
}

class ClearCart extends CartEvent {
  const ClearCart();
}

/// Refreshes prices and stock from the latest catalog and drops products that
/// no longer exist.
class SyncCartWithCatalog extends CartEvent {
  final List<Product> products;
  const SyncCartWithCatalog(this.products);
  @override
  List<Object?> get props => [products];
}
