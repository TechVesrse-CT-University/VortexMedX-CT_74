// Reusable component styles for the MedConnect app
import { StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, ANIMATIONS } from './theme';

export const commonStyles = StyleSheet.create({
  // Screen containers
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.neutral.background
  },
  container: {
    flex: 1,
    padding: SPACING.lg
  },
  scrollContainer: {
    flexGrow: 1
  },
  
  // Cards and sections
  card: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md
  },
  section: {
    marginBottom: SPACING.xl
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  
  // Headers and titles
  screenTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.md
  },
  cardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm
  },
  
  // Text styles
  text: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary
  },
  textSecondary: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary
  },
  label: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs
  },
  
  // Buttons
  button: {
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary.main,
    ...SHADOWS.sm
  },
  buttonText: {
    ...TYPOGRAPHY.button,
    color: COLORS.primary.contrast
  },
  buttonIcon: {
    marginRight: SPACING.sm
  },
  buttonSecondary: {
    backgroundColor: COLORS.secondary.main
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary.main
  },
  buttonOutlineText: {
    color: COLORS.primary.main
  },
  buttonDisabled: {
    backgroundColor: COLORS.neutral.border,
    ...SHADOWS.none
  },
  buttonDisabledText: {
    color: COLORS.text.disabled
  },
  
  // Inputs
  inputContainer: {
    marginBottom: SPACING.lg
  },
  input: {
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.neutral.background,
    borderWidth: 1,
    borderColor: COLORS.neutral.border,
    ...TYPOGRAPHY.body1,
    color: COLORS.text.primary
  },
  inputFocused: {
    borderColor: COLORS.primary.main,
    borderWidth: 2
  },
  inputIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: 16,
    color: COLORS.text.secondary
  },
  inputError: {
    borderColor: COLORS.status.error,
    borderWidth: 2
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.status.error,
    marginTop: SPACING.xs
  },
  
  // Lists and items
  list: {
    flex: 1
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border
  },
  listItemContent: {
    flex: 1,
    marginLeft: SPACING.md
  },
  
  // Status indicators
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.primary.main
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary.contrast
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.xs
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm
  },
  
  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalContent: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    width: '90%',
    maxWidth: 400,
    ...SHADOWS.lg
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  modalTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary
  },
  modalCloseButton: {
    padding: SPACING.sm
  },
  
  // Forms
  form: {
    width: '100%'
  },
  formGroup: {
    marginBottom: SPACING.lg
  },
  formLabel: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs
  },
  formError: {
    ...TYPOGRAPHY.caption,
    color: COLORS.status.error,
    marginTop: SPACING.xs
  },
  
  // Animations
  fadeIn: {
    opacity: 1
  },
  fadeOut: {
    opacity: 0
  },
  scaleIn: {
    transform: [{ scale: 1 }]
  },
  scaleOut: {
    transform: [{ scale: 0 }]
  }
});

export default commonStyles;