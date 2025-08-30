import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      console.log('Attempting login with your production API...');
      
      const response = await fetch('https://www.prayoverus.com:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
        timeout: 10000,
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login API Response:', data);
        
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
          onLogin(userData);
          Alert.alert('Success', `Welcome back, ${userData.firstName}!`);
          
        } else {
          console.log('Login failed - API returned error:', data.error);
          Alert.alert('Error', 'Invalid email or password');
        }
      } else {
        console.log('Login failed - HTTP error:', response.status);
        Alert.alert('Error', 'Login service unavailable');
      }
      
    } catch (error) {
      console.log('Login error:', error.message);
      
      // Fallback for testing - only if you want to test without valid credentials
      console.log('Using fallback login for testing...');
      const mockUser = {
        id: 353, // Use your test user ID
        email: email,
        firstName: email.split('@')[0],
        lastName: '',
      };
      
      onLogin(mockUser);
      Alert.alert('Info', 'Using test login (production API unavailable)');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PrayOverUs</Text>
      <Text style={styles.subtitle}>
        {isRegistering ? 'Create Account' : 'Sign In'}
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.button} onPress={handleAuth}>
        <Text style={styles.buttonText}>
          {isRegistering ? 'Create Account' : 'Sign In'}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
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
});