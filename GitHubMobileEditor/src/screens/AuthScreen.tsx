import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { setToken, setValidating, setAuthError } from '../store/authSlice';
import { githubApi } from '../services/githubApi';
import { storageService } from '../services/storage';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    checkExistingToken();
  }, []);

  const checkExistingToken = async () => {
    try {
      const savedToken = await storageService.getToken();
      if (savedToken) {
        setIsValidating(true);
        githubApi.setToken(savedToken);
        const isValid = await githubApi.validateToken();

        if (isValid) {
          dispatch(setToken(savedToken));
          onAuthenticated();
        } else {
          await storageService.removeToken();
          setError('Saved token is invalid. Please enter a new token.');
        }
      }
    } catch (err) {
      console.error('Error checking existing token:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidateToken = async () => {
    if (!tokenInput.trim()) {
      setError('Please enter a GitHub Personal Access Token');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      githubApi.setToken(tokenInput);
      const isValid = await githubApi.validateToken();

      if (isValid) {
        await storageService.saveToken(tokenInput);
        dispatch(setToken(tokenInput));
        onAuthenticated();
      } else {
        githubApi.clearToken();
        setError('Invalid token. Please check your token and try again.');
      }
    } catch (err: any) {
      githubApi.clearToken();
      setError(err.message || 'Failed to validate token. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (isValidating) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0366d6" />
        <Text style={styles.loadingText}>Validating token...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>GitHub Mobile Editor</Text>
        <Text style={styles.subtitle}>Enter your GitHub Personal Access Token</Text>

        <TextInput
          style={styles.input}
          value={tokenInput}
          onChangeText={setTokenInput}
          placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleValidateToken}
          disabled={isValidating}
        >
          <Text style={styles.buttonText}>
            {isValidating ? 'Validating...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.helpText}>
          Need a token? Generate one at{'\n'}
          github.com → Settings → Developer settings → Personal access tokens
        </Text>
        <Text style={styles.helpText}>
          Required scopes: repo (for private) or public_repo (for public only)
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#24292e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#586069',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5da',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0366d6',
    padding: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#d73a49',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#586069',
  },
  helpText: {
    fontSize: 12,
    color: '#6a737d',
    textAlign: 'center',
    marginBottom: 8,
  },
});
