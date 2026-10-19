import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../blocs/auth/auth_cubit.dart';
import '../models/app_order.dart';
import '../theme/app_theme.dart';

final _money = NumberFormat('#,##0.00');
final _wholeMoney = NumberFormat('#,##0');

/// GHS 1,234.50
String formatMoney(double value) => 'GHS ${_money.format(value)}';

/// GH₵150 for whole amounts, GH₵89.50 otherwise.
String formatPrice(double value) => value == value.roundToDouble()
    ? 'GH₵${_wholeMoney.format(value)}'
    : 'GH₵${_money.format(value)}';

String friendlyError(Object error) {
  final message = error.toString().replaceFirst('Exception: ', '').trim();
  return message.isEmpty ? 'Something went wrong. Please try again.' : message;
}

void showAppSnack(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message, style: GoogleFonts.kumbhSans()),
        backgroundColor: error ? AppTheme.error : AppTheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: const Duration(seconds: 3),
      ),
    );
}

Future<void> openExternal(BuildContext context, String url) async {
  final uri = Uri.parse(url);
  final opened = await launchUrl(uri, mode: LaunchMode.externalApplication)
      .catchError((_) => false);
  if (!opened && context.mounted) {
    showAppSnack(context, 'Could not open $url', error: true);
  }
}

/// Shows an asset or network image with a consistent placeholder and fallback.
class ProductThumb extends StatelessWidget {
  const ProductThumb({
    super.key,
    required this.imageUrl,
    this.width,
    this.height,
    this.iconSize = 24,
  });

  final String? imageUrl;
  final double? width;
  final double? height;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final url = imageUrl;
    final fallback = Container(
      width: width,
      height: height,
      color: AppTheme.cardBg,
      alignment: Alignment.center,
      child: Icon(Icons.image_not_supported_outlined,
          color: AppTheme.textLight, size: iconSize),
    );

    if (url == null || url.isEmpty) {
      return fallback;
    }
    if (url.startsWith('assets/')) {
      return Image.asset(url,
          width: width,
          height: height,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => fallback);
    }
    return CachedNetworkImage(
      imageUrl: url,
      width: width,
      height: height,
      fit: BoxFit.cover,
      placeholder: (_, __) => Container(color: AppTheme.cardBg),
      errorWidget: (_, __, ___) => fallback,
    );
  }
}

Color statusColor(String status) {
  switch (status.toUpperCase()) {
    case 'DELIVERED':
    case 'APPROVED':
    case 'REFUNDED':
      return AppTheme.success;
    case 'PROCESSING':
    case 'SHIPPED':
      return AppTheme.primaryBlue;
    case 'CANCELLED':
    case 'REJECTED':
      return AppTheme.error;
    case 'REQUESTED':
      return const Color(0xFF946300);
    default:
      return AppTheme.primary;
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final color = statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        titleCaseStatus(status),
        style: GoogleFonts.kumbhSans(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class RatingStars extends StatelessWidget {
  const RatingStars({super.key, required this.rating, this.size = 16});

  final double rating;
  final double size;

  @override
  Widget build(BuildContext context) {
    final filled = rating.round();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        5,
        (index) => Icon(
          index < filled ? Icons.star_rounded : Icons.star_outline_rounded,
          color: AppTheme.accent,
          size: size,
        ),
      ),
    );
  }
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.icon,
    required this.title,
    this.message,
    this.action,
  });

  final IconData icon;
  final String title;
  final String? message;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: const BoxDecoration(
                color: AppTheme.cardBg,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 44, color: AppTheme.textLight),
            ),
            const SizedBox(height: 18),
            Text(
              title,
              textAlign: TextAlign.center,
              style: GoogleFonts.kumbhSans(
                  fontSize: 20, fontWeight: FontWeight.w700),
            ),
            if (message != null) ...[
              const SizedBox(height: 8),
              Text(
                message!,
                textAlign: TextAlign.center,
                style: GoogleFonts.kumbhSans(
                    fontSize: 13, color: AppTheme.textMed),
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 22),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}

/// Shown on account screens when the customer is signed out.
class SignInPrompt extends StatelessWidget {
  const SignInPrompt({
    super.key,
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, auth) {
        return EmptyView(
          icon: Icons.lock_outline,
          title: title,
          message: auth.isSupported
              ? message
              : 'Google sign-in is available on Android, iOS and web.',
          action: auth.isSupported
              ? ElevatedButton.icon(
                  onPressed: auth.isBusy
                      ? null
                      : () => context.read<AuthCubit>().signInWithGoogle(),
                  icon: const Icon(Icons.login),
                  label: Text(
                      auth.isBusy ? 'SIGNING IN...' : 'SIGN IN WITH GOOGLE'),
                )
              : null,
        );
      },
    );
  }
}

/// Wraps account screens so their body only builds for signed-in users.
class RequireSignIn extends StatelessWidget {
  const RequireSignIn({
    super.key,
    required this.title,
    required this.message,
    required this.builder,
  });

  final String title;
  final String message;
  final WidgetBuilder builder;

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthCubit, AuthState>(
      buildWhen: (previous, current) =>
          previous.user?.uid != current.user?.uid ||
          previous.status != current.status,
      builder: (context, auth) {
        if (auth.status == AuthStatus.initializing) {
          return const Center(child: CircularProgressIndicator());
        }
        if (auth.user == null) {
          return SignInPrompt(title: title, message: message);
        }
        return builder(context);
      },
    );
  }
}

const _progressSteps = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
const _progressLabels = ['Placed', 'Processing', 'Shipped', 'Delivered'];

class OrderProgress extends StatelessWidget {
  const OrderProgress({super.key, required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    if (status == 'CANCELLED') {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.error.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          'This order was cancelled.',
          style: GoogleFonts.kumbhSans(
              color: AppTheme.error, fontWeight: FontWeight.w600),
        ),
      );
    }
    final current = _progressSteps.indexOf(status);
    return Row(
      children: [
        for (var i = 0; i < _progressSteps.length; i++) ...[
          Expanded(
            child: Column(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: i <= current ? AppTheme.primary : AppTheme.surface,
                    border: Border.all(
                      color: i <= current ? AppTheme.primary : AppTheme.divider,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    i <= current ? Icons.check : Icons.circle_outlined,
                    size: 14,
                    color: i <= current ? AppTheme.accent : AppTheme.textLight,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  _progressLabels[i],
                  style: GoogleFonts.kumbhSans(
                    fontSize: 11,
                    fontWeight:
                        i <= current ? FontWeight.w700 : FontWeight.w500,
                    color:
                        i <= current ? AppTheme.textDark : AppTheme.textLight,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class OrderTimeline extends StatelessWidget {
  const OrderTimeline({super.key, required this.events});

  final List<OrderEvent> events;

  @override
  Widget build(BuildContext context) {
    final formatter = DateFormat('MMM d, yyyy · h:mm a');
    final ordered = events.reversed.toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final event in ordered)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 5),
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: statusColor(event.status),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        titleCaseStatus(event.status),
                        style:
                            GoogleFonts.kumbhSans(fontWeight: FontWeight.w700),
                      ),
                      Text(
                        formatter.format(event.createdAt.toLocal()),
                        style: GoogleFonts.kumbhSans(
                            fontSize: 12, color: AppTheme.textMed),
                      ),
                      if (event.note != null && event.note!.isNotEmpty)
                        Text(event.note!,
                            style: GoogleFonts.kumbhSans(fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// A white rounded card used across account screens.
class SectionCard extends StatelessWidget {
  const SectionCard({super.key, required this.child, this.title});

  final Widget child;
  final String? title;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (title != null) ...[
            Text(title!,
                style: GoogleFonts.kumbhSans(
                    fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
          ],
          child,
        ],
      ),
    );
  }
}
