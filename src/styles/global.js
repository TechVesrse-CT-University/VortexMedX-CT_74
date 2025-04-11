import { StyleSheet } from 'react-native';

export const globalStyles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3748',
  },
});