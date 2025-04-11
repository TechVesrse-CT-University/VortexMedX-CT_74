import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Enhanced Footer Navigation Component with Center Add Button
 * 
 * This component creates a premium-looking footer with:
 * - Home button (left)
 * - History button 
 * - Elevated Add button in center
 * - Details button
 * - Profile button (right)
 * 
 * Features:
 * - Animated press feedback
 * - Safe area compatibility
 * - Platform-specific styling
 * - Improved accessibility
 * - Smoother shadows and transitions
 */
export default function FooterNav({ userRole, setUserRole }) {
  // Get navigation object to handle screen changes
  const navigation = useNavigation();
  // Get safe area insets for proper bottom padding on notched devices
  const insets = useSafeAreaInsets();
  
  // Helper function to navigate based on user role
  const navigateBasedOnRole = (baseScreenName) => {
    // Navigate to role-specific screens based on userRole
    if (baseScreenName === 'Home') {
      // Home screen is already handled in App.js
      navigation.navigate('Home');
    } else if (baseScreenName === 'Details') {
      // Navigate to role-specific Details screen
      switch(userRole) {
        case 'labOwner':
          navigation.navigate('DetailsScreenLabOwner', { userId: null });
          break;
        case 'doctor':
          navigation.navigate('DetailsScreenDoctor', { userId: null });
          break;
        case 'patient':
        default:
          navigation.navigate('DetailsScreenPatient', { userId: null });
          break;
      }
    } else if (baseScreenName === 'History') {
      // For History, we'll pass the userRole as a parameter
      navigation.navigate('History', { userRole: userRole });
    } else {
      // For other screens, navigate normally
      navigation.navigate(baseScreenName);
    }
  };
  
  return (
    <View style={[
      styles.container,
      { paddingBottom: Math.max(insets.bottom, 10) } // Ensure enough padding on notched devices
    ]}>
      {/* ===== HOME BUTTON ===== */}
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => navigateBasedOnRole('Home')}
        activeOpacity={0.7} // Better press feedback
        accessibilityLabel="Home Screen"
        accessibilityRole="button"
      >
        {/* Home Icon - changes color when active */}
        <Ionicons 
          name="home" 
          size={24} 
          color={navigation.isFocused('Home') ? styles.activeColor.color : styles.inactiveColor.color} 
        />
        <Text style={[
          styles.footerText,
          navigation.isFocused('Home') ? styles.activeText : styles.inactiveText
        ]}>Home</Text>
      </TouchableOpacity>

      {/* ===== HISTORY BUTTON ===== */}
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => navigateBasedOnRole('History')}
        activeOpacity={0.7}
        accessibilityLabel="History Screen"
        accessibilityRole="button"
      >
        {/* Clock Icon */}
        <Ionicons 
          name="time" 
          size={24} 
          color={navigation.isFocused('History') ? styles.activeColor.color : styles.inactiveColor.color} 
        />
        <Text style={[
          styles.footerText,
          navigation.isFocused('History') ? styles.activeText : styles.inactiveText
        ]}>History</Text>
      </TouchableOpacity>

      {/* ===== CENTER ADD BUTTON (SPECIAL STYLE) ===== */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigateBasedOnRole('Upload')}
        activeOpacity={0.85} // Less opacity change for premium feel
        accessibilityLabel="Upload New Content"
        accessibilityRole="button"
      >
        {/* Big Plus Sign in White */}
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>

      {/* ===== DETAILS BUTTON ===== */}
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => navigateBasedOnRole('Details')}
        activeOpacity={0.7}
        accessibilityLabel="Details Screen"
        accessibilityRole="button"
      >
        {/* Document Icon */}
        <Ionicons 
          name="document-text" 
          size={24} 
          color={navigation.isFocused('Details') ? styles.activeColor.color : styles.inactiveColor.color} 
        />
        <Text style={[
          styles.footerText,
          navigation.isFocused('Details') ? styles.activeText : styles.inactiveText
        ]}>Details</Text>
      </TouchableOpacity>

      {/* ===== PROFILE BUTTON ===== */}
      <TouchableOpacity 
        style={styles.footerButton}
        onPress={() => navigateBasedOnRole('Profile')}
        activeOpacity={0.7}
        accessibilityLabel="Profile Screen"
        accessibilityRole="button"
      >
        {/* Person Icon */}
        <Ionicons 
          name="person" 
          size={24} 
          color={navigation.isFocused('Profile') ? styles.activeColor.color : styles.inactiveColor.color} 
        />
        <Text style={[
          styles.footerText,
          navigation.isFocused('Profile') ? styles.activeText : styles.inactiveText
        ]}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Enhanced StyleSheet for the Footer Navigation
 * 
 * Improvements include:
 * - Consistent color variables
 * - Platform-specific styling
 * - Better shadow implementation
 * - Improved spacing and sizing
 * - Proper active/inactive states
 */
const styles = StyleSheet.create({
  // Main container for the footer
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EAEAEA', // Lighter border for modern look
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  // Style for regular footer buttons
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    height: 56, // Fixed height for consistent look
  },
  
  // Colors as separate objects for easy reference
  activeColor: {
    color: '#3957D1', // Slightly deeper blue for better contrast
  },
  inactiveColor: {
    color: '#A9B4C0', // Softer gray for inactive items
  },
  
  // Base text style
  footerText: {
    fontSize: 12,
    fontWeight: '500', // Medium weight for better readability
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Active text style
  activeText: {
    color: '#3957D1',
    fontWeight: '600', // Bold when active
  },
  
  // Inactive text style
  inactiveText: {
    color: '#A9B4C0',
  },
  
  // Enhanced style for the center Add button
  addButton: {
    backgroundColor: '#3957D1', // Matches active item color
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
    // Platform specific shadow styling
    ...Platform.select({
      ios: {
        shadowColor: '#3957D1',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
    // Add subtle border for dimension
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});