import 'package:equatable/equatable.dart';

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
    return AppOrderItem(
      id: json['id'] as String,
      productId: (json['productId'] as num).toInt(),
      productName: json['productName'] as String,
      unitPrice: (json['unitPrice'] as num).toDouble(),
      quantity: (json['quantity'] as num).toInt(),
      selectedColor: json['selectedColor'] as String?,
      selectedSize: json['selectedSize'] as String?,
      imageUrl: json['imageUrl'] as String?,
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
    this.customerEmail,
    this.deliveryAddress,
    this.notes,
  });

  final String id;
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
  final List<AppOrderItem> items;

  factory AppOrder.fromJson(Map<String, dynamic> json) {
    return AppOrder(
      id: json['id'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      subtotal: (json['subtotal'] as num).toDouble(),
      shippingFee: (json['shippingFee'] as num).toDouble(),
      total: (json['total'] as num).toDouble(),
      customerName: json['customerName'] as String,
      customerPhone: json['customerPhone'] as String,
      customerEmail: json['customerEmail'] as String?,
      deliveryAddress: json['deliveryAddress'] as String?,
      notes: json['notes'] as String?,
      items: (json['items'] as List<dynamic>? ?? const [])
          .map((item) => AppOrderItem.fromJson(item as Map<String, dynamic>))
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
        items,
      ];
}
