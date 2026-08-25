import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../config/app_config.dart';
import '../models/app_auth_user.dart';

class AuthService {
  AuthService({
    FirebaseAuth? firebaseAuth,
  }) : _injectedAuth = firebaseAuth;

  final FirebaseAuth? _injectedAuth;

  // Resolved lazily: Firebase is not initialised on unsupported platforms,
  // and touching FirebaseAuth.instance there would throw.
  FirebaseAuth get _firebaseAuth => _injectedAuth ?? FirebaseAuth.instance;

  static Future<void>? _googleSignInReady;

  static bool get isSupportedPlatform {
    if (kIsWeb) {
      return true;
    }

    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  /// google_sign_in 7 must be initialised exactly once before use.
  static Future<void> _ensureGoogleSignIn() {
    return _googleSignInReady ??= GoogleSignIn.instance.initialize(
      serverClientId: AppConfig.googleServerClientId.isEmpty
          ? null
          : AppConfig.googleServerClientId,
    );
  }

  AppAuthUser? get currentUser =>
      isSupportedPlatform ? _mapUser(_firebaseAuth.currentUser) : null;

  Stream<AppAuthUser?> authStateChanges() {
    if (!isSupportedPlatform) {
      return Stream<AppAuthUser?>.value(null);
    }

    return _firebaseAuth.authStateChanges().map(_mapUser);
  }

  Future<AppAuthUser> signInWithGoogle() async {
    if (!isSupportedPlatform) {
      throw UnsupportedError(
        'Google sign-in is only available on Android, iOS, and web builds.',
      );
    }

    UserCredential credential;

    if (kIsWeb) {
      final provider = GoogleAuthProvider()
        ..setCustomParameters({'prompt': 'select_account'});
      credential = await _firebaseAuth.signInWithPopup(provider);
    } else {
      await _ensureGoogleSignIn();
      final GoogleSignInAccount googleUser;
      try {
        googleUser = await GoogleSignIn.instance.authenticate();
      } on GoogleSignInException catch (error) {
        if (error.code == GoogleSignInExceptionCode.canceled) {
          throw Exception('Sign-in was cancelled.');
        }
        throw Exception(
          'Google sign-in failed (${error.code.name}). Check that this app\'s SHA-1 fingerprint is registered in Firebase.',
        );
      }
      final idToken = googleUser.authentication.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw Exception('Google sign-in did not return an ID token.');
      }

      credential = await _firebaseAuth.signInWithCredential(
        GoogleAuthProvider.credential(idToken: idToken),
      );
    }

    final user = _mapUser(credential.user);
    if (user == null) {
      throw Exception(
          'Google sign-in completed, but no user profile was returned.');
    }

    return user;
  }

  Future<void> signOut() async {
    if (!isSupportedPlatform) {
      return;
    }

    if (!kIsWeb) {
      await GoogleSignIn.instance.signOut();
    }

    await _firebaseAuth.signOut();
  }

  Future<String?> getIdToken({bool forceRefresh = false}) async {
    if (!isSupportedPlatform) {
      return null;
    }

    return _firebaseAuth.currentUser?.getIdToken(forceRefresh);
  }

  AppAuthUser? _mapUser(User? user) {
    final email = user?.email?.trim();
    if (user == null || email == null || email.isEmpty) {
      return null;
    }

    return AppAuthUser(
      uid: user.uid,
      email: email,
      displayName: user.displayName,
      photoUrl: user.photoURL,
    );
  }
}
