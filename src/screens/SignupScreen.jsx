import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  Animated,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; 
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '../supabase';
import { createUserProfile } from '../services/databaseService';

const { width } = Dimensions.get('window');

const generateUID = (role) => {
  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString(); 
  switch(role) {
    case 'doctor':
      return `DR${randomDigits}`;
    case 'labOwner':
      return `LB${randomDigits}`;
    default: // patient
      return `PT${randomDigits}`;
  }
};

// Custom animated button component
const AnimatedButton = ({ onPress, style, children, disabled }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 5,
    }).start();
  };

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
    >
      <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Input field with animated label
const AnimatedInput = ({ placeholder, value, onChangeText, secureTextEntry, autoCapitalize, icon, keyboardType }) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const labelPosition = useRef(new Animated.Value(value ? 1 : 0)).current;
  
  useEffect(() => {
    Animated.timing(labelPosition, {
      toValue: isFocused || value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value]);

  return (
    <TouchableWithoutFeedback onPress={() => inputRef.current.focus()}>
      <View style={styles.inputContainer}>
        <Animated.Text
          style={[
            styles.floatingLabel,
            {
              transform: [
                {
                  translateY: labelPosition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25],
                  }),
                },
              ],
              fontSize: labelPosition.interpolate({
                inputRange: [0, 1],
                outputRange: [16, 12],
              }),
              color: labelPosition.interpolate({
                inputRange: [0, 1],
                outputRange: ['#9E9E9E', '#4E73DF'],
              }),
            },
          ]}
        >
          {placeholder}
        </Animated.Text>
        
        <View style={styles.inputRow}>
          {icon && <MaterialIcons name={icon} size={20} color={isFocused ? "#4E73DF" : "#9E9E9E"} style={styles.inputIcon} />}
          <TextInput
            ref={inputRef}
            style={[styles.input, isFocused && styles.inputFocused]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize || "none"}
            keyboardType={keyboardType || "default"}
            placeholder=""
          />
        </View>
        
        <Animated.View
          style={[
            styles.inputUnderline,
            {
              backgroundColor: isFocused ? '#4E73DF' : '#E0E0E0',
              width: isFocused ? '100%' : '0%',
            },
          ]}
        />
      </View>
    </TouchableWithoutFeedback>
  );
};

// Custom role selection component
const RoleSelector = ({ selectedRole, onSelectRole }) => {
  const roles = [
    { value: 'patient', label: 'Patient', icon: 'person' },
    { value: 'labOwner', label: 'Lab Owner', icon: 'science' },
    { value: 'doctor', label: 'Doctor', icon: 'medical-services' }
  ];
  
  return (
    <View style={styles.roleSelectorContainer}>
      <Text style={styles.roleLabel}>Select your role</Text>
      <View style={styles.roleOptions}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.value}
            style={[
              styles.roleOption,
              selectedRole === role.value && styles.roleOptionSelected
            ]}
            onPress={() => onSelectRole(role.value)}
          >
            <MaterialIcons
              name={role.icon}
              size={24}
              color={selectedRole === role.value ? '#FFFFFF' : '#757575'}
              style={styles.roleIcon}
            />
            <Text
              style={[
                styles.roleText,
                selectedRole === role.value && styles.roleTextSelected
              ]}
            >
              {role.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default function SignupScreen({ setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('patient'); // Default role
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Run entry animations
    const animationSet = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]);
    
    animationSet.start();
    return () => {
      animationSet.stop();
      fadeAnim.setValue(0); // Reset animation values
      translateYAnim.setValue(50);
    };
  }, []);

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  // Handle signup with email and password
  const handleSignup = async () => {
    // Dismiss keyboard
    Keyboard.dismiss();
    
    if (!name || !email || !password || !confirmPassword || !phoneNumber) {
      Alert.alert('Error', 'Please fill all fields including your name');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    // Phone number validation regex
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setLoading(true);
      
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        Alert.alert('Error', 'An account with this email already exists');
        setLoading(false);
        return;
      }

      // Format phone with + if not already present
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
      
      // Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: formattedPhone,
            role
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!data?.user?.id) {
        throw new Error('Failed to create user account');
      }

      const user_friendly_uid = generateUID(role);
      
      // Create user profile with role
      const { error: profileError } = await createUserProfile({
        user_id: data.user.id,
        user_email: email,
        user_role: role,
        user_phone: formattedPhone,
        user_uid: user_friendly_uid,
        user_name: name
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Check if auth user was created before trying to delete
        if (data?.user?.id) {
          await supabase.auth.admin.deleteUser(data.user.id);
        }
        // Don't throw error if user was actually created
        if (!profileError.message.includes('duplicate key')) {
          throw profileError;
        }
      }

      // Set user data
      setUser({
        email,
        role,
        name: name || email.split('@')[0],
        phone: formattedPhone,
        uid: data.user.id,
        user_friendly_uid
      });

      Alert.alert('Success', 'Account created successfully!');
      
      // Navigation is handled by App.js based on user role
      // We just need to set the user in context
    } catch (error) {
      console.error('Error signing up:', error.message);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid
  const isFormValid = name && email && password && confirmPassword && phoneNumber && password === confirmPassword;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Animated.View 
          style={[
            styles.formContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }]
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <MaterialIcons name="healing" size={48} color="#4E73DF" />
            <Text style={styles.title}>MedConnect</Text>
          </View>
          
          <Text style={styles.subtitle}>Create your account</Text>
          
          <AnimatedInput
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            icon="person"
            autoCapitalize="words"
          />
          
          <AnimatedInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            icon="email"
          />
          
          <AnimatedInput
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            icon="phone"
            keyboardType="phone-pad"
          />
          
          <View style={styles.passwordContainer}>
            <AnimatedInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon="lock"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <FontAwesome name={showPassword ? 'eye' : 'eye-slash'} size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.passwordContainer}>
            <AnimatedInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              icon="lock"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <FontAwesome name={showConfirmPassword ? 'eye' : 'eye-slash'} size={20} color="#9E9E9E" />
            </TouchableOpacity>
          </View>
          
          <RoleSelector selectedRole={role} onSelectRole={setRole} />
          
          <AnimatedButton
            disabled={!isFormValid || loading}
            style={[
              styles.button,
              !isFormValid && styles.buttonDisabled
            ]}
            onPress={handleSignup}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </AnimatedButton>
          
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>
          
          <TouchableOpacity
            style={styles.loginLink}
            onPress={navigateToLogin}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#2C3E50',
  },
  inputFocused: {
    color: '#4E73DF',
  },
  floatingLabel: {
    position: 'absolute',
    left: 30,
    top: 15,
  },
  inputUnderline: {
    height: 2,
    marginTop: 5,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 15,
    zIndex: 1,
  },
  roleSelectorContainer: {
    marginVertical: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8C8D',
    marginBottom: 10,
  },
  roleOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginHorizontal: 5,
    backgroundColor: '#F8F9FA',
  },
  roleOptionSelected: {
    backgroundColor: '#4E73DF',
    borderColor: '#4E73DF',
  },
  roleIcon: {
    marginBottom: 5,
  },
  roleText: {
    fontSize: 12,
    color: '#757575',
  },
  roleTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4E73DF',
    borderRadius: 8,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#BDC3C7',
    shadowOpacity: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    paddingHorizontal: 10,
    color: '#7F8C8D',
    fontSize: 14,
  },
  loginLink: {
    alignItems: 'center',
    padding: 10,
  },
  loginLinkText: {
    color: '#7F8C8D',
    fontSize: 14,
  },
  loginLinkTextBold: {
    color: '#4E73DF',
    fontWeight: 'bold',
  },
});
