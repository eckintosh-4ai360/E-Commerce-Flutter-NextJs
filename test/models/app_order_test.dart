import 'package:globacart/models/app_order.dart';
import 'package:globacart/models/cart_item.dart';
import 'package:globacart/models/product.dart';
import 'package:flutter_test/flutter_test.dart';

Map<String, dynamic> orderJson([Map<String, dynamic> overrides = const {}]) => {
      'id': 'cabc123def456ghi789jkl0mn',
      'trackingCode': 'I789JKL0MN',
      'status': 'SHIPPED',
      'createdAt': '2026-01-01T10:00:00.000Z',
      'updatedAt': '2026-01-02T10:00:00.000Z',
      'subtotal': 150,
      'shippingFee': 25,
      'total': 175,
      'paymentMethod': 'MOBILE_MONEY',
      'customerName': 'Ama',
      'customerPhone': '••• ••• 687',
      'customerEmail': null,
      'deliveryAddress': null,
      'notes': null,
      'isRedacted': true,
      'canCancel': false,
      'canRequestReturn': false,
      'items': [
        {
          'id': 'i1',
          'productId': 1,
          'productName': 'Ladies Top',
          'unitPrice': 150,
          'quantity': 1,
          'selectedColor': 'Cream',
          'selectedSize': null,
          'imageUrl': 'https://cdn.example.com/top.jpg',
        }
      ],
      'events': [
        {
          'status': 'PENDING',
          'note': null,
          'createdAt': '2026-01-01T10:00:00.000Z'
        },
        {
          'status': 'SHIPPED',
          'note': 'On the way',
          'createdAt': '2026-01-02T10:00:00.000Z'
        },
      ],
      'returnRequests': [],
      ...overrides,
    };

void main() {
  test('parses the public (redacted) tracking view', () {
    final order = AppOrder.fromJson(orderJson());
    expect(order.isRedacted, isTrue);
    expect(order.trackingCode, 'I789JKL0MN');
    expect(order.customerEmail, isNull);
    expect(order.deliveryAddress, isNull);
    expect(order.events.last.note, 'On the way');
    expect(paymentMethodLabel(order.paymentMethod), 'Mobile Money on delivery');
  });

  test('tolerates responses from older servers', () {
    final json = orderJson()
      ..remove('trackingCode')
      ..remove('events')
      ..remove('paymentMethod')
      ..remove('isRedacted')
      ..remove('returnRequests');
    final order = AppOrder.fromJson(json);
    expect(order.trackingCode, 'I789JKL0MN');
    expect(order.events.single.status, 'PENDING');
    expect(order.paymentMethod, 'CASH_ON_DELIVERY');
    expect(order.isRedacted, isFalse);
  });

  test('parses owner actions and return requests', () {
    final order = AppOrder.fromJson(orderJson({
      'status': 'DELIVERED',
      'isRedacted': false,
      'canRequestReturn': true,
      'returnRequests': [
        {
          'id': 'r1',
          'orderId': 'cabc123def456ghi789jkl0mn',
          'trackingCode': 'I789JKL0MN',
          'reason': 'Other',
          'details': null,
          'status': 'REJECTED',
          'adminNote': 'Outside policy',
          'createdAt': '2026-01-05T10:00:00.000Z',
        }
      ],
    }));
    expect(order.canRequestReturn, isTrue);
    expect(order.returnRequests.single.adminNote, 'Outside policy');
    expect(order.displayStatus, 'Delivered');
  });

  test('cart items round-trip through JSON for persistence', () {
    const product = Product(
      id: 3,
      name: 'Chic Crossbody',
      description: 'Bag',
      price: 85,
      images: ['https://cdn.example.com/c.jpg'],
      category: 'Bags',
      colors: ['Black', 'Caramel'],
    );
    const item =
        CartItem(product: product, quantity: 2, selectedColor: 'Caramel');
    final restored = CartItem.tryParse(item.toJson())!;
    expect(restored.lineKey, item.lineKey);
    expect(restored.quantity, 2);
    expect(restored.product.colors, ['Black', 'Caramel']);
    expect(CartItem.tryParse({'quantity': 1}), isNull);
    expect(CartItem.tryParse({'product': product.toJson(), 'quantity': 0}),
        isNull);
  });
}
