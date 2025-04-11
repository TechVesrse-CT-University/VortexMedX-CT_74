import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../styles/theme';
import { screenStyles } from '../styles/screens';

const Header = ({ title }) => {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        {/* App Logo */}
        <View style={styles.logo}>
          <Text style={styles.logoText}>MC</Text>
        </View>
        {/* App Name */}
        <Text style={styles.appName}>MedConnect</Text>
      </View>
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.primary.main,
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...screenStyles.homeHeader
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: title ? SPACING.sm : 0
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.primary.light,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm
  },
  logoText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary.main,
    fontWeight: 'bold'
  },
  appName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary.contrast,
    fontWeight: 'bold'
  },
  title: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary.contrast,
    marginTop: SPACING.xs
  }
});

export default Header;