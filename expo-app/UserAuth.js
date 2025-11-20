import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Buffer } from 'buffer';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri, useAuthRequest } from 'expo-auth-session';
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

// Forgot Password Screen
export function ForgotPasswordScreen({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

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
        Alert.alert('Success', data.result);
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
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image 
          source={require('./assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Forgot Password?</Text>
        <Text style={styles.helpText}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
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
              <ActivityIndicator color="white" />
              <Text style={styles.buttonText}>Sending...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchButton} onPress={onBack}>
          <Text style={styles.switchText}>← Back to Sign In</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Reset Password Screen
export function ResetPasswordScreen({ token, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const endpoint = 'https://shouldcallpaul.replit.app/resetPassword';
      const requestPayload = {
        token: token,
        newPassword: newPassword
      };

      console.log('📱 PASSWORD RESET:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify({ token: token, newPassword: '***' }, null, 2));

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
          Alert.alert(
            'Success!', 
            data.result || 'Password reset successful! You can now log in with your new password.',
            [{ text: 'OK', onPress: onSuccess }]
          );
        } else {
          Alert.alert('Error', data.result || 'Failed to reset password');
        }
      } else {
        Alert.alert('Error', 'Service unavailable. Please try again later.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Image 
          source={require('./assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Reset Password</Text>
        <Text style={styles.helpText}>
          Enter your new password below.
        </Text>

        <Text style={styles.inputLabel}>New Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="password"
            textContentType="password"
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.passwordHint}>
          Password must be at least 6 characters
        </Text>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="white" />
              <Text style={styles.buttonText}>Resetting...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function LoginScreen({ onLogin, onForgotPassword }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Registration form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState(null);
  const [phone, setPhone] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [churches, setChurches] = useState([]);
  const [selectedChurch, setSelectedChurch] = useState(null);
  
  // Password reveal logic - show last typed character
  const [displayPassword, setDisplayPassword] = useState('');
  const [lastRevealedIndex, setLastRevealedIndex] = useState(-1);
  const revealTimerRef = useRef(null);

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
  
  useEffect(() => {
    if (password.length === 0) {
      setDisplayPassword('');
      setLastRevealedIndex(-1);
      return;
    }
    
    // Show the last character temporarily
    const lastIndex = password.length - 1;
    setLastRevealedIndex(lastIndex);
    
    // Build display string: dots for all chars except last one
    const dots = '•'.repeat(password.length - 1);
    const lastChar = password[lastIndex];
    setDisplayPassword(dots + lastChar);
    
    // Clear any existing timer
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
    }
    
    // After 1 second, hide the last character too
    revealTimerRef.current = setTimeout(() => {
      setDisplayPassword('•'.repeat(password.length));
      setLastRevealedIndex(-1);
    }, 1000);
    
    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
      }
    };
  }, [password]);

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
            churchName: user.church_name
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
      
      console.log('📱 CREATING FACEBOOK USER:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
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
    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!selectedChurch) {
      Alert.alert('Error', 'Please select your church');
      return;
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
        church_id: selectedChurch.church_id,
        command: "createUser",
        jsonpCallback: "afterCreateUser",
        tz: timezone,
        env: "prod"
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
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
          Alert.alert('Success', 'Account created successfully! Please sign in with your new credentials.', [
            { text: 'OK', onPress: () => setIsRegistering(false) }
          ]);
          
          // Clear form
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setPhone(null);
          setGender(null);
          setSelectedChurch(null);
          
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
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = 'https://shouldcallpaul.replit.app/login';
      const requestPayload = {
        email: email,
        password: password
      };
      
      // Clean debug output - endpoint and payload ONLY
      console.log('📱 MOBILE APP API CALL:');
      console.log('POST ' + endpoint);
      console.log(JSON.stringify(requestPayload, null, 2));
      
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
            churchName: user.church_name
          };
          
          console.log('Login successful for user:', userData.firstName, 'ID:', userData.id);
          
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
          // Show actual error message from API
          const errorMessage = data.result || data.message || 'Invalid email or password';
          Alert.alert('Error', errorMessage);
        }
      } else {
        Alert.alert('Error', 'Login service unavailable');
      }
      
    } catch (error) {
      
      // Fallback for testing - only if you want to test without valid credentials
      const mockUser = {
        id: 353, // Use your test user ID
        email: email,
        firstName: email.split('@')[0],
        lastName: '',
      };
      
      onLogin(mockUser);
      Alert.alert('Info', 'Using test login (production API unavailable)');
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
    <KeyboardAvoidingView 
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image 
        source={require('./assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.subtitle}>
        {isRegistering ? 'Create Account' : 'Sign In'}
      </Text>
      
      {isRegistering && (
        <>
          
          <View style={styles.nameRow}>
            <View style={styles.halfInputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                data-testid="input-firstname"
              />
            </View>
            <View style={styles.halfInputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={[styles.input, styles.halfInput]}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                data-testid="input-lastname"
              />
            </View>
          </View>

          {/* Church Selection Dropdown */}
          <View style={styles.churchContainer}>
            <Text style={styles.churchLabel}>Select Your Church:</Text>
            <ScrollView 
              style={styles.churchDropdown}
              nestedScrollEnabled={true}
            >
              {churches.map((church) => (
                <TouchableOpacity
                  key={church.church_id}
                  style={[
                    styles.churchOption,
                    selectedChurch?.church_id === church.church_id && styles.churchOptionSelected
                  ]}
                  onPress={() => setSelectedChurch(church)}
                  data-testid={`church-option-${church.church_id}`}
                >
                  <Text style={[
                    styles.churchOptionText,
                    selectedChurch?.church_id === church.church_id && styles.churchOptionTextSelected
                  ]}>
                    {church.church_name}{church.church_addr ? ` (${church.church_addr})` : ''}
                  </Text>
                  {selectedChurch?.church_id === church.church_id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
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
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        data-testid="input-email"
      />
      
      <Text style={styles.inputLabel}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={displayPassword}
        onChangeText={(text) => {
          const lengthDiff = text.length - displayPassword.length;
          
          // Autofill detection: if more than 1 character added at once
          if (lengthDiff > 1) {
            // Autofill pasted entire password - use it directly
            setPassword(text);
            setDisplayPassword('•'.repeat(text.length));
          } else if (lengthDiff === 1) {
            // User typed a single character
            const newChar = text[text.length - 1];
            setPassword(password + newChar);
          } else if (lengthDiff < 0) {
            // User deleted character(s)
            setPassword(password.slice(0, text.length));
          }
        }}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
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
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleAuth}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Please wait...' : (isRegistering ? 'Create Account' : 'Sign In')}
        </Text>
      </TouchableOpacity>
      
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  logo: {
    width: 200,
    height: 120,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#8B5CF6',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginLeft: 2,
  },
  halfInputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#8B5CF6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: '#8B5CF6',
    fontSize: 14,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#d1d5db',
  },
  dividerText: {
    marginHorizontal: 15,
    color: '#6b7280',
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
    borderColor: '#8B5CF6',
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#666',
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
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genderLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 15,
  },
  genderButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  genderButtonSelected: {
    backgroundColor: '#8B5CF6',
  },
  genderButtonText: {
    color: '#666',
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
    borderColor: '#8B5CF6',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    color: '#666',
    fontSize: 14,
  },
  forgotPasswordButton: {
    marginLeft: 'auto',
  },
  forgotPasswordText: {
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  passwordInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  eyeIcon: {
    fontSize: 20,
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
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
    color: '#333',
    marginBottom: 10,
  },
  churchDropdown: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: 'white',
  },
  churchOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  churchOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  churchOptionText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  churchOptionTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
});