import 'package:equatable/equatable.dart';

const returnReasons = [
  'Damaged or defective',
  'Wrong item received',
  'Not as described',
  'Size or fit issue',
  'Changed my mind',
  'Other',
];

class ReturnRequest extends Equatable {
  const ReturnRequest({
    required this.id,
    required this.orderId,
    required this.trackingCode,
    required this.reason,
    required this.status,
    required this.createdAt,
    this.details,
    this.adminNote,
  });

  final String id;
  final String orderId;
  final String trackingCode;
  final String reason;
  final String status;
  final DateTime createdAt;
  final String? details;
  final String? adminNote;

  factory ReturnRequest.fromJson(Map<String, dynamic> json) => ReturnRequest(
        id: json['id'] as String,
        orderId: json['orderId'] as String,
        trackingCode: json['trackingCode'] as String? ?? '',
        reason: json['reason'] as String,
        status: json['status'] as String,
        createdAt: DateTime.parse(json['createdAt'] as String),
        details: json['details'] as String?,
        adminNote: json['adminNote'] as String?,
      );

  @override
  List<Object?> get props =>
      [id, orderId, trackingCode, reason, status, createdAt, details, adminNote];
}
