import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';

// Simple storage for saving last username
class SimpleStorage {
  constructor() {
    this.data = {};
    if (Platform.OS === 'web') {
      this.isWeb = true;
    } else {
      this.isWeb = false;
    }
  }

  async setItem(key, value) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } else {
      this.data[key] = value;
    }
  }

  async getItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } else {
      return this.data[key] || null;
    }
    return null;
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

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            editable={!loading}
          />
          <TouchableOpacity 
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            editable={!loading}
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
  
  // Password reveal logic - show last typed character
  const [displayPassword, setDisplayPassword] = useState('');
  const [lastRevealedIndex, setLastRevealedIndex] = useState(-1);
  const revealTimerRef = useRef(null);

  // Load saved username on mount
  useEffect(() => {
    const loadSavedEmail = async () => {
      try {
        const savedEmail = await storage.getItem('lastUsername');
        if (savedEmail) {
          setEmail(savedEmail);
        }
      } catch (error) {
        console.log('Error loading saved email:', error);
      }
    };
    loadSavedEmail();
  }, []);
  
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

  const handleCreateAccount = async () => {
    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
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
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
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
          'Authorization': 'Basic ' + btoa('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
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
            timestamp: user.timestamp
          };
          
          console.log('Login successful for user:', userData.firstName, 'ID:', userData.id);
          
          // Save username for next time
          try {
            await storage.setItem('lastUsername', email);
          } catch (error) {
            console.log('Error saving username:', error);
          }
          
          onLogin(userData);
          Alert.alert('Success', `Welcome back, ${userData.firstName}!`);
          
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
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
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
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        data-testid="input-email"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={displayPassword}
        onChangeText={(text) => {
          // Calculate the actual password based on what changed
          if (text.length > displayPassword.length) {
            // User added a character - take the last char from text
            const newChar = text[text.length - 1];
            setPassword(password + newChar);
          } else if (text.length < displayPassword.length) {
            // User deleted a character
            setPassword(password.slice(0, -1));
          }
        }}
        autoCapitalize="none"
        autoCorrect={false}
        data-testid="input-password"
      />
      
      {!isRegistering && onForgotPassword && (
        <TouchableOpacity 
          style={styles.forgotPasswordButton}
          onPress={onForgotPassword}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -10,
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
});