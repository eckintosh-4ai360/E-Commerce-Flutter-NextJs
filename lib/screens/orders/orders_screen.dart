import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../blocs/auth/auth_cubit.dart';
import '../../blocs/navigation/navigation_bloc.dart';
import '../../models/app_order.dart';
import '../../services/order_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';
import 'order_details_screen.dart';

class OrdersScreen extends StatelessWidget {
  const OrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('My Orders',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RequireSignIn(
        title: 'Sign in to view your orders',
        message:
            'Your order history is linked to the Google account you used at checkout, on the app or the website.',
        builder: (context) => _OrdersList(
          key: ValueKey(context.read<AuthCubit>().state.user?.uid),
        ),
      ),
    );
  }
}

class _OrdersList extends StatefulWidget {
  const _OrdersList({super.key});

  @override
  State<_OrdersList> createState() => _OrdersListState();
}

class _OrdersListState extends State<_OrdersList> {
  final _dateFormatter = DateFormat('MMM d, yyyy');
  List<AppOrder>? _orders;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final orders = await context.read<OrderService>().listMyOrders();
      if (mounted) setState(() => _orders = orders);
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    }
  }

  Future<void> _open(AppOrder order) async {
    final updated = await Navigator.push<AppOrder>(
      context,
      MaterialPageRoute(builder: (_) => OrderDetailsScreen(order: order)),
    );
    if (updated != null && mounted) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final orders = _orders;
    if (_error != null && orders == null) {
      return EmptyView(
        icon: Icons.error_outline,
        title: 'Could not load orders',
        message: _error,
        action: ElevatedButton(onPressed: _load, child: const Text('TRY AGAIN')),
      );
    }
    if (orders == null) {
      return const Center(child: CircularProgressIndicator());
    }
    if (orders.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          children: [
            SizedBox(
              height: 480,
              child: EmptyView(
                icon: Icons.inventory_2_outlined,
                title: 'No orders yet',
                message:
                    'Orders you place on the app or the website will appear here.',
                action: ElevatedButton(
                  onPressed: () {
                    final navigation = context.read<NavigationBloc>();
                    Navigator.of(context).popUntil((route) => route.isFirst);
                    navigation.add(const NavigateTo(1));
                  },
                  child: const Text('START SHOPPING'),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: orders.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final order = orders[index];
          final primaryItem = order.items.isEmpty ? null : order.items.first;
          final others = order.items.isEmpty ? 0 : order.items.length - 1;

          return GestureDetector(
            onTap: () => _open(order),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Order #${order.trackingCode}',
                          style: GoogleFonts.kumbhSans(
                              fontWeight: FontWeight.w700, fontSize: 16),
                        ),
                      ),
                      StatusChip(status: order.status),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: ProductThumb(
                          imageUrl: primaryItem?.imageUrl,
                          width: 60,
                          height: 60,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              primaryItem == null
                                  ? 'No items recorded'
                                  : others > 0
                                      ? '${primaryItem.productName} & $others other item${others == 1 ? '' : 's'}'
                                      : primaryItem.productName,
                              style: GoogleFonts.kumbhSans(
                                  fontWeight: FontWeight.w500, fontSize: 14),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              formatMoney(order.total),
                              style: GoogleFonts.kumbhSans(
                                fontWeight: FontWeight.w700,
                                color: AppTheme.primary,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Divider(height: 1),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _dateFormatter.format(order.createdAt.toLocal()),
                        style: GoogleFonts.kumbhSans(
                            color: AppTheme.textMed, fontSize: 12),
                      ),
                      Text(
                        'View Details',
                        style: GoogleFonts.kumbhSans(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
