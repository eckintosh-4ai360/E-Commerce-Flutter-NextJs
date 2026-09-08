import 'package:flutter_bloc/flutter_bloc.dart';

import '../../config/app_config.dart';
import '../../models/cart_item.dart';
import '../../models/product.dart';
import '../../services/local_store.dart';
import 'cart_event.dart';
import 'cart_state.dart';

export 'cart_event.dart';
export 'cart_state.dart';

class CartBloc extends Bloc<CartEvent, CartState> {
  CartBloc({LocalStore? store})
      : _store = store,
        super(const CartState()) {
    on<CartStarted>(_onStarted);
    on<AddToCart>(_onAddToCart);
    on<RemoveFromCart>(_onRemoveFromCart);
    on<UpdateCartQuantity>(_onUpdateQuantity);
    on<ClearCart>(_onClearCart);
    on<SyncCartWithCatalog>(_onSync);
  }

  final LocalStore? _store;

  void _onStarted(CartStarted event, Emitter<CartState> emit) {
    final saved = _store
            ?.readList(LocalStore.cartKey)
            .map(CartItem.tryParse)
            .whereType<CartItem>()
            .toList() ??
        const <CartItem>[];
    if (saved.isNotEmpty) {
      emit(state.copyWith(items: saved));
    }
  }

  void _onAddToCart(AddToCart event, Emitter<CartState> emit) {
    if (!event.product.inStock) {
      return;
    }
    final color = event.selectedColor ??
        (event.product.colors.isEmpty ? null : event.product.colors.first);
    final size = event.selectedSize ??
        (event.product.sizes.isEmpty ? null : event.product.sizes.first);
    final key = CartItem.keyFor(event.product.id, color, size);
    final quantity = event.quantity < 1 ? 1 : event.quantity;

    final items = List<CartItem>.from(state.items);
    final index = items.indexWhere((item) => item.lineKey == key);
    if (index >= 0) {
      items[index] = items[index].copyWith(
        product: event.product,
        quantity: _clamp(items[index].quantity + quantity),
      );
    } else {
      items.add(CartItem(
        product: event.product,
        quantity: _clamp(quantity),
        selectedColor: color,
        selectedSize: size,
      ));
    }
    _emitAndSave(emit, items);
  }

  void _onRemoveFromCart(RemoveFromCart event, Emitter<CartState> emit) {
    _emitAndSave(
      emit,
      state.items.where((item) => item.lineKey != event.lineKey).toList(),
    );
  }

  void _onUpdateQuantity(UpdateCartQuantity event, Emitter<CartState> emit) {
    if (event.quantity <= 0) {
      _onRemoveFromCart(RemoveFromCart(event.lineKey), emit);
      return;
    }
    _emitAndSave(
      emit,
      state.items
          .map((item) => item.lineKey == event.lineKey
              ? item.copyWith(quantity: _clamp(event.quantity))
              : item)
          .toList(),
    );
  }

  void _onClearCart(ClearCart event, Emitter<CartState> emit) {
    _emitAndSave(emit, const []);
  }

  void _onSync(SyncCartWithCatalog event, Emitter<CartState> emit) {
    if (state.items.isEmpty || event.products.isEmpty) {
      return;
    }
    final fresh = {for (final product in event.products) product.id: product};
    final removed = <String>[];
    final items = <CartItem>[];
    for (final item in state.items) {
      final Product? product = fresh[item.product.id];
      if (product == null) {
        removed.add(item.product.name);
      } else {
        items.add(item.copyWith(product: product));
      }
    }
    _emitAndSave(emit, items, removed: removed);
  }

  int _clamp(int quantity) => quantity > AppConfig.maxQuantityPerLine
      ? AppConfig.maxQuantityPerLine
      : quantity;

  void _emitAndSave(
    Emitter<CartState> emit,
    List<CartItem> items, {
    List<String> removed = const [],
  }) {
    emit(state.copyWith(items: items, removedProducts: removed));
    _store?.writeList(
      LocalStore.cartKey,
      items.map((item) => item.toJson()).toList(),
    );
  }
}
