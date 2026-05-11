import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../blocs/auth/auth_cubit.dart';
import '../../models/app_auth_user.dart';
import '../../models/app_order.dart';
import '../../services/order_service.dart';
import '../../theme/app_theme.dart';
import 'order_details_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _orderService = OrderService();
  final _dateFormatter = DateFormat('MMM d, yyyy');

  List<AppOrder> _orders = const [];
  bool _isLoading = false;
  String? _errorMessage;
  String? _loadedEmail;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _syncOrdersWithAuth(context.read<AuthCubit>().state.user);
  }

  Future<void> _syncOrdersWithAuth(AppAuthUser? user) async {
    final email = user?.email.trim().toLowerCase();
    if (email == _loadedEmail) {
      return;
    }

    _loadedEmail = email;

    if (email == null || email.isEmpty) {
      if (!mounted) {
        return;
      }

      setState(() {
        _orders = const [];
        _errorMessage = null;
        _isLoading = false;
      });
      return;
    }

    await _loadOrders(email);
  }

  Future<void> _loadOrders(String email) async {
    if (!mounted) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final orders = await _orderService.listOrders(customerEmail: email);
      if (!mounted) {
        return;
      }

      setState(() {
        _orders = orders;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _orders = const [];
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listenWhen: (previous, current) => previous.user?.email != current.user?.email,
      listener: (context, state) {
        _syncOrdersWithAuth(state.user);
      },
      child: Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(
          title: Text(
            'My Orders',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: BlocBuilder<AuthCubit, AuthState>(
          builder: (context, authState) {
            final user = authState.user;
            if (user == null) {
              return _buildSignInState();
            }

            if (_isLoading) {
              return const Center(child: CircularProgressIndicator());
            }

            if (_errorMessage != null) {
              return _buildErrorState(user);
            }

            if (_orders.isEmpty) {
              return _buildEmptyState(user);
            }

            return ListView.separated(
              padding: const EdgeInsets.all(20),
              itemCount: _orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final order = _orders[index];
                final statusColor = _statusColor(order.status);
                final primaryItem = order.items.isEmpty ? null : order.items.first;
                final remainingItemCount =
                    order.items.isEmpty ? 0 : order.items.length - 1;

                return Container(
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
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Order #${order.trackingCode}',
                                  style: GoogleFonts.kumbhSans(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  order.id,
                                  style: GoogleFonts.kumbhSans(
                                    fontSize: 11,
                                    color: AppTheme.textLight,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: statusColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              order.displayStatus,
                              style: GoogleFonts.kumbhSans(
                                color: statusColor,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              color: AppTheme.cardBg,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: primaryItem?.imageUrl == null
                                ? const Icon(
                                    Icons.shopping_bag_outlined,
                                    color: AppTheme.primary,
                                  )
                                : ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(
                                      primaryItem!.imageUrl!,
                                      fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => const Icon(
                                        Icons.shopping_bag_outlined,
                                        color: AppTheme.primary,
                                      ),
                                    ),
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
                                      : remainingItemCount > 0
                                          ? '${primaryItem.productName} & $remainingItemCount other item${remainingItemCount == 1 ? '' : 's'}'
                                          : primaryItem.productName,
                                  style: GoogleFonts.kumbhSans(
                                    fontWeight: FontWeight.w500,
                                    fontSize: 14,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'GHS ${order.total.toStringAsFixed(2)}',
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
                      const SizedBox(height: 16),
                      const Divider(height: 1),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _dateFormatter.format(order.createdAt.toLocal()),
                            style: GoogleFonts.kumbhSans(
                              color: AppTheme.textMed,
                              fontSize: 12,
                            ),
                          ),
                          TextButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => OrderDetailsScreen(order: order),
                                ),
                              );
                            },
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: const Size(0, 0),
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'View Details',
                              style: GoogleFonts.kumbhSans(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildSignInState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.receipt_long_outlined,
              size: 56,
              color: AppTheme.textLight,
            ),
            const SizedBox(height: 16),
            Text(
              'Sign in to view your orders',
              style: GoogleFonts.kumbhSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Your checkout history is linked to the Google account you used when placing orders.',
              style: GoogleFonts.kumbhSans(
                fontSize: 13,
                color: AppTheme.textMed,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(AppAuthUser user) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.inventory_2_outlined,
              size: 56,
              color: AppTheme.textLight,
            ),
            const SizedBox(height: 16),
            Text(
              'No orders yet for ${user.email}',
              style: GoogleFonts.kumbhSans(
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Once you place an order with this Google account, it will appear here automatically.',
              style: GoogleFonts.kumbhSans(
                fontSize: 13,
                color: AppTheme.textMed,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(AppAuthUser user) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 56,
              color: AppTheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'We could not load your orders.',
              style: GoogleFonts.kumbhSans(
                fontSize: 14,
                color: AppTheme.textDark,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => _loadOrders(user.email.trim().toLowerCase()),
              child: const Text('TRY AGAIN'),
            ),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return AppTheme.success;
      case 'PROCESSING':
      case 'SHIPPED':
        return AppTheme.accent;
      case 'CANCELLED':
        return AppTheme.error;
      default:
        return AppTheme.primary;
    }
  }
}
