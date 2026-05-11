import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../models/app_auth_user.dart';

class AuthService {
  AuthService({
    FirebaseAuth? firebaseAuth,
  }) : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance;

  final FirebaseAuth _firebaseAuth;

  static bool get isSupportedPlatform {
    if (kIsWeb) {
      return true;
    }

    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  AppAuthUser? get currentUser => _mapUser(_firebaseAuth.currentUser);

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
      credential = await _firebaseAuth.signInWithPopup(GoogleAuthProvider());
    } else {
      final googleUser = await GoogleSignIn.instance.authenticate();
      final googleAuth = googleUser.authentication;
      final idToken = googleAuth.idToken;
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
