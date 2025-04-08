import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage('Reset instructions sent to your email');
      // In a real app, you would call an API to send a reset link
      // const response = await api.post('/auth/forgot-password', { email });
      
      // For now, just simulate the API call with a timeout
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1500);
    } catch (error) {
      setMessage('Failed to send reset instructions');
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email address to receive password reset instructions</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Button
        mode="contained"
        onPress={handleSubmit}
        style={styles.button}
        loading={isSubmitting}
        disabled={isSubmitting}
      >
        Send Reset Instructions
      </Button>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
  message: {
    textAlign: 'center',
    marginVertical: 10,
    color: '#2196F3',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#2196F3',
  },
});

export default ForgotPasswordScreen; 