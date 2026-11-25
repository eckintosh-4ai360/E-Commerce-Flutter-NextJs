import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../services/account_service.dart';
import '../../widgets/common.dart';

class BuyForMeScreen extends StatelessWidget {
  const BuyForMeScreen({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Buy for me')),
        body: RequireSignIn(
          title: 'Sign in to request an item',
          message: 'Your requests are linked to your account.',
          builder: (_) => const _BuyForMeForm(),
        ),
      );
}

class _BuyForMeForm extends StatefulWidget {
  const _BuyForMeForm();
  @override
  State<_BuyForMeForm> createState() => _BuyForMeFormState();
}

class _BuyForMeFormState extends State<_BuyForMeForm> {
  final _form = GlobalKey<FormState>();
  final _fields = <String, TextEditingController>{
    for (final name in [
      'itemName',
      'itemUrl',
      'itemValue',
      'quantity',
      'retailerShipping',
      'shippingFrom',
      'category',
      'instructions',
      'deliveryAddress',
      'contactName',
      'contactPhone'
    ])
      name: TextEditingController(),
  };
  String _currency = 'USD', _shippingMode = 'AIR', _delivery = 'DELIVERY';
  bool _insurance = false, _busy = false;
  String? _error, _message;
  List<Map<String, dynamic>> _requests = [];

  @override
  void initState() {
    super.initState();
    _fields['quantity']!.text = '1';
    _load();
  }

  @override
  void dispose() {
    for (final field in _fields.values) {
      field.dispose();
    }
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final result =
          await context.read<AccountService>().listBuyForMeRequests();
      if (mounted) setState(() => _requests = result);
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    }
  }

  String value(String name) => _fields[name]!.text.trim();
  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
      _message = null;
    });
    try {
      final result =
          await context.read<AccountService>().submitBuyForMeRequest({
        'itemName': value('itemName'),
        'itemUrl': value('itemUrl'),
        'itemValue': double.parse(value('itemValue')),
        'currency': _currency,
        'quantity': num.parse(value('quantity')).toInt(),
        'retailerShipping': value('retailerShipping').isEmpty
            ? null
            : double.parse(value('retailerShipping')),
        'shippingFrom': value('shippingFrom'),
        'shippingMode': _shippingMode,
        'category': value('category'),
        'instructions': value('instructions'),
        'insurance': _insurance,
        'deliveryMethod': _delivery,
        'deliveryAddress': value('deliveryAddress'),
        'contactName': value('contactName'),
        'contactPhone': value('contactPhone'),
      });
      if (!mounted) return;
      for (final field in _fields.values) {
        field.clear();
      }
      _fields['quantity']!.text = '1';
      setState(() {
        _message = result;
        _delivery = 'DELIVERY';
        _insurance = false;
      });
      await _load();
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Widget textField(String name, String label,
          {bool required = false,
          int maxLength = 120,
          TextInputType? keyboard,
          int lines = 1,
          String? Function(String?)? validator}) =>
      Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: TextFormField(
            controller: _fields[name],
            maxLength: maxLength,
            maxLines: lines,
            keyboardType: keyboard,
            decoration: InputDecoration(labelText: label, counterText: ''),
            validator: validator ??
                (v) => required && (v == null || v.trim().isEmpty)
                    ? 'Please enter $label.'
                    : null,
          ));
  String? _number(String? v, {bool optional = false, bool whole = false}) {
    if (optional && (v == null || v.trim().isEmpty)) return null;
    final number = num.tryParse(v?.trim() ?? '');
    if (number == null ||
        !number.isFinite ||
        number < (whole ? 1 : 0) ||
        number > (whole ? 100 : 1000000) ||
        (whole && number != number.roundToDouble())) {
      return 'Enter a valid ${whole ? 'quantity' : 'amount'}.';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) =>
      ListView(padding: const EdgeInsets.all(20), children: [
        const Text(
            'Found an item elsewhere? Send us the details. Our team will review your request and contact you. No payment is taken now.'),
        const SizedBox(height: 20),
        Form(
            key: _form,
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Item details',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  textField('itemName', 'Item name', required: true),
                  textField('itemUrl', 'Product link',
                      maxLength: 2048,
                      keyboard: TextInputType.url, validator: (v) {
                    final url = Uri.tryParse(v?.trim() ?? '');
                    return url == null ||
                            !(url.isScheme('http') || url.isScheme('https')) ||
                            url.host.isEmpty
                        ? 'Enter a valid product link.'
                        : null;
                  }),
                  textField('itemValue', 'Item value (per item)',
                      keyboard:
                          const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) => _number(v)),
                  DropdownButtonFormField<String>(
                      initialValue: _currency,
                      decoration: const InputDecoration(labelText: 'Currency'),
                      items: ['USD', 'GBP', 'EUR', 'GHS']
                          .map(
                              (v) => DropdownMenuItem(value: v, child: Text(v)))
                          .toList(),
                      onChanged: (v) => setState(() => _currency = v!)),
                  const SizedBox(height: 14),
                  textField('quantity', 'Quantity',
                      keyboard: TextInputType.number,
                      validator: (v) => _number(v, whole: true)),
                  textField(
                      'retailerShipping', 'Retailer shipping cost, if known',
                      keyboard:
                          const TextInputType.numberWithOptions(decimal: true),
                      validator: (v) => _number(v, optional: true)),
                  textField('shippingFrom', 'Shipping from country',
                      required: true, maxLength: 80),
                  DropdownButtonFormField<String>(
                      initialValue: _shippingMode,
                      decoration:
                          const InputDecoration(labelText: 'Shipping mode'),
                      items: const [
                        DropdownMenuItem(value: 'AIR', child: Text('By air')),
                        DropdownMenuItem(value: 'SEA', child: Text('By sea'))
                      ],
                      onChanged: (v) => setState(() => _shippingMode = v!)),
                  const SizedBox(height: 14),
                  textField('category', 'Item category (optional)',
                      maxLength: 80),
                  textField(
                      'instructions', 'Description or instructions (optional)',
                      maxLength: 1000, lines: 3),
                  CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Request insurance'),
                      value: _insurance,
                      onChanged: (v) =>
                          setState(() => _insurance = v ?? false)),
                  const SizedBox(height: 12),
                  const Text('Delivery details',
                      style:
                          TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                      initialValue: _delivery,
                      decoration:
                          const InputDecoration(labelText: 'Delivery method'),
                      items: const [
                        DropdownMenuItem(
                            value: 'DELIVERY', child: Text('Delivery')),
                        DropdownMenuItem(value: 'PICKUP', child: Text('Pickup'))
                      ],
                      onChanged: (v) => setState(() => _delivery = v!)),
                  const SizedBox(height: 14),
                  if (_delivery == 'DELIVERY')
                    textField('deliveryAddress', 'Delivery address',
                        required: true, maxLength: 300, lines: 2),
                  textField('contactName', 'Contact name',
                      required: true, maxLength: 100),
                  textField('contactPhone', 'Phone number',
                      required: true,
                      maxLength: 20,
                      keyboard: TextInputType.phone),
                  if (_error != null)
                    Text(_error!, style: const TextStyle(color: Colors.red)),
                  if (_message != null) Text(_message!),
                  const SizedBox(height: 12),
                  ElevatedButton(
                      onPressed: _busy ? null : _submit,
                      child: Text(_busy ? 'Submitting…' : 'Submit request')),
                ])),
        const SizedBox(height: 28),
        const Text('Your requests',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        if (_requests.isEmpty)
          const Padding(
              padding: EdgeInsets.only(top: 12),
              child: Text('No requests yet.')),
        for (final item in _requests)
          Card(
              child: ListTile(
                  title: Text(item['itemName'] as String? ?? ''),
                  subtitle: Text(
                      '${(item['status'] as String? ?? '').replaceAll('_', ' ')}${item['adminNote'] == null ? '' : '\n${item['adminNote']}'}'))),
      ]);
}
