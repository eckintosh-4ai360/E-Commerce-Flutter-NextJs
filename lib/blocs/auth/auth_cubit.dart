import 'dart:async';

import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/app_auth_user.dart';
import '../../services/auth_service.dart';

enum AuthStatus {
  unsupported,
  initializing,
  ready,
  busy,
}

class AuthState extends Equatable {
  const AuthState({
    required this.status,
    this.user,
    this.errorMessage,
  });

  AuthState.initial()
      : this(
          status: AuthService.isSupportedPlatform
              ? AuthStatus.initializing
              : AuthStatus.unsupported,
        );

  final AuthStatus status;
  final AppAuthUser? user;
  final String? errorMessage;

  bool get isSupported => status != AuthStatus.unsupported;
  bool get isAuthenticated => user != null;
  bool get isBusy => status == AuthStatus.busy;

  AuthState copyWith({
    AuthStatus? status,
    AppAuthUser? user,
    bool keepUser = true,
    String? errorMessage,
    bool clearError = false,
  }) {
    return AuthState(
      status: status ?? this.status,
      user: keepUser ? (user ?? this.user) : user,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  @override
  List<Object?> get props => [status, user, errorMessage];
}

class AuthCubit extends Cubit<AuthState> {
  AuthCubit({AuthService? authService})
      : _authService = authService ?? AuthService(),
        super(AuthState.initial()) {
    _bindAuthState();
  }

  final AuthService _authService;
  StreamSubscription<AppAuthUser?>? _authSubscription;

  void _bindAuthState() {
    if (!AuthService.isSupportedPlatform) {
      emit(const AuthState(status: AuthStatus.unsupported));
      return;
    }

    emit(
      state.copyWith(
        status: AuthStatus.initializing,
        user: _authService.currentUser,
        clearError: true,
      ),
    );

    _authSubscription = _authService.authStateChanges().listen(
      (user) {
        emit(
          AuthState(
            status: AuthStatus.ready,
            user: user,
          ),
        );
      },
      onError: (Object error, StackTrace stackTrace) {
        emit(
          AuthState(
            status: AuthStatus.ready,
            user: state.user,
            errorMessage: _formatError(error),
          ),
        );
      },
    );
  }

  Future<void> signInWithGoogle() async {
    if (!state.isSupported || state.isBusy) {
      return;
    }

    emit(
      state.copyWith(
        status: AuthStatus.busy,
        clearError: true,
      ),
    );

    try {
      final user = await _authService.signInWithGoogle();
      emit(
        AuthState(
          status: AuthStatus.ready,
          user: user,
        ),
      );
    } catch (error) {
      emit(
        state.copyWith(
          status: AuthStatus.ready,
          errorMessage: _formatError(error),
        ),
      );
    }
  }

  Future<void> signOut() async {
    if (!state.isSupported || state.isBusy) {
      return;
    }

    emit(
      state.copyWith(
        status: AuthStatus.busy,
        clearError: true,
      ),
    );

    try {
      await _authService.signOut();
      emit(const AuthState(status: AuthStatus.ready));
    } catch (error) {
      emit(
        state.copyWith(
          status: AuthStatus.ready,
          errorMessage: _formatError(error),
        ),
      );
    }
  }

  Future<String?> getIdToken({bool forceRefresh = false}) {
    return _authService.getIdToken(forceRefresh: forceRefresh);
  }

  @override
  Future<void> close() async {
    await _authSubscription?.cancel();
    return super.close();
  }

  String _formatError(Object error) {
    final message = error.toString().replaceFirst('Exception: ', '').trim();
    if (message.isEmpty) {
      return 'Authentication failed. Please try again.';
    }
    return message;
  }
}
