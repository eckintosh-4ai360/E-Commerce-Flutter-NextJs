import 'package:equatable/equatable.dart';

const ghanaRegions = [
  'Greater Accra',
  'Ashanti',
  'Central',
  'Eastern',
  'Western',
  'Western North',
  'Volta',
  'Oti',
  'Northern',
  'Savannah',
  'North East',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
];

class CustomerProfile extends Equatable {
  const CustomerProfile({
    required this.uid,
    required this.email,
    this.name,
    this.phone,
    this.preferredPaymentMethod = 'PAYSTACK',
  });

  final String uid;
  final String email;
  final String? name;
  final String? phone;
  final String preferredPaymentMethod;

  factory CustomerProfile.fromJson(Map<String, dynamic> json) =>
      CustomerProfile(
        uid: json['uid'] as String,
        email: json['email'] as String,
        name: json['name'] as String?,
        phone: json['phone'] as String?,
        preferredPaymentMethod:
            json['preferredPaymentMethod'] as String? ?? 'PAYSTACK',
      );

  @override
  List<Object?> get props => [uid, email, name, phone, preferredPaymentMethod];
}

class DeliveryAddress extends Equatable {
  const DeliveryAddress({
    required this.id,
    required this.label,
    required this.recipientName,
    required this.phone,
    required this.street,
    required this.city,
    required this.region,
    this.isDefault = false,
  });

  final String id;
  final String label;
  final String recipientName;
  final String phone;
  final String street;
  final String city;
  final String region;
  final bool isDefault;

  /// The single-line address stored on orders.
  String get oneLine => '$street, $city, $region';

  factory DeliveryAddress.fromJson(Map<String, dynamic> json) =>
      DeliveryAddress(
        id: json['id'] as String,
        label: json['label'] as String,
        recipientName: json['recipientName'] as String,
        phone: json['phone'] as String,
        street: json['street'] as String,
        city: json['city'] as String,
        region: json['region'] as String,
        isDefault: json['isDefault'] as bool? ?? false,
      );

  Map<String, dynamic> toRequest({bool? makeDefault}) => {
        'label': label,
        'recipientName': recipientName,
        'phone': phone,
        'street': street,
        'city': city,
        'region': region,
        'isDefault': makeDefault ?? isDefault,
      };

  @override
  List<Object?> get props =>
      [id, label, recipientName, phone, street, city, region, isDefault];
}
