import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ReportCard({ title, date, status, lab }) {
  return (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.lab}>{lab}</Text>
        <Text style={styles.date}>{date}</Text>
      </View>
      
      <View style={styles.rightSection}>
        <View style={[
          styles.statusBadge,
          status === 'Completed' ? styles.completed : styles.pending
        ]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
  },
  cardContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  lab: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#718096',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completed: {
    backgroundColor: '#C6F6D5',
  },
  pending: {
    backgroundColor: '#FED7D7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#22543D',
  },
});