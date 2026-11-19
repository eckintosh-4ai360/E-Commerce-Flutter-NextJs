import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:globacart/blocs/cart/cart_bloc.dart';
import 'package:globacart/blocs/navigation/navigation_bloc.dart';
import 'package:globacart/blocs/wishlist/wishlist_bloc.dart';
import 'package:globacart/models/cart_item.dart';
import 'package:globacart/models/product.dart';
import 'package:globacart/screens/product_detail/product_detail_screen.dart';
import 'package:google_fonts/google_fonts.dart';

const shirt = Product(
  id: 101,
  name: 'Cotton shirt',
  description: 'A shirt',
  price: 50,
  images: [],
  category: 'Clothing',
  colors: ['Cream', 'Black'],
  sizes: ['S', 'M', 'L'],
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;

  testWidgets('sums size quantities across colors before adding to cart',
      (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(() {
      tester.view.resetPhysicalSize();
      tester.view.resetDevicePixelRatio();
    });

    final cart = CartBloc();
    final wishlist = WishlistBloc();
    final navigation = NavigationBloc();
    addTearDown(() async {
      await cart.close();
      await wishlist.close();
      await navigation.close();
    });

    await tester.pumpWidget(MultiBlocProvider(
      providers: [
        BlocProvider.value(value: cart),
        BlocProvider.value(value: wishlist),
        BlocProvider.value(value: navigation),
      ],
      child: const MaterialApp(home: ProductDetailScreen(product: shirt)),
    ));

    expect(find.text('Choose a color to set quantities for each size.'),
        findsOneWidget);
    expect(cart.state.items, isEmpty);

    await tester.ensureVisible(find.text('Black'));
    await tester.drag(find.byType(CustomScrollView), const Offset(0, -180));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Black'));
    await tester.pumpAndSettle();

    final medium = find.byKey(const ValueKey('size-plus-M'));
    final large = find.byKey(const ValueKey('size-plus-L'));
    await tester.ensureVisible(medium);
    await tester.tap(medium);
    await tester.pump();
    await tester.tap(medium);
    await tester.pump();
    await tester.ensureVisible(large);
    await tester.tap(large);
    await tester.pump();

    expect(find.text('Grand total · 3 selected'), findsOneWidget);
    expect(find.text('GH₵150'), findsOneWidget);

    await tester.ensureVisible(find.text('Cream'));
    await tester.drag(find.byType(CustomScrollView), const Offset(0, 180));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Cream'));
    await tester.pumpAndSettle();
    expect(find.text('Grand total · 3 selected'), findsOneWidget);

    final small = find.byKey(const ValueKey('size-plus-S'));
    await tester.ensureVisible(small);
    await tester.tap(small);
    await tester.pump();
    expect(find.text('Grand total · 4 selected'), findsOneWidget);
    expect(find.text('GH₵200'), findsOneWidget);

    await tester.ensureVisible(find.text('Black (3)'));
    await tester.drag(find.byType(CustomScrollView), const Offset(0, 200));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Black (3)'));
    await tester.pumpAndSettle();
    expect(find.text('Grand total · 4 selected'), findsOneWidget);

    await tester.tap(find.text('Add 4 to cart'));
    await tester.pump();

    expect(cart.state.items, hasLength(3));
    expect(cart.state.itemFor(CartItem.keyFor(101, 'Black', 'M'))?.quantity, 2);
    expect(cart.state.itemFor(CartItem.keyFor(101, 'Black', 'L'))?.quantity, 1);
    expect(cart.state.itemFor(CartItem.keyFor(101, 'Cream', 'S'))?.quantity, 1);
    expect(cart.state.subtotal, 200);
    expect(cart.state.total, 225);
  });
}
