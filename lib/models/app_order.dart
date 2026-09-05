import 'package:equatable/equatable.dart';

import '../config/app_config.dart';
import 'return_request.dart';

String titleCaseStatus(String status) {
  return status
      .toLowerCase()
      .split('_')
      .map((part) =>
          part.isEmpty ? part : '${part[0].toUpperCase()}${part.substring(1)}')
      .join(' ');
}

String paymentMethodLabel(String value) {
  switch (value) {
    case 'MOBILE_MONEY':
      return 'Mobile Money on delivery';
    case 'CASH_ON_DELIVERY':
      return 'Cash on delivery';
    default:
      return titleCaseStatus(value);
  }
}

class AppOrderItem extends Equatable {
  const AppOrderItem({
    required this.id,
    required this.productId,
    required this.productName,
    required this.unitPrice,
    required this.quantity,
    this.selectedColor,
    this.selectedSize,
    this.imageUrl,
  });

  final String id;
  final int productId;
  final String productName;
  final double unitPrice;
  final int quantity;
  final String? selectedColor;
  final String? selectedSize;
  final String? imageUrl;

  double get totalPrice => unitPrice * quantity;

  factory AppOrderItem.fromJson(Map<String, dynamic> json) {
    final image = json['imageUrl'] as String?;
    return AppOrderItem(
      id: json['id'] as String,
      productId: (json['productId'] as num).toInt(),
      productName: json['productName'] as String,
      unitPrice: (json['unitPrice'] as num).toDouble(),
      quantity: (json['quantity'] as num).toInt(),
      selectedColor: json['selectedColor'] as String?,
      selectedSize: json['selectedSize'] as String?,
      imageUrl: image == null || image.isEmpty
          ? null
          : AppConfig.resolveMediaUrl(image),
    );
  }

  @override
  List<Object?> get props => [
        id,
        productId,
        productName,
        unitPrice,
        quantity,
        selectedColor,
        selectedSize,
        imageUrl,
      ];
}

class OrderEvent extends Equatable {
  const OrderEvent({required this.status, required this.createdAt, this.note});

  final String status;
  final DateTime createdAt;
  final String? note;

  factory OrderEvent.fromJson(Map<String, dynamic> json) => OrderEvent(
        status: json['status'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        note: json['note'] as String?,
      );

  @override
  List<Object?> get props => [status, createdAt, note];
}

class AppOrder extends Equatable {
  const AppOrder({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.subtotal,
    required this.shippingFee,
    required this.total,
    required this.customerName,
    required this.customerPhone,
    required this.items,
    String? trackingCode,
    this.customerEmail,
    this.deliveryAddress,
    this.notes,
    this.paymentMethod = 'CASH_ON_DELIVERY',
    this.events = const [],
    this.isRedacted = false,
    this.canCancel = false,
    this.canRequestReturn = false,
    this.returnRequests = const [],
  }) : _trackingCode = trackingCode;

  final String id;
  final String? _trackingCode;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final double subtotal;
  final double shippingFee;
  final double total;
  final String customerName;
  final String customerPhone;
  final String? customerEmail;
  final String? deliveryAddress;
  final String? notes;
  final String paymentMethod;
  final List<AppOrderItem> items;
  final List<OrderEvent> events;

  /// True for public tracking lookups, where contact details are hidden.
  final bool isRedacted;
  final bool canCancel;
  final bool canRequestReturn;
  final List<ReturnRequest> returnRequests;

  String get trackingCode {
    final fromServer = _trackingCode?.trim();
    if (fromServer != null && fromServer.isNotEmpty) {
      return fromServer;
    }
    final compactId = id.trim();
    final start = compactId.length > 10 ? compactId.length - 10 : 0;
    return compactId.substring(start).toUpperCase();
  }

  String get displayStatus => titleCaseStatus(status);

  bool get isCancelled => status == 'CANCELLED';

  factory AppOrder.fromJson(Map<String, dynamic> json) {
    final createdAt = DateTime.parse(json['createdAt'] as String);
    final events = (json['events'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(OrderEvent.fromJson)
        .toList();

    return AppOrder(
      id: json['id'] as String,
      trackingCode: json['trackingCode'] as String?,
      status: json['status'] as String,
      createdAt: createdAt,
      updatedAt: DateTime.tryParse(json['updatedAt'] as String? ?? '') ??
          createdAt,
      subtotal: (json['subtotal'] as num).toDouble(),
      shippingFee: (json['shippingFee'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      customerName: json['customerName'] as String? ?? '',
      customerPhone: json['customerPhone'] as String? ?? '',
      customerEmail: json['customerEmail'] as String?,
      deliveryAddress: json['deliveryAddress'] as String?,
      notes: json['notes'] as String?,
      paymentMethod: json['paymentMethod'] as String? ?? 'CASH_ON_DELIVERY',
      items: (json['items'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(AppOrderItem.fromJson)
          .toList(),
      events: events.isEmpty
          ? [OrderEvent(status: 'PENDING', createdAt: createdAt)]
          : events,
      isRedacted: json['isRedacted'] as bool? ?? false,
      canCancel: json['canCancel'] as bool? ?? false,
      canRequestReturn: json['canRequestReturn'] as bool? ?? false,
      returnRequests: (json['returnRequests'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(ReturnRequest.fromJson)
          .toList(),
    );
  }

  @override
  List<Object?> get props => [
        id,
        status,
        createdAt,
        updatedAt,
        subtotal,
        shippingFee,
        total,
        customerName,
        customerPhone,
        customerEmail,
        deliveryAddress,
        notes,
        paymentMethod,
        items,
        events,
        isRedacted,
        canCancel,
        canRequestReturn,
        returnRequests,
      ];
}
