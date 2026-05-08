// ignore_for_file: deprecated_member_use

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import '../blocs/cart/cart_bloc.dart';
import '../blocs/cart/cart_state.dart';
import '../blocs/navigation/navigation_bloc.dart';
import '../blocs/wishlist/wishlist_bloc.dart';
import '../screens/home/home_screen.dart';
import '../screens/shop/shop_screen.dart';
import '../screens/cart/cart_screen.dart';
import '../screens/wishlist/wishlist_screen.dart';
import '../screens/account/account_screen.dart';
import '../theme/app_theme.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key});

  @override
  Widget build(BuildContext context) {
    final screens = [
      const HomeScreen(),
      const ShopScreen(),
      const WishlistScreen(),
      const CartScreen(),
      const AccountScreen(),
    ];

    return BlocBuilder<NavigationBloc, NavigationState>(
      builder: (context, navState) {
        return Scaffold(
          extendBody: true,
          body: IndexedStack(
            index: navState.currentIndex,
            children: screens,
          ),
          bottomNavigationBar: _buildBottomNav(context, navState.currentIndex),
        );
      },
    );
  }

  Widget _buildBottomNav(BuildContext context, int currentIndex) {
    return Container(
      padding: const EdgeInsets.all(8),
      color: Colors.transparent,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Container(
          height: 60,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(35),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 25,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _navItem(context, 0, currentIndex, Icons.home_rounded),
              _navItem(context, 1, currentIndex, Icons.storefront_rounded),
              _navItem(
                  context, 2, currentIndex, Icons.favorite_outline_rounded),
              _navItem(context, 3, currentIndex, Icons.shopping_bag_outlined),
              _navItem(context, 4, currentIndex, Icons.person_outline_rounded),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(
    BuildContext context,
    int index,
    int currentIndex,
    IconData icon,
  ) {
    final isActive = index == currentIndex;

    // Custom icon for Home (Shoe with motion lines)
    Widget iconWidget;
    if (index == 0) {
      iconWidget = Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          if (isActive)
            Positioned(
              left: -10,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                      width: 4,
                      height: 1.5,
                      color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(height: 2.5),
                  Container(
                      width: 6,
                      height: 1.5,
                      color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(height: 2.5),
                  Container(
                      width: 4,
                      height: 1.5,
                      color: Colors.white.withValues(alpha: 0.8)),
                ],
              ),
            ),
          const Icon(
            Icons.home_rounded,
            color: Colors.white,
            size: 26,
          ),
        ],
      );
    } else if (index == 1) {
      // Shop
      iconWidget = Icon(
        isActive ? Icons.storefront_rounded : Icons.storefront_outlined,
        color: Colors.white,
        size: 26,
      );
    } else if (index == 2) {
      // Wishlist
      iconWidget = Stack(
        alignment: Alignment.center,
        children: [
          Icon(
            isActive ? Icons.favorite_rounded : Icons.favorite_outline_rounded,
            color: Colors.white,
            size: 26,
          ),
          if (isActive)
            const Icon(
              Icons.check,
              color: Colors.black,
              size: 16,
            ),
        ],
      );
    } else if (index == 3) {
      // Cart
      iconWidget = Icon(
        isActive ? Icons.shopping_bag_rounded : Icons.shopping_bag_outlined,
        color: Colors.white,
        size: 26,
      );
    } else {
      iconWidget = Icon(
        index == 4 ? Icons.person_outline_rounded : icon,
        color: Colors.white,
        size: 26,
      );
    }

    return Expanded(
      child: GestureDetector(
        onTap: () => context.read<NavigationBloc>().add(NavigateTo(index)),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AnimatedScale(
              scale: isActive ? 1.1 : 1.0,
              duration: const Duration(milliseconds: 200),
              child: Opacity(
                opacity: isActive ? 1.0 : 0.6,
                child: iconWidget,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
