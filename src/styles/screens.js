// Screen-specific styles for the MedConnect app
import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, ANIMATIONS } from './theme';

const { width, height } = Dimensions.get('window');

export const screenStyles = StyleSheet.create({
  // Authentication screens (Login, Signup, ForgotPassword)
  authContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
    justifyContent: 'center',
    padding: SPACING.xl
  },
  authCard: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.lg
  },
  authLogo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    transform: [{ scale: 1.1 }]
  },
  authTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primary.dark,
    textAlign: 'center',
    marginBottom: SPACING.md
  },
  authSubtitle: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl
  },
  
  // Home screens (Patient, Doctor, LabOwner)
  homeContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral.background
  },
  homeHeader: {
    backgroundColor: COLORS.primary.main,
    paddingTop: SPACING.xl + (Platform.OS === 'ios' ? 44 : 24),
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
    ...SHADOWS.md
  },
  homeHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  homeHeaderTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary.contrast,
    marginBottom: SPACING.xs
  },
  homeHeaderSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.primary.contrast,
    opacity: 0.8
  },
  homeContent: {
    flex: 1,
    marginTop: -BORDER_RADIUS.xl,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg
  },
  
  // Dashboard cards
  dashboardCard: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md
  },
  dashboardCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md
  },
  dashboardCardTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.text.primary
  },
  dashboardCardIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary.light,
    justifyContent: 'center',
    alignItems: 'center'
  },
  
  // Stats cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs
  },
  statsCard: {
    flex: 1,
    minWidth: width / 2 - SPACING.xl,
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    margin: SPACING.xs,
    ...SHADOWS.sm
  },
  statsValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary.main,
    marginBottom: SPACING.xs
  },
  statsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.text.secondary
  },
  
  // List screens (Records, Tests, Appointments)
  listContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
    padding: SPACING.lg
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg
  },
  listTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary
  },
  listCard: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  listItemTitle: {
    ...TYPOGRAPHY.subtitle1,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },
  listItemSubtitle: {
    ...TYPOGRAPHY.body2,
    color: COLORS.text.secondary
  },
  
  // Detail screens
  detailContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral.background
  },
  detailHeader: {
    backgroundColor: COLORS.primary.main,
    paddingTop: SPACING.xl + (Platform.OS === 'ios' ? 44 : 24),
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    ...SHADOWS.md
  },
  detailHeaderTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary.contrast,
    marginBottom: SPACING.xs
  },
  detailContent: {
    flex: 1,
    marginTop: -BORDER_RADIUS.xl,
    backgroundColor: COLORS.neutral.background,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg
  },
  
  // Profile screen
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.xl
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary.light,
    marginBottom: SPACING.md,
    ...SHADOWS.md
  },
  profileName: {
    ...TYPOGRAPHY.h2,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs
  },
  profileRole: {
    ...TYPOGRAPHY.subtitle2,
    color: COLORS.text.secondary
  },
  profileSection: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm
  },
  
  // Schedule screens
  scheduleContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral.background
  },
  scheduleHeader: {
    backgroundColor: COLORS.neutral.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral.border,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg
  },
  scheduleContent: {
    flex: 1,
    padding: SPACING.lg
  },
  scheduleCard: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary.main,
    ...SHADOWS.sm
  },
  
  // Upload screens
  uploadContainer: {
    flex: 1,
    backgroundColor: COLORS.neutral.background,
    padding: SPACING.lg
  },
  uploadCard: {
    backgroundColor: COLORS.neutral.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: COLORS.neutral.border,
    marginBottom: SPACING.lg
  },
  uploadIcon: {
    marginBottom: SPACING.md
  },
  uploadText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
    textAlign: 'center'
  },
  
  // Common screen elements
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl
  },
  emptyStateIcon: {
    marginBottom: SPACING.lg
  },
  emptyStateText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.md
  }
});

export default screenStyles;