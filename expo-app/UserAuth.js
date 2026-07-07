import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Animated, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Buffer } from 'buffer';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base64 encoding that works in both web and React Native
const base64Encode = (str) => {
  if (typeof btoa !== "undefined") {
    return btoa(str);
  } else {
    return Buffer.from(str, "utf-8").toString("base64");
  }
};

WebBrowser.maybeCompleteAuthSession();

// Storage wrapper for web and mobile
class SimpleStorage {
  constructor() {
    this.isWeb = Platform.OS === 'web';
  }

  async setItem(key, value) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } else {
      return await AsyncStorage.getItem(key);
    }
    return null;
  }

  async removeItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
}

const storage = new SimpleStorage();

// Module-level store for the PKCE code verifier so it survives component
// remounts that happen when Android brings the app back from the browser.
let _googleCodeVerifier = null;

// Forgot Password Screen
export function ForgotPasswordScreen({ onBack, onEmailSent }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentToEmail, setSentToEmail] = useState('');
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0.3)).current;
  const successScale = useRef(new Animated.Value(0.7)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleSendResetLink = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/requestPasswordReset';
      const requestPayload = { email: email.trim() };

      console.log('📱 PASSWORD RESET REQUEST:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Try to parse JSON regardless of status code
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      // Check if error === 0 (success)
      if (data.error === 0) {
        setSentToEmail(email.trim());
        setEmailSent(true);
        Animated.parallel([
          Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
          Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
        if (onEmailSent) onEmailSent(email.trim());
        setEmail('');
      } else {
        // error is not 0, show the error message
        Alert.alert('Error', data.result || 'Failed to send reset link');
      }
    } catch (error) {
      console.log('Catch block error:', error);
      console.log('Error message:', error.message);
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#0f172a', '#1e3a5f', '#1e40af', '#3b82f6']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
          <Animated.Image
            source={require('./assets/cross-hands.png')}
            style={[styles.mascot, { transform: [{ translateY: floatAnim }] }]}
            resizeMode="contain"
          />
        </View>

        {emailSent ? (
          /* ── Success State ── */
          <Animated.View style={{
            width: '100%',
            alignItems: 'center',
            opacity: successOpacity,
            transform: [{ scale: successScale }],
          }}>
            {/* Icon bubble */}
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: 'rgba(34,197,94,0.18)',
              borderWidth: 2, borderColor: 'rgba(34,197,94,0.45)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 38 }}>✉️</Text>
            </View>

            <Text style={[styles.appName, { marginBottom: 8 }]}>Check Your Inbox</Text>
            <Text style={[styles.helpText, { marginBottom: 6 }]}>
              If an account exists for
            </Text>
            <Text style={{
              color: '#93c5fd', fontSize: 15, fontWeight: '700',
              marginBottom: 16, textAlign: 'center',
            }}>
              {sentToEmail}
            </Text>
            <Text style={[styles.helpText, { marginBottom: 32 }]}>
              you'll receive a password reset link shortly. Check your spam folder if you don't see it.
            </Text>

            {/* Divider */}
            <View style={{
              width: '100%', height: 1,
              backgroundColor: 'rgba(255,255,255,0.1)',
              marginBottom: 28,
            }} />

            <TouchableOpacity
              style={styles.button}
              onPress={onBack}
            >
              <Text style={styles.buttonText}>Back to Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchButton, { marginTop: 16 }]}
              onPress={() => {
                setEmailSent(false);
                successScale.setValue(0.7);
                successOpacity.setValue(0);
              }}
            >
              <Text style={styles.switchText}>Try a different email</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* ── Form State ── */
          <>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>Pray Over Us</Text>
            <Text style={styles.subtitle}>Forgot Password?</Text>
            <Text style={styles.helpText}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              data-testid="input-forgot-email"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSendResetLink}
              disabled={loading}
              data-testid="button-send-reset"
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#1e40af" />
                  <Text style={styles.buttonText}>Sending...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.switchButton} onPress={onBack}>
              <Text style={styles.switchText}>← Back to Sign In</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// Reset Password Screen
export function ResetPasswordScreen({ token, onSuccess, onAutoLogin, resetEmail }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0.3)).current;
  const successScale = useRef(new Animated.Value(0.7)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0,   duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setResetError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }

    setResetError('');
    setLoading(true);

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/resetPassword';
      const requestPayload = {
        token: token,
        newPassword: newPassword
      };

      console.log('📱 PASSWORD RESET: POST ' + endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0) {
          // Try to auto-login if we have the email (user went through in-app Forgot Password flow)
          if (resetEmail && onAutoLogin) {
            try {
              const loginRes = await fetch('https://shouldcallpaul.replit.app/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
                },
                body: JSON.stringify({ email: resetEmail, password: newPassword }),
              });
              if (loginRes.ok) {
                const loginData = await loginRes.json();
                if (loginData.error === 0 && loginData.result?.length > 0) {
                  const u = loginData.result[0];
                  onAutoLogin({
                    id: u.user_id,
                    email: u.email,
                    firstName: u.real_name,
                    userName: u.user_name,
                    title: u.user_title,
                    about: u.user_about,
                    location: u.location,
                    picture: u.picture,
                    active: u.active,
                    timestamp: u.timestamp,
                    churchName: u.church_name,
                    faith_points: u.faith_points || 0,
                    faith_rank: u.faith_rank || null,
                    prayer_count: parseInt(u.prayer_count, 10) || 0,
                    request_count: parseInt(u.request_count, 10) || 0,
                  });
                  return; // skip the alert — user is straight in the app
                }
              }
            } catch (_) {
              // auto-login failed silently — fall through to the alert
            }
          }
          // Fallback: no email available or auto-login failed — show banner on login screen
          setResetDone(true);
          Animated.parallel([
            Animated.spring(successScale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }),
            Animated.timing(successOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          ]).start();
        } else {
          setResetError(
            (data.result || 'This reset link has already been used or has expired.') +
            ' Please go back to Forgot Password and request a new link.'
          );
        }
      } else {
        setResetError('Service unavailable. Please try again later.');
      }
    } catch (error) {
      setResetError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#0f172a', '#1e3a5f', '#1e40af', '#3b82f6']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
          <Animated.Image
            source={require('./assets/cross-hands.png')}
            style={[styles.mascot, { transform: [{ translateY: floatAnim }] }]}
            resizeMode="contain"
          />
        </View>
        {resetDone ? (
          /* ── Success State ── */
          <Animated.View style={{
            width: '100%', alignItems: 'center',
            opacity: successOpacity,
            transform: [{ scale: successScale }],
          }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: 'rgba(34,197,94,0.18)',
              borderColor: 'rgba(34,197,94,0.45)',
              borderWidth: 2, alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 38 }}>🔐</Text>
            </View>
            <Text style={[styles.appName, { marginBottom: 8 }]}>Password Updated!</Text>
            <Text style={[styles.helpText, { marginBottom: 32 }]}>
              Your password has been changed successfully. You can now sign in with your new password.
            </Text>
            <View style={{ width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 28 }} />
            <TouchableOpacity style={styles.button} onPress={onSuccess}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* ── Form State ── */
          <>
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.appName}>Pray Over Us</Text>
            <Text style={styles.subtitle}>Reset Password</Text>
            <Text style={styles.helpText}>Enter your new password below.</Text>

            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={newPassword}
                onChangeText={(t) => { setNewPassword(t); setResetError(''); }}
                secureTextEntry={!showPassword}
                editable={!loading}
                autoCorrect={false}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={confirmPassword}
                onChangeText={(t) => { setConfirmPassword(t); setResetError(''); }}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                autoCorrect={false}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />
              <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>Password must be at least 6 characters</Text>

            {!!resetError && (
              <View style={styles.loginErrorBox}>
                <Text style={styles.loginErrorIcon}>⚠️</Text>
                <Text style={styles.loginErrorText}>{resetError}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#1e40af" />
                  <Text style={styles.buttonText}>Resetting...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

export function LoginScreen({ onLogin, onForgotPassword, appBuild, resetSuccess, onGuestMode, initMode, onInitModeConsumed, pendingGoogleAuthCode, onGoogleAuthCodeConsumed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(initMode === 'register');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [pendingAppleCredential, setPendingAppleCredential] = useState(null);
  const [appleEmailInput, setAppleEmailInput] = useState('');

  const loadingFloatAnim = useRef(new Animated.Value(0)).current;
  const loadingGlowAnim  = useRef(new Animated.Value(0.4)).current;
  const loadingScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (googleLoading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingFloatAnim, { toValue: -16, duration: 1900, useNativeDriver: true }),
          Animated.timing(loadingFloatAnim, { toValue: 0,   duration: 1900, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingGlowAnim, { toValue: 1,   duration: 1500, useNativeDriver: true }),
          Animated.timing(loadingGlowAnim, { toValue: 0.3, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingScaleAnim, { toValue: 1.1, duration: 1900, useNativeDriver: true }),
          Animated.timing(loadingScaleAnim, { toValue: 1.0, duration: 1900, useNativeDriver: true }),
        ])
      ).start();
    } else {
      loadingFloatAnim.stopAnimation();
      loadingGlowAnim.stopAnimation();
      loadingScaleAnim.stopAnimation();
      loadingFloatAnim.setValue(0);
      loadingGlowAnim.setValue(0.4);
      loadingScaleAnim.setValue(1);
    }
  }, [googleLoading]);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
  }, []);

  useEffect(() => {
    if (initMode === 'register') {
      setIsRegistering(true);
      onInitModeConsumed?.();
    }
  }, [initMode]);

  // Handle Google OAuth code arriving via deep link relay (prayoverus://auth?code=...)
  useEffect(() => {
    if (pendingGoogleAuthCode) {
      const verifier = googleRequest?.codeVerifier || _googleCodeVerifier;
      onGoogleAuthCodeConsumed?.();
      handleGoogleResponse(pendingGoogleAuthCode, verifier);
    }
  }, [pendingGoogleAuthCode]);

  const GOOGLE_DISCOVERY = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  // iOS native client — reverse client ID scheme registered in app.json infoPlist
  const IOS_CLIENT_ID = '798628803696-2sodci2f99h4ojbhiqm851im6bgjuiqg.apps.googleusercontent.com';
  // Web client — used for Android. Token exchange is proxied through the relay server
  // so the client_secret never lives in the app bundle.
  const WEB_CLIENT_ID = '798628803696-b9b82e0mer9c3cm7rpngmpr9eet2hilj.apps.googleusercontent.com';

  const nativeClientId = Platform.OS === 'ios' ? IOS_CLIENT_ID : WEB_CLIENT_ID;
  const googleRedirectUri = Platform.OS === 'ios'
    ? 'com.googleusercontent.apps.798628803696-2sodci2f99h4ojbhiqm851im6bgjuiqg:/'
    : 'https://shouldcallpaul.replit.app/auth/google/callback';

  const [googleRequest, googleResponse, googlePromptAsync] = useAuthRequest(
    {
      clientId: nativeClientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: googleRedirectUri,
      usePKCE: true,
    },
    GOOGLE_DISCOVERY
  );

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const verifier = googleRequest?.codeVerifier || _googleCodeVerifier;
      handleGoogleResponse(googleResponse.params?.code, verifier);
    }
  }, [googleResponse]);

  const fetchWithTimeout = (url, options, ms = 15000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timer));
  };

  const handleGoogleResponse = async (code, codeVerifier) => {
    try {
      setGoogleLoading(true);
      setLoginError('');
      if (!code) {
        setLoginError('Google sign-in failed. Please try again.');
        return;
      }
      // Exchange code via server-side proxy so client_secret stays off the device
      const tokenRes = await fetchWithTimeout('https://shouldcallpaul.replit.app/auth/google/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          codeVerifier: codeVerifier || undefined,
          redirectUri: googleRedirectUri,
        }),
      });
      const userInfo = await tokenRes.json();
      if (!tokenRes.ok || userInfo.error) {
        setLoginError('Google sign-in failed. Please try again.');
        return;
      }
      if (!userInfo.email) {
        setLoginError('Could not get email from Google. Please try again.');
        return;
      }
      const res = await fetch('https://shouldcallpaul.replit.app/googleLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({
          email: userInfo.email,
          google_id: userInfo.id,
          first_name: userInfo.given_name || '',
          last_name: userInfo.family_name || '',
          picture: userInfo.picture || '',
        }),
      });
      const data = await res.json();
      if (data.error === 0 && data.result?.length > 0) {
        const u = data.result[0];
        setGoogleLoading(false); // clear overlay before onLogin unmounts this component
        onLogin({
          id: u.user_id, email: u.email, firstName: u.real_name,
          userName: u.user_name, title: u.user_title, about: u.user_about,
          location: u.location, picture: u.picture, active: u.active,
          timestamp: u.timestamp, churchId: u.church_id, churchName: u.church_name,
          faith_points: u.faith_points || 0, faith_rank: u.faith_rank || null,
          prayer_count: parseInt(u.prayer_count, 10) || 0,
          request_count: parseInt(u.request_count, 10) || 0,
          auth_provider: 'google',
          has_password: u.has_password ?? false,
        });
      } else {
        setLoginError(data.result || 'Google sign-in failed. Please try again.');
      }
    } catch (error) {
      setLoginError('Google sign-in failed. Please check your connection.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Apple only shares email on the very first sign-in. On repeat sign-ins
  // credential.email is null, but the email is always inside the identityToken JWT.
  const decodeAppleEmail = (identityToken) => {
    try {
      const payload = identityToken.split('.')[1];
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
      return decoded.email || '';
    } catch (_) {
      return '';
    }
  };

  const completeAppleSignIn = async (credential, resolvedEmail) => {
    try {
      setAppleLoading(true);
      setLoginError('');
      const res = await fetch('https://shouldcallpaul.replit.app/appleLogin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify({
          apple_user_id: credential.user,
          email: resolvedEmail,
          first_name: credential.fullName?.givenName || '',
          last_name: credential.fullName?.familyName || '',
          identity_token: credential.identityToken || '',
        }),
      });
      const data = await res.json();
      if (data.error === 0 && data.result?.length > 0) {
        const u = data.result[0];
        setPendingAppleCredential(null);
        setAppleEmailInput('');
        onLogin({
          id: u.user_id, email: u.email, firstName: u.real_name,
          userName: u.user_name, title: u.user_title, about: u.user_about,
          location: u.location, picture: u.picture, active: u.active,
          timestamp: u.timestamp, churchId: u.church_id, churchName: u.church_name,
          faith_points: u.faith_points || 0, faith_rank: u.faith_rank || null,
          prayer_count: parseInt(u.prayer_count, 10) || 0,
          request_count: parseInt(u.request_count, 10) || 0,
          auth_provider: 'apple',
          has_password: u.has_password ?? false,
        });
      } else {
        setLoginError(data.result || 'Apple Sign-In failed. Please try again.');
      }
    } catch (error) {
      setLoginError('Apple Sign-In failed. Please check your connection.');
    } finally {
      setAppleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (!appleAvailable) return;
    try {
      setAppleLoading(true);
      setLoginError('');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Apple only provides email on the very first sign-in.
      // Fall back to decoding it from the identity token JWT for returning users.
      const resolvedEmail = credential.email || decodeAppleEmail(credential.identityToken || '') || '';

      if (!resolvedEmail) {
        // Apple didn't return email — prompt the user to enter it manually
        setAppleLoading(false);
        setPendingAppleCredential(credential);
        return;
      }

      await completeAppleSignIn(credential, resolvedEmail);
    } catch (error) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        setLoginError('Apple Sign-In failed. Please check your connection.');
      }
      setAppleLoading(false);
    }
  };

  // Registration form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  const [customChurch, setCustomChurch] = useState('');
  const [showCustomChurch, setShowCustomChurch] = useState(false);
  const [emailError, setEmailError] = useState('');

  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -10, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  

  // Facebook OAuth configuration
  const discovery = {
    authorizationEndpoint: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v18.0/oauth/access_token',
  };

  const [facebookRequest, facebookResponse, promptFacebookAsync] = useAuthRequest(
    {
      clientId: '31893875030227026',
      scopes: ['public_profile', 'email'],
      redirectUri: makeRedirectUri({
        scheme: 'prayoverus',
        path: 'redirect'
      }),
    },
    discovery
  );

  // Handle Facebook OAuth response
  useEffect(() => {
    if (facebookResponse?.type === 'success') {
      const { access_token } = facebookResponse.params;
      handleFacebookLogin(access_token);
    } else if (facebookResponse?.type === 'error') {
      Alert.alert('Facebook Login Error', facebookResponse.error?.message || 'Failed to login with Facebook');
    }
  }, [facebookResponse]);

  // Load saved email on mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await storage.getItem('rememberedEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
          console.log('✅ Loaded saved email:', savedEmail);
        } else {
          console.log('ℹ️ No saved email found');
        }
      } catch (error) {
        console.log('Error loading saved email:', error);
      }
    };
    loadSavedEmail();
  }, []);

  // Fetch churches when registration screen is shown
  useEffect(() => {
    const fetchChurches = async () => {
      if (isRegistering && churches.length === 0) {
        try {
          const response = await fetch('https://shouldcallpaul.replit.app/getAllChurches', {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.error === 0 && data.churches) {
              setChurches(data.churches);
              console.log('✅ Loaded', data.churches.length, 'churches');
            }
          }
        } catch (error) {
          console.log('Error loading churches:', error);
        }
      }
    };
    fetchChurches();
  }, [isRegistering]);

  // Save or clear email when Remember Me changes
  const handleRememberMeChange = async (checked) => {
    setRememberMe(checked);
    if (checked && email) {
      // Save email
      await storage.setItem('rememberedEmail', email);
      console.log('💾 Saved email for Remember Me:', email);
    } else {
      // Clear saved email
      await storage.removeItem('rememberedEmail');
      console.log('🗑️ Cleared saved email from Remember Me');
    }
  };
  

  // Email validation function
  const validateEmail = (email) => {
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email) {
      setEmailError('');
      return false;
    }
    
    if (!emailRegex.test(email)) {
      setEmailError('⚠️ Please enter a valid email address');
      return false;
    }
    
    setEmailError('');
    return true;
  };

  // Handle email change with validation
  const handleEmailChange = (text) => {
    setEmail(text);
    // Only validate if user has typed something
    if (text.length > 0) {
      validateEmail(text);
    } else {
      setEmailError('');
    }
  };

  const handleFacebookLogin = async (accessToken) => {
    setLoading(true);
    
    try {
      // Get user info from Facebook Graph API
      const graphResponse = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
      );
      const userData = await graphResponse.json();
      
      console.log('Facebook user data:', userData);
      
      if (!userData.email) {
        Alert.alert('Error', 'Could not get email from Facebook. Please use email login instead.');
        setLoading(false);
        return;
      }

      // Try to login with Facebook email
      const endpoint = 'https://shouldcallpaul.replit.app/login';
      const requestPayload = {
        email: userData.email,
        password: `fb_${userData.id}` // Use Facebook ID as password
      };
      
      console.log('📱 FACEBOOK LOGIN ATTEMPT:');
      console.log('POST ' + endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0 && data.result && data.result.length > 0) {
          // User exists, log them in
          const user = data.result[0];
          const userDataFormatted = {
            id: user.user_id,
            email: user.email,
            firstName: user.real_name,
            userName: user.user_name,
            title: user.user_title,
            about: user.user_about,
            location: user.location,
            picture: user.picture,
            active: user.active,
            timestamp: user.timestamp,
            churchName: user.church_name,
            faith_points: user.faith_points || 0,
            faith_rank: user.faith_rank || null,
            prayer_count: parseInt(user.prayer_count, 10) || 0,
            request_count: parseInt(user.request_count, 10) || 0,
            auth_provider: user.auth_provider || 'facebook',
            has_password: user.has_password ?? false,
          };
          
          console.log('Facebook login successful for user:', userDataFormatted.firstName);
          onLogin(userDataFormatted);
          // No popup needed - user sees the app loaded successfully!
          
        } else {
          // User doesn't exist, create account
          await createFacebookAccount(userData, accessToken);
        }
      } else {
        // User doesn't exist, create account
        await createFacebookAccount(userData, accessToken);
      }
      
    } catch (error) {
      console.log('Facebook login error:', error);
      Alert.alert('Error', 'Failed to login with Facebook. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createFacebookAccount = async (facebookData, accessToken) => {
    try {
      const nameParts = (facebookData.name || '').split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      const endpoint = 'https://shouldcallpaul.replit.app/createUser';
      const requestPayload = {
        email: facebookData.email,
        password: `fb_${facebookData.id}`,
        firstName: firstName,
        lastName: lastName,
        gender: null,
        placeId: "ChIJo05dXN_Mw4kR0opDnOf0g-Q",
        phone: null,
        picture: 'defaultUser.png',
        command: "createUser",
        jsonpCallback: "afterCreateUser",
        tz: timezone,
        env: "prod"
      };
      
      console.log('📱 CREATING FACEBOOK USER: POST ' + endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0) {
          Alert.alert('Success', 'Account created! Logging you in...', [
            { text: 'OK', onPress: () => handleFacebookLogin(accessToken) }
          ]);
        } else {
          const errorMessage = data.result || data.message || 'Failed to create account';
          Alert.alert('Error', errorMessage);
        }
      } else {
        Alert.alert('Error', 'Failed to create Facebook account');
      }
      
    } catch (error) {
      console.log('Create Facebook account error:', error);
      Alert.alert('Error', 'Failed to create account. Please try email signup instead.');
    }
  };

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim() || !firstName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (false) {
      // Church is now optional — removed requirement
    }

    setLoading(true);
    
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      
      // Use default picture for now - image upload can be added later
      const pictureFileName = 'defaultUser.png';
      
      const endpoint = 'https://shouldcallpaul.replit.app/createUser';
      const requestPayload = {
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        placeId: "ChIJo05dXN_Mw4kR0opDnOf0g-Q", // Default location
        phone: phone,
        picture: pictureFileName,
        church_id: selectedChurch ? selectedChurch.church_id : null,
        custom_church_name: showCustomChurch && customChurch.trim() ? customChurch.trim() : null,
        command: "createUser",
        jsonpCallback: "afterCreateUser",
        tz: timezone,
        env: "prod"
      };
      
      console.log('📱 MOBILE APP API CALL: POST ' + endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0) {
          // Auto-login immediately — no need to re-enter credentials
          handleLogin();
          
        } else {
          // Show actual error message from API
          const errorMessage = data.result || data.message || 'Failed to create account. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      } else {
        // Try to get error message from response body
        try {
          const errorData = await response.json();
          const errorMessage = errorData.result || errorData.message || 'Account creation service unavailable';
          Alert.alert('Error', errorMessage);
        } catch {
          Alert.alert('Error', 'Account creation service unavailable');
        }
      }
      
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError('Please fill in all fields');
      return;
    }

    setLoginError('');
    setLoading(true);
    
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/login';
      const requestPayload = {
        email: email,
        password: password
      };
      
      console.log('📱 MOBILE APP API CALL: POST ' + endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
        },
        body: JSON.stringify(requestPayload),
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.error === 0 && data.result && data.result.length > 0) {
          const user = data.result[0];
          const userData = {
            id: user.user_id,
            email: user.email,
            firstName: user.real_name,
            userName: user.user_name,
            title: user.user_title,
            about: user.user_about,
            location: user.location,
            picture: user.picture,
            active: user.active,
            timestamp: user.timestamp,
            churchId: user.church_id,
            churchName: user.church_name,
            faith_points: user.faith_points || 0,
            faith_rank: user.faith_rank || null,
            prayer_count: parseInt(user.prayer_count, 10) || 0,
            request_count: parseInt(user.request_count, 10) || 0,
            auth_provider: user.auth_provider || 'email',
            has_password: user.has_password ?? true,
          };
          
          console.log('Login successful for user:', userData.firstName, 'ID:', userData.id, 'Church:', user.church_name, 'Faith:', user.faith_points);
          
          // Save email if Remember Me is checked
          if (rememberMe) {
            try {
              await storage.setItem('rememberedEmail', email);
              console.log('💾 Email saved for Remember Me on login');
            } catch (error) {
              console.log('Error saving email:', error);
            }
          } else {
            console.log('ℹ️ Remember Me not checked - email not saved');
          }
          
          onLogin(userData);
          // No popup needed - user sees the app loaded successfully!
          
        } else {
          const errorMessage = data.result || data.message || 'Invalid email or password';
          setLoginError(errorMessage);
        }
      } else {
        setLoginError('Login service unavailable. Please try again.');
      }
      
    } catch (error) {
      setLoginError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = () => {
    if (isRegistering) {
      handleCreateAccount();
    } else {
      handleLogin();
    }
  };

  return (
    <LinearGradient 
      colors={['#0f172a', '#1e3a5f', '#1e40af', '#3b82f6']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoGlow, { opacity: glowAnim }]} />
          <Animated.Image 
            source={require('./assets/cross-hands.png')}
            style={[styles.mascot, { transform: [{ translateY: floatAnim }] }]}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.appName}>Pray Over Us</Text>
        <Text style={styles.subtitle}>
          {isRegistering ? 'Create Your Account' : 'Where Hope is Found'}
        </Text>

        {resetSuccess && (
          <View style={styles.resetSuccessBanner}>
            <Text style={styles.resetSuccessIcon}>✅</Text>
            <Text style={styles.resetSuccessText}>
              Password updated! Log in below with your new password.
            </Text>
          </View>
        )}
      
      {isRegistering && (
        <>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            placeholder="First Name"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            data-testid="input-firstname"
          />

          
          <View style={{ display: 'none' }}>
            <View style={styles.genderContainer}>
              <Text style={styles.genderLabel}>Gender:</Text>
              <TouchableOpacity 
                style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextSelected]}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextSelected]}>Female</Text>
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </>
      )}
      
      <Text style={styles.inputLabel}>Email Address</Text>
      <TextInput
        style={[styles.input, emailError && styles.inputError]}
        placeholder="Email"
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={email}
        onChangeText={handleEmailChange}
        keyboardType="email-address"
        autoCapitalize="none"
        data-testid="input-email"
      />
      {emailError ? (
        <Text style={styles.errorText}>{emailError}</Text>
      ) : null}
      
      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="rgba(255,255,255,0.4)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        textContentType="password"
        keyboardType="default"
        importantForAutofill="no"
        data-testid="input-password"
      />
      
      {!isRegistering && (
        <View style={styles.rememberMeContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => handleRememberMeChange(!rememberMe)}
            data-testid="checkbox-remember-me"
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
              {rememberMe && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.rememberMeText}>Remember my email</Text>
          </TouchableOpacity>
          
          {onForgotPassword && (
            <TouchableOpacity 
              style={styles.forgotPasswordButton}
              onPress={onForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      

      {/* Inline login error */}
      {!!loginError && (
        <View style={styles.loginErrorBox}>
          <Text style={styles.loginErrorIcon}>⚠️</Text>
          <Text style={styles.loginErrorText}>{loginError}</Text>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
        </Text>
      </TouchableOpacity>

      {/* Social Sign-In */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerLabel}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Sign-In */}
      {!!googleRequest && (
        <TouchableOpacity
          style={[styles.googleBtn, (googleLoading || !googleRequest) && { opacity: 0.6 }]}
          onPress={() => { setLoginError(''); _googleCodeVerifier = googleRequest?.codeVerifier || null; googlePromptAsync(); }}
          disabled={googleLoading || !googleRequest}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
            style={styles.googleBtnLogo}
            resizeMode="contain"
          />
          <Text style={styles.googleBtnText}>Sign in with Google</Text>
        </TouchableOpacity>
      )}

      {/* Full-screen loading overlay — plain View avoids Modal unmount crash */}
      {googleLoading && (
        <View style={[styles.loadingOverlay, StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
          <LinearGradient
            colors={['#020818', '#0a1628', '#0f2547', '#1a3a6b']}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[
            styles.loadingGlowRing,
            { opacity: loadingGlowAnim, transform: [{ scale: loadingScaleAnim }] },
          ]} />
          <Animated.Image
            source={require('./assets/cross-hands.png')}
            style={[styles.loadingIcon, {
              transform: [{ translateY: loadingFloatAnim }, { scale: loadingScaleAnim }],
            }]}
            resizeMode="contain"
          />
          <Text style={styles.loadingTitle}>Signing you in...</Text>
          <Text style={styles.loadingSubtitle}>Please wait a moment</Text>
        </View>
      )}

      {/* Apple email fallback prompt — shown when Apple doesn't return an email */}
      {pendingAppleCredential ? (
        <View style={{ width: '100%', marginBottom: 14 }}>
          <Text style={{ color: '#e2e8f0', fontSize: 14, marginBottom: 8, textAlign: 'center' }}>
             One more step — enter the email linked to your Apple ID:
          </Text>
          <TextInput
            style={[styles.input, { marginBottom: 10 }]}
            placeholder="Email address"
            placeholderTextColor="rgba(255,255,255,0.45)"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={appleEmailInput}
            onChangeText={setAppleEmailInput}
          />
          <TouchableOpacity
            style={[styles.signInButton, { marginBottom: 8, opacity: appleLoading ? 0.6 : 1 }]}
            onPress={() => {
              const trimmed = appleEmailInput.trim();
              if (!trimmed.includes('@')) { setLoginError('Please enter a valid email address.'); return; }
              completeAppleSignIn(pendingAppleCredential, trimmed);
            }}
            disabled={appleLoading}
          >
            {appleLoading
              ? <ActivityIndicator color="#1d3557" size="small" />
              : <Text style={styles.signInButtonText}> Continue with Apple</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setPendingAppleCredential(null); setAppleEmailInput(''); setLoginError(''); }}>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Apple Sign-In — native only, auto-hidden on Android */}
      {appleAvailable && !pendingAppleCredential && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={14}
          style={{ width: '100%', height: 48, marginBottom: 14, opacity: appleLoading ? 0.6 : 1 }}
          onPress={handleAppleSignIn}
        />
      )}

      <TouchableOpacity 
        style={styles.switchButton} 
        onPress={() => setIsRegistering(!isRegistering)}
      >
        <Text style={styles.switchText}>
          {isRegistering 
            ? 'Already have an account? Sign In' 
            : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>

      {onGuestMode && !isRegistering && (
        <TouchableOpacity style={styles.guestBtn} onPress={onGuestMode} activeOpacity={0.7}>
          <Text style={styles.guestBtnText}>🔍  Explore as Guest</Text>
        </TouchableOpacity>
      )}
      
      <Text style={styles.versionText}>
        {appBuild || `v${Constants.expoConfig?.version || '1.0.0'}`}
      </Text>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingGlowRing: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(147, 197, 253, 0.5)',
    shadowColor: '#60a5fa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 20,
  },
  loadingIcon: {
    width: 130,
    height: 130,
    marginBottom: 40,
    tintColor: '#e0f2fe',
  },
  loadingTitle: {
    color: '#e0f2fe',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  loadingSubtitle: {
    color: 'rgba(186, 230, 253, 0.65)',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  logo: {
    width: 200,
    height: 120,
    alignSelf: 'center',
  },
  mascot: {
    width: 140,
    height: 140,
    alignSelf: 'center',
  },
  welcomeText: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    letterSpacing: 1,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: 'rgba(255,255,255,0.6)',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 6,
    marginLeft: 2,
  },
  halfInputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    color: '#ffffff',
  },
  inputError: {
    borderColor: '#ff6b6b',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    paddingLeft: 5,
  },
  button: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#1e40af',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  guestBtn: {
    marginTop: 14, alignItems: 'center', paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14, borderStyle: 'dashed',
  },
  guestBtnText: {
    color: 'rgba(255,255,255,0.55)', fontSize: 14, fontWeight: '500',
  },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 16,
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dividerLabel: {
    color: 'rgba(255,255,255,0.5)', fontSize: 13, marginHorizontal: 12,
  },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 4, paddingVertical: 12,
    paddingHorizontal: 16, marginBottom: 14, borderWidth: 1,
    borderColor: '#dadce0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, shadowRadius: 2, elevation: 2,
  },
  googleBtnLogo: {
    width: 20, height: 20, marginRight: 12,
  },
  googleBtnText: {
    fontSize: 15, fontWeight: '600', color: '#3c4043', letterSpacing: 0.25,
  },
  loginErrorBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.18)',
    borderColor: 'rgba(239,68,68,0.45)',
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 11, paddingHorizontal: 14,
    marginBottom: 12, width: '100%', gap: 8,
  },
  loginErrorIcon: {
    fontSize: 16,
  },
  loginErrorText: {
    color: '#fca5a5', fontSize: 14, fontWeight: '600', flex: 1,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    marginHorizontal: 15,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  facebookButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imagePickerButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#60a5fa',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  genderLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginRight: 15,
  },
  genderButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginRight: 10,
  },
  genderButtonSelected: {
    backgroundColor: '#3b82f6',
  },
  genderButtonText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  genderButtonTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  forgotPasswordButton: {
    marginLeft: 'auto',
  },
  forgotPasswordText: {
    color: '#93c5fd',
    fontSize: 14,
    fontWeight: '600',
  },
  resetSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '100%',
    gap: 10,
  },
  resetSuccessIcon: {
    fontSize: 18,
  },
  resetSuccessText: {
    color: '#86efac',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  helpText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    color: '#28a745',
    marginBottom: 10,
  },
  successText: {
    fontSize: 16,
    color: '#155724',
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 8,
  },
  successSubtext: {
    fontSize: 14,
    color: '#155724',
    textAlign: 'center',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#ffffff',
  },
  eyeButton: {
    padding: 15,
  },
  eyeIcon: {
    fontSize: 20,
  },
  passwordHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
    marginTop: -10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  churchContainer: {
    width: '100%',
    marginBottom: 20,
  },
  churchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 10,
  },
  churchDropdown: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  churchOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  churchOptionSelected: {
    backgroundColor: 'rgba(59,130,246,0.3)',
  },
  churchOptionText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    flex: 1,
  },
  churchOptionTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
    marginTop: 30,
    paddingRight: 5,
  },
});