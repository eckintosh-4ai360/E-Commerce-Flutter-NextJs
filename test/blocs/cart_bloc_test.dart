import 'package:globalcart/blocs/cart/cart_bloc.dart';
import 'package:globalcart/models/cart_item.dart';
import 'package:globalcart/models/product.dart';
import 'package:globalcart/services/local_store.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

const tote = Product(
  id: 2,
  name: 'Premium Leather Tote',
  description: 'Tote',
  price: 50,
  originalPrice: 120,
  images: ['https://cdn.example.com/tote.jpg'],
  category: 'Bags',
  colors: ['Brown', 'Black'],
);

const watch = Product(
  id: 9,
  name: 'Luxury Watch',
  description: 'Watch',
  price: 350,
  images: ['https://cdn.example.com/watch.jpg'],
  category: 'Watches',
);

const soldOut = Product(
  id: 4,
  name: 'Luxury Clutch',
  description: 'Clutch',
  price: 75,
  images: [],
  category: 'Bags',
  inStock: false,
);

Future<void> settle() => Future<void>.delayed(Duration.zero);

void main() {
  late LocalStore store;

  setUp(() async {
    SharedPreferences.setMockInitialValues({});
    store = await LocalStore.open();
  });

  test('different colours of the same product are separate lines', () async {
    final bloc = CartBloc(store: store)
      ..add(const AddToCart(tote, selectedColor: 'Brown'))
      ..add(const AddToCart(tote, selectedColor: 'Black'))
      ..add(const AddToCart(tote, selectedColor: 'Brown', quantity: 2));
    await settle();

    expect(bloc.state.items, hasLength(2));
    expect(bloc.state.itemFor(CartItem.keyFor(2, 'Brown', null))!.quantity, 3);
    expect(bloc.state.totalItems, 4);
    await bloc.close();
  });

  test('defaults to the first colour when none is chosen', () async {
    final bloc = CartBloc(store: store)..add(const AddToCart(tote));
    await settle();
    expect(bloc.state.items.single.selectedColor, 'Brown');
    await bloc.close();
  });

  test('quantity is capped at 20 per line', () async {
    final bloc = CartBloc(store: store)
      ..add(const AddToCart(watch, quantity: 15))
      ..add(const AddToCart(watch, quantity: 15));
    await settle();
    expect(bloc.state.items.single.quantity, 20);

    bloc.add(UpdateCartQuantity(bloc.state.items.single.lineKey, 99));
    await settle();
    expect(bloc.state.items.single.quantity, 20);
    await bloc.close();
  });

  test('out-of-stock products are not added', () async {
    final bloc = CartBloc(store: store)..add(const AddToCart(soldOut));
    await settle();
    expect(bloc.state.items, isEmpty);
    await bloc.close();
  });

  test('totals include shipping below the free threshold only', () async {
    final bloc = CartBloc(store: store)
      ..add(const AddToCart(tote, quantity: 2));
    await settle();
    expect(bloc.state.subtotal, 100);
    expect(bloc.state.shippingFee, 25);
    expect(bloc.state.total, 125);

    bloc.add(const AddToCart(watch));
    await settle();
    expect(bloc.state.subtotal, 450);
    expect(bloc.state.shippingFee, 0);
    expect(bloc.state.total, 450);
    await bloc.close();
  });

  test('cart survives an app restart', () async {
    final first = CartBloc(store: store)
      ..add(const AddToCart(tote, selectedColor: 'Black', quantity: 3));
    await settle();
    await first.close();

    final restored = CartBloc(store: await LocalStore.open())
      ..add(const CartStarted());
    await settle();
    expect(restored.state.items.single.product.name, 'Premium Leather Tote');
    expect(restored.state.items.single.selectedColor, 'Black');
    expect(restored.state.items.single.quantity, 3);
    await restored.close();
  });

  test('catalog sync refreshes prices and drops removed products', () async {
    final bloc = CartBloc(store: store)
      ..add(const AddToCart(tote))
      ..add(const AddToCart(watch));
    await settle();

    const repriced = Product(
      id: 2,
      name: 'Premium Leather Tote',
      description: 'Tote',
      price: 60,
      images: [],
      category: 'Bags',
      colors: ['Brown', 'Black'],
    );
    bloc.add(const SyncCartWithCatalog([repriced]));
    await settle();

    expect(bloc.state.items.single.product.price, 60);
    expect(bloc.state.removedProducts, ['Luxury Watch']);
    await bloc.close();
  });

  test('removing a line by key and clearing the cart', () async {
    final bloc = CartBloc(store: store)
      ..add(const AddToCart(tote, selectedColor: 'Brown'))
      ..add(const AddToCart(tote, selectedColor: 'Black'));
    await settle();

    bloc.add(RemoveFromCart(CartItem.keyFor(2, 'Brown', null)));
    await settle();
    expect(bloc.state.items.single.selectedColor, 'Black');

    bloc.add(const ClearCart());
    await settle();
    expect(bloc.state.items, isEmpty);
    expect(store.readList(LocalStore.cartKey), isEmpty);
    await bloc.close();
  });
}
