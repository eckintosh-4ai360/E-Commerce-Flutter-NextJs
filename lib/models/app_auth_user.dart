import 'package:equatable/equatable.dart';

class AppAuthUser extends Equatable {
  const AppAuthUser({
    required this.uid,
    required this.email,
    this.displayName,
    this.photoUrl,
  });

  final String uid;
  final String email;
  final String? displayName;
  final String? photoUrl;

  String get initials {
    final trimmedName = displayName?.trim();
    if (trimmedName != null && trimmedName.isNotEmpty) {
      final parts = trimmedName
          .split(RegExp(r'\s+'))
          .where((part) => part.isNotEmpty)
          .toList();
      if (parts.isNotEmpty) {
        final first = parts.first.substring(0, 1).toUpperCase();
        final last =
            parts.length > 1 ? parts.last.substring(0, 1).toUpperCase() : '';
        return '$first$last';
      }
    }

    return email.substring(0, 1).toUpperCase();
  }

  String get bestDisplayName {
    final trimmedName = displayName?.trim();
    if (trimmedName != null && trimmedName.isNotEmpty) {
      return trimmedName;
    }

    return email;
  }

  @override
  List<Object?> get props => [uid, email, displayName, photoUrl];
}
