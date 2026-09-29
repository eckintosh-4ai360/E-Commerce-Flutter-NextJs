import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../config/app_config.dart';
import '../../models/app_order.dart';
import '../../models/return_request.dart';
import '../../services/account_service.dart';
import '../../services/order_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/common.dart';

class ReturnsRefundsScreen extends StatelessWidget {
  const ReturnsRefundsScreen({super.key, this.initialOrderId});

  final String? initialOrderId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text('Returns & Refunds',
            style: GoogleFonts.kumbhSans(fontWeight: FontWeight.w600)),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: RequireSignIn(
        title: 'Sign in to request a return',
        message: 'Returns are linked to the account that placed the order.',
        builder: (_) => _Returns(initialOrderId: initialOrderId),
      ),
    );
  }
}

class _Returns extends StatefulWidget {
  const _Returns({this.initialOrderId});

  final String? initialOrderId;

  @override
  State<_Returns> createState() => _ReturnsState();
}

class _ReturnsState extends State<_Returns> {
  final _detailsController = TextEditingController();
  final _dateFormat = DateFormat('MMM d, yyyy');
  List<AppOrder>? _eligible;
  List<ReturnRequest> _returns = const [];
  String? _orderId;
  String _reason = returnReasons.first;
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        context.read<OrderService>().listMyOrders(),
        context.read<AccountService>().listReturns(),
      ]);
      if (!mounted) return;
      final eligible = (results[0] as List<AppOrder>)
          .where((order) => order.canRequestReturn)
          .toList();
      setState(() {
        _eligible = eligible;
        _returns = results[1] as List<ReturnRequest>;
        final preferred = eligible.where((order) => order.id == widget.initialOrderId);
        _orderId = preferred.isNotEmpty
            ? preferred.first.id
            : (eligible.isEmpty ? null : eligible.first.id);
      });
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    }
  }

  Future<void> _submit() async {
    final orderId = _orderId;
    if (orderId == null) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final message = await context.read<AccountService>().requestReturn(
            orderId: orderId,
            reason: _reason,
            details: _detailsController.text.trim().isEmpty
                ? null
                : _detailsController.text.trim(),
          );
      if (!mounted) return;
      _detailsController.clear();
      showAppSnack(context, message);
      await _load();
    } catch (error) {
      if (mounted) setState(() => _error = friendlyError(error));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final eligible = _eligible;
    if (eligible == null) {
      return _error == null
          ? const Center(child: CircularProgressIndicator())
          : EmptyView(icon: Icons.error_outline, title: 'Could not load', message: _error);
    }

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          SectionCard(
            title: 'Our return policy',
            child: Text(
              'You have ${AppConfig.returnWindowDays} days from delivery to request a return. Items must be unused, in the condition you received them, and in their original packaging. Approved refunds are paid back via Mobile Money or cash.',
              style: GoogleFonts.kumbhSans(
                  fontSize: 13, color: AppTheme.textMed, height: 1.6),
            ),
          ),
          SectionCard(
            title: 'Request a return',
            child: eligible.isEmpty
                ? Text(
                    'You have no delivered orders within the ${AppConfig.returnWindowDays}-day return window. Need help with an older order? Call ${AppConfig.supportPhone}.',
                    style: GoogleFonts.kumbhSans(fontSize: 13, color: AppTheme.textMed),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      DropdownButtonFormField<String>(
                        initialValue: _orderId,
                        isExpanded: true,
                        decoration: const InputDecoration(labelText: 'Order'),
                        items: eligible
                            .map((order) => DropdownMenuItem(
                                  value: order.id,
                                  child: Text(
                                    '#${order.trackingCode} · ${_dateFormat.format(order.createdAt.toLocal())}',
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ))
                            .toList(),
                        onChanged: (value) => setState(() => _orderId = value),
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _reason,
                        isExpanded: true,
                        decoration: const InputDecoration(labelText: 'Reason for return'),
                        items: returnReasons
                            .map((reason) =>
                                DropdownMenuItem(value: reason, child: Text(reason)))
                            .toList(),
                        onChanged: (value) =>
                            setState(() => _reason = value ?? _reason),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _detailsController,
                        maxLines: 4,
                        maxLength: 1000,
                        decoration: const InputDecoration(
                          labelText: 'Details (optional)',
                          hintText: 'Tell us what went wrong so we can help faster.',
                        ),
                      ),
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Text(_error!,
                              style: GoogleFonts.kumbhSans(
                                  color: AppTheme.error,
                                  fontWeight: FontWeight.w600)),
                        ),
                      SizedBox(
                        height: 50,
                        child: ElevatedButton(
                          onPressed: _submitting || _orderId == null ? null : _submit,
                          child: Text(_submitting ? 'SUBMITTING...' : 'SUBMIT REQUEST'),
                        ),
                      ),
                    ],
                  ),
          ),
          SectionCard(
            title: 'Your return requests',
            child: _returns.isEmpty
                ? Text('No return requests yet.',
                    style: GoogleFonts.kumbhSans(fontSize: 13, color: AppTheme.textMed))
                : Column(
                    children: [
                      for (final request in _returns)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Order #${request.trackingCode}',
                                        style: GoogleFonts.kumbhSans(
                                            fontWeight: FontWeight.w700)),
                                    Text(
                                      '${request.reason} · ${_dateFormat.format(request.createdAt.toLocal())}'
                                      '${request.adminNote == null ? '' : '\n${request.adminNote}'}',
                                      style: GoogleFonts.kumbhSans(
                                          fontSize: 12, color: AppTheme.textMed),
                                    ),
                                  ],
                                ),
                              ),
                              StatusChip(status: request.status),
                            ],
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}
