import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function ViewAppointmentsScreen({ user, navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch appointments for lab owner
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('labId', '==', user.uid),
        orderBy('date', 'desc')
      );
      
      const appointmentsSnapshot = await getDocs(appointmentsQuery);
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAppointments(appointmentsData);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      Alert.alert('Error', 'Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    try {
      // Handle both Firestore timestamps and ISO strings
      const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Lab Appointments</Text>
      </View>

      {/* Appointments list */}
      {loading ? (
        <ActivityIndicator size="large" color="#4E73DF" style={styles.loader} />
      ) : appointments.length > 0 ? (
        <View style={styles.appointmentsContainer}>
          {appointments.map((appointment) => (
            <View key={appointment.id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <MaterialIcons name="event" size={24} color="#4E73DF" />
                <Text style={styles.appointmentDate}>
                  {formatDate(appointment.dateTime || appointment.date)}
                </Text>
              </View>
              
              <View style={styles.appointmentDetails}>
                <Text style={styles.detailLabel}>Patient:</Text>
                <Text style={styles.detailValue}>
                  {appointment.patientName || 'Unknown Patient'}
                </Text>
              </View>
              
              <View style={styles.appointmentDetails}>
                <Text style={styles.detailLabel}>Test Type:</Text>
                <Text style={styles.detailValue}>
                  {appointment.testType || 'Not specified'}
                </Text>
              </View>
              
              <View style={styles.appointmentDetails}>
                <Text style={styles.detailLabel}>Status:</Text>
                <Text style={[styles.detailValue, 
                  appointment.status === 'completed' ? styles.statusCompleted : 
                  appointment.status === 'scheduled' ? styles.statusScheduled : 
                  styles.statusPending]}>
                  {appointment.status ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : 'Pending'}
                </Text>
              </View>
              
              <TouchableOpacity style={styles.viewDetailsButton}>
                <Text style={styles.viewDetailsText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="event-busy" size={64} color="#E2E8F0" />
          <Text style={styles.emptyStateText}>No appointments found</Text>
          <Text style={styles.emptyStateSubText}>Any scheduled appointments will appear here</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  loader: {
    marginTop: 50,
  },
  appointmentsContainer: {
    padding: 15,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  appointmentDate: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#333',
  },
  appointmentDetails: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    width: 80,
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
  },
  statusCompleted: {
    color: '#48BB78',
  },
  statusScheduled: {
    color: '#4299E1',
  },
  statusPending: {
    color: '#ED8936',
  },
  viewDetailsButton: {
    backgroundColor: '#4E73DF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  viewDetailsText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A5568',
    marginTop: 15,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 5,
    textAlign: 'center',
  },
});