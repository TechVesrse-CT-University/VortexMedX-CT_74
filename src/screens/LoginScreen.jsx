import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  Platform,
  ImageBackground
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Enhanced color theme with more vibrant and modern palette
const THEME = {
  primary: '#4361EE',
  primaryDark: '#3A56D4',
  primaryLight: '#4E7DF7',
  secondary: '#F72585',
  secondaryLight: '#FF3D9A',
  accent: '#7209B7',
  background: '#F8F9FC',
  card: '#FFFFFF',
  text: '#2B2D42',
  textSecondary: '#6C757D',
  inputBg: '#F5F7FA',
  inputBorder: '#E6E9ED',
  error: '#E63946',
  success: '#06D6A0',
  warning: '#FFD166',
  info: '#118AB2',
  gradients: {
    primary: ['#4361EE', '#3A56D4'],
    secondary: ['#F72585', '#7209B7'],
    accent: ['#7209B7', '#560BAD'],
    success: ['#06D6A0', '#05A88A'],
    warning: ['#FFCA3A', '#FFB627'],
    error: ['#FF5C7A', '#E63946']
  },
  shadows: {
    light: {
      shadowColor: '#8F9BB3',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3
    },
    medium: {
      shadowColor: '#6E78AA',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6
    },
    strong: {
      shadowColor: '#3A56D4',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 10
    }
  }
};

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  
  // Animated values
  const logoAnim = useRef(new Animated.Value(0)).current;
  const formAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const loginTextOpacity = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  
  // Run entrance animations on mount
  useEffect(() => {
    Animated.stagger(250, [
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(logoAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true
      }),
      Animated.spring(formAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  // Button press animation
  const animateButtonPress = (pressed) => {
    Animated.spring(buttonScale, {
      toValue: pressed ? 0.96 : 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true
    }).start();
  };
  
  // Error shake animation
  const triggerShakeAnimation = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    if (!email || !password) {
      triggerShakeAnimation();
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    Animated.parallel([
      Animated.timing(loginTextOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
    
    try {
      // First authenticate
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (authError) throw authError;

      // Get user profile with multiple fallback approaches
      let profile;
      let lastError;
      
      try {
        // 1. First try by ID (most secure)
        const { data: idData, error: idError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();
        
        if (!idError && idData) {
          profile = idData;
        } else {
          console.log('ID lookup failed, trying email');
          lastError = idError;
          
          // 2. Try by email
          const { data: emailData, error: emailError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
            
          if (!emailError && emailData) {
            profile = emailData;
          } else {
            console.log('Email lookup failed, trying auth metadata');
            lastError = emailError;
            
            // 3. Fallback to auth user metadata if profile missing
            profile = {
              role: authData.user.user_metadata?.role || 'patient',
              user_friendly_uid: '',
              ...authData.user.user_metadata
            };
            
            // Log this case for admin review
            console.warn('Using auth metadata fallback for user:', email);
          }
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        lastError = err;
        throw new Error('Temporary issue loading your profile. Please try again or contact support if this continues.');
      }

      // Validate we have minimum required profile data
      if (!profile?.role) {
        console.error('Incomplete profile data:', profile);
        throw new Error('Your profile appears incomplete. Please contact support.');
      }

      const role = profile?.role;
      if (!role) {
        console.error('No role found in profile:', profile);
        throw new Error('Your account appears to be missing role information');
      }
      const userFriendlyUid = profile?.user_friendly_uid || '';

      // Set user in context
      setUser({
        email: authData.user.email,
        uid: authData.user.id,
        role,
        userFriendlyUid,
        name: authData.user.user_metadata?.name || authData.user.email.split('@')[0]
      });
      
      // Success animation before navigation
      Animated.sequence([
        Animated.timing(formAnim, {
          toValue: 0.9,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.spring(formAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true
        }),
        // Fade out the form
        Animated.timing(formAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start(() => {
        setLoading(false);
      });
      
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.message || 'Login failed. Please try again.';
      
      // Reset button state
      setLoading(false);
      Animated.parallel([
        Animated.timing(loginTextOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
      
      // Error animation
      triggerShakeAnimation();
      Alert.alert('Login Failed', errorMessage);
    }
  };

  // Animation calculations
  const logoTranslateY = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0]
  });
  
  const formTranslateY = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });

  const backgroundOpacity = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1]
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar backgroundColor={THEME.primaryDark} barStyle="light-content" />
        
        {/* Animated gradient background */}
        <Animated.View style={[styles.backgroundGradient, { opacity: backgroundOpacity }]}>
          <LinearGradient
            colors={[THEME.primaryDark, THEME.primary, THEME.primaryLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          />
        </Animated.View>
        
        {/* Decorative elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />
        
        {/* App logo */}
        <Animated.View style={[
          styles.logoContainer,
          { 
            opacity: logoAnim, 
            transform: [{ translateY: logoTranslateY }] 
          }
        ]}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>M</Text>
          </View>
          <Text style={styles.logoText}>VortexMedX</Text>
          <Text style={styles.logoSubtext}>Healthcare Management</Text>
        </Animated.View>
        
        {/* Form container */}
        <Animated.View style={[
          styles.formContainer,
          { 
            opacity: formAnim,
            transform: [
              { translateY: formTranslateY },
              { translateX: shakeAnim }
            ]
          }
        ]}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to continue</Text>
          
          {/* Email input */}
          <View style={[
            styles.inputContainer,
            emailFocused && styles.inputFocused
          ]}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[
              styles.inputWrapper,
              emailFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.inputIconContainer}>
                <View style={styles.inputIcon}>
                  <Text style={styles.inputIconText}>@</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                placeholderTextColor={THEME.textSecondary}
                editable={true}
                placeholder="Enter your email"
                testID="email-input"
              />
            </View>
          </View>
          
          {/* Password input */}
          <View style={[
            styles.inputContainer,
            passwordFocused && styles.inputFocused
          ]}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[
              styles.inputWrapper,
              passwordFocused && styles.inputWrapperFocused
            ]}>
              <View style={styles.inputIconContainer}>
                <View style={styles.inputIcon}>
                  <Text style={styles.inputIconText}>🔒</Text>
                </View>
              </View>
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholderTextColor={THEME.textSecondary}
                editable={true}
                placeholder="Enter your password"
                testID="password-input"
              />
              
              {/* Show/hide password toggle */}
              <TouchableOpacity 
                style={styles.visibilityToggle}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              >
                <Text style={styles.visibilityToggleText}>
                  {showPassword ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Forgot password link */}
          <TouchableOpacity 
            style={styles.forgotPasswordContainer}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
          {/* Login button */}
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity 
              style={styles.loginButton}
              activeOpacity={0.8}
              onPressIn={() => animateButtonPress(true)}
              onPressOut={() => animateButtonPress(false)}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={THEME.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Animated.Text style={[
                  styles.loginButtonText,
                  { opacity: loginTextOpacity }
                ]}>
                  Sign In
                </Animated.Text>
                
                <Animated.View style={[
                  styles.loadingContainer,
                  { opacity: loadingOpacity }
                ]}>
                  <ActivityIndicator color="white" size="small" />
                </Animated.View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Spacer */}
          <View style={{height: 20}} />
        </Animated.View>
        
        {/* Enhanced sign up link */}
        <Animated.View style={[
          styles.signupContainer,
          { opacity: formAnim }
        ]}>
          <TouchableOpacity 
            style={styles.signupButton}
            onPress={() => navigation.navigate('Signup')}
          >
            <Text style={styles.signupButtonText}>
              Don't have an account? <Text style={styles.signupButtonHighlight}>Create one now</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40
  },
  
  // Background and decorative elements
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    zIndex: -1,
  },
  gradient: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: -1,
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    zIndex: -1,
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: -150,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(67, 97, 238, 0.06)',
    zIndex: -1,
  },
  
  // Logo styles
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 1,
  },
  logoIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...THEME.shadows.strong,
  },
  logoIconText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: THEME.primary,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  logoSubtext: {
    fontSize: 16,
    color: '#fff',
    marginTop: 6,
    opacity: 0.9,
    letterSpacing: 0.5,
  },
  
  // Form container
  formContainer: {
    width: width * 0.9,
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    ...THEME.shadows.medium,
    zIndex: 2,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginBottom: 24,
  },
  
  // Input fields
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.inputBorder,
    height: 58,
    overflow: 'hidden',
    ...THEME.shadows.light,
  },
 
  inputIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  inputIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(67, 97, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputIconText: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '700',
  },
  input: {
    flex: 1,
    height: 58,
    fontSize: 16,
    color: THEME.text,
    paddingHorizontal: 8,
  },
  visibilityToggle: {
    paddingHorizontal: 16,
    height: '100%',
    justifyContent: 'center',
  },
  visibilityToggleText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Forgot password
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: THEME.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Login button
  loginButton: {
    borderRadius: 14,
    height: 56,
    overflow: 'hidden',
    ...THEME.shadows.medium,
  },
  buttonGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    position: 'absolute',
  },
  
  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: THEME.inputBorder,
  },
  dividerText: {
    paddingHorizontal: 16,
    color: THEME.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Social login
  socialLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginHorizontal: 12,
    backgroundColor: THEME.inputBg,
    justifyContent: 'center',
    alignItems: 'center',
    ...THEME.shadows.light,
  },
  socialButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.inputBorder,
  },
  socialButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textSecondary,
  },
  
  // Sign up section
  signupContainer: {
    marginTop: 30,
    paddingVertical: 2,
  },
  signupText: {
    color: THEME.text,
    fontSize: 16,
  },
  signupLink: {
    color: THEME.primary,
    fontWeight: '700',
  },
  
});
