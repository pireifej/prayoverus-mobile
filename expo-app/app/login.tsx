import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Surface,
  TextInput,
  Divider,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@prayoverus.com');
  const [password, setPassword] = useState('password');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Login Failed', 'Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    Alert.alert('Guest Mode', 'Guest mode coming soon!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="favorite" size={64} color="#6366f1" />
          <Text variant="displaySmall" style={styles.appName}>
            PrayOverUs
          </Text>
          <Text variant="headlineSmall" style={styles.tagline}>
            Pray with friends and the world around you
          </Text>
        </View>

        {/* Login Form */}
        <Surface style={styles.formContainer} elevation={2}>
          <Text variant="headlineSmall" style={styles.formTitle}>
            Welcome Back
          </Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry
            style={styles.input}
          />
          
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
          >
            Sign In
          </Button>
          
          <Button mode="text" style={styles.forgotButton}>
            Forgot Password?
          </Button>
        </Surface>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <Divider style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <Divider style={styles.divider} />
        </View>

        {/* Guest Login */}
        <View style={styles.socialContainer}>
          <Button
            mode="text"
            onPress={handleGuestLogin}
            style={styles.guestButton}
          >
            Continue as Guest
          </Button>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text variant="titleMedium" style={styles.featuresTitle}>
            Connect Through Prayer
          </Text>
          
          <View style={styles.feature}>
            <MaterialIcons name="favorite" size={24} color="#6366f1" />
            <View style={styles.featureText}>
              <Text variant="titleSmall">Personal Prayer Space</Text>
              <Text variant="bodySmall" style={styles.featureDescription}>
                Create and track your personal prayers. Mark them as answered.
              </Text>
            </View>
          </View>
          
          <View style={styles.feature}>
            <MaterialIcons name="people" size={24} color="#6366f1" />
            <View style={styles.featureText}>
              <Text variant="titleSmall">Community Prayer Wall</Text>
              <Text variant="bodySmall" style={styles.featureDescription}>
                Share prayer requests and pray for others.
              </Text>
            </View>
          </View>
          
          <View style={styles.feature}>
            <MaterialIcons name="group" size={24} color="#6366f1" />
            <View style={styles.featureText}>
              <Text variant="titleSmall">Prayer Groups</Text>
              <Text variant="bodySmall" style={styles.featureDescription}>
                Join prayer groups with friends and family.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  appName: {
    color: '#6366f1',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 20,
  },
  formContainer: {
    padding: 24,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: '#6366f1',
  },
  forgotButton: {
    alignSelf: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
  },
  socialContainer: {
    marginBottom: 32,
  },
  guestButton: {
    alignSelf: 'center',
  },
  featuresContainer: {
    marginTop: 20,
  },
  featuresTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureText: {
    flex: 1,
    marginLeft: 16,
  },
  featureDescription: {
    color: '#64748b',
    marginTop: 4,
  },
});