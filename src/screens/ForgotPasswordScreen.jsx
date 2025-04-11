import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const THEME = {
  primary: '#4E73DF',
  secondary: '#5a78d7',
  accent: '#3a5fd1',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  inputBg: '#F5F7FA',
  inputBorder: '#E6E9ED',
  error: '#e74a3b',
  success: '#1cc88a'
};

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Success', 'Password reset email sent. Please check your inbox.');
      navigation.goBack();
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Reset Password</Text>
        <Text style={styles.instructions}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>
        
        <View style={[
          styles.inputContainer, 
          emailFocused && styles.inputFocused
        ]}>
          <Text style={[
            styles.inputLabel, 
            emailFocused && styles.inputLabelFocused
          ]}>
            Email Address
          </Text>
          <View style={styles.inputWrapper}>
            <MaterialIcons 
              name="email" 
              size={20} 
              color={emailFocused ? THEME.primary : THEME.textSecondary} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="your@email.com"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[
            styles.resetButton,
            loading && styles.resetButtonDisabled
          ]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.resetButtonText}>Send Reset Link</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.background,
  },
  formContainer: {
    width: '85%',
    maxWidth: 380,
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: THEME.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  instructions: {
    color: THEME.textSecondary,
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 18,
    position: 'relative',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputLabelFocused: {
    color: THEME.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.inputBorder,
    height: 52,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: THEME.primary,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: THEME.text,
  },
  resetButton: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20,
  },
  resetButtonDisabled: {
    backgroundColor: THEME.secondary,
    opacity: 0.7,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: THEME.primary,
    fontWeight: '500',
    fontSize: 14,
  },
});