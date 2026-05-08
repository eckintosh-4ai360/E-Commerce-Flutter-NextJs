import 'package:flutter_bloc/flutter_bloc.dart';
import 'cart_event.dart';
import 'cart_state.dart';
import '../../models/cart_item.dart';

export 'cart_event.dart';
export 'cart_state.dart';

class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc() : super(const CartState()) {
    on<AddToCart>(_onAddToCart);
    on<RemoveFromCart>(_onRemoveFromCart);
    on<UpdateCartQuantity>(_onUpdateQuantity);
    on<ClearCart>(_onClearCart);
  }

  void _onAddToCart(AddToCart event, Emitter<CartState> emit) {
    final existingIndex =
        state.items.indexWhere((item) => item.product.id == event.product.id);
    final updatedItems = List<CartItem>.from(state.items);

    if (existingIndex >= 0) {
      updatedItems[existingIndex] = updatedItems[existingIndex]
          .copyWith(quantity: updatedItems[existingIndex].quantity + 1);
    } else {
      updatedItems.add(CartItem(
        product: event.product,
        selectedColor: event.selectedColor,
        selectedSize: event.selectedSize,
      ));
    }
    emit(state.copyWith(items: updatedItems));
  }

  void _onRemoveFromCart(RemoveFromCart event, Emitter<CartState> emit) {
    final updatedItems =
        state.items.where((item) => item.product.id != event.productId).toList();
    emit(state.copyWith(items: updatedItems));
  }

  void _onUpdateQuantity(UpdateCartQuantity event, Emitter<CartState> emit) {
    if (event.quantity <= 0) {
      add(RemoveFromCart(event.productId));
      return;
    }
    final updatedItems = state.items.map((item) {
      if (item.product.id == event.productId) {
        return item.copyWith(quantity: event.quantity);
      }
      return item;
    }).toList();
    emit(state.copyWith(items: updatedItems));
  }

  void _onClearCart(ClearCart event, Emitter<CartState> emit) {
    emit(const CartState());
  }
}
