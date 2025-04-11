import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Animated,
  Dimensions,
  Platform 
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#4E73DF',
  secondary: '#1CC88A',
  warning: '#F6C23E',
  danger: '#E74A3B',
  background: '#F8F9FC',
  card: '#FFFFFF',
  text: '#2D3748',
  textSecondary: '#718096',
  border: '#E3E6F0',
  gradients: {
    primary: ['#4E73DF', '#3A5FD1'],
    success: ['#1CC88A', '#16A673'],
    warning: ['#F6C23E', '#E5B02D'],
    danger: ['#E74A3B', '#D32F2F']
  }
};

export default function DetailsScreenPatient({ route, navigation }) {
  const { userId } = route.params || {};
  const [patientData, setPatientData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch patient data
        const patientDoc = await getDoc(doc(db, 'users', userId));
        if (!patientDoc.exists()) {
          throw new Error('Patient data not found');
        }
        setPatientData({
          id: patientDoc.id,
          ...patientDoc.data()
        });

        // Fetch test results
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('patientId', '==', userId),
          orderBy('uploadedAt', 'desc')
        );
        const resultsSnapshot = await getDocs(resultsQuery);
        const resultsData = resultsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().uploadedAt?.toDate()?.toLocaleDateString() || 'Unknown date'
        }));
        setTestResults(resultsData);

        // Fetch upcoming appointments
        const now = new Date();
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('patientId', '==', userId),
          where('dateTime', '>=', now),
          orderBy('dateTime', 'asc')
        );
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().dateTime?.toDate()?.toLocaleDateString() || 'Unknown date',
          time: doc.data().dateTime?.toDate()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Unknown time'
        }));
        setAppointments(appointmentsData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4E73DF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>My Health Records</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      <ScrollView style={styles.content}>
        {/* Personal Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>My Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{patientData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{patientData.age || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Blood Type:</Text>
            <Text style={styles.infoValue}>{patientData.bloodType || 'N/A'}</Text>
          </View>
        </View>

        {/* Upcoming Appointments */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="event" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Upcoming Appointments</Text>
          </View>
          
          {appointments.length > 0 ? (
            appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentItem}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.appointmentTitle}>{appointment.testType || 'Appointment'}</Text>
                  <Text style={styles.appointmentDate}>{appointment.date} at {appointment.time}</Text>
                </View>
                <Text style={styles.appointmentLocation}>
                  Location: {appointment.location || 'Not specified'}
                </Text>
                <TouchableOpacity 
                  style={styles.appointmentActionButton}
                  onPress={() => navigation.navigate('ViewAppointments', { appointmentId: appointment.id })}
                >
                  <Text style={styles.appointmentActionText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No upcoming appointments</Text>
          )}
          
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={handleScheduleAppointment}
          >
            <Text style={styles.scheduleButtonText}>Schedule New Appointment</Text>
          </TouchableOpacity>
        </View>

        {/* Medications Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="pills" size={20} color="#4E73DF" />
            <Text style={styles.cardTitle}>Current Medications</Text>
          </View>
          
          {medications.length > 0 ? (
            medications.slice(0, 3).map((medication) => (
              <View key={medication.id} style={styles.medicationItem}>
                <View style={styles.medicationHeader}>
                  <Text style={styles.medicationName}>{medication.name || 'Unknown Medication'}</Text>
                  <View style={styles.medicationDosage}>
                    <Text style={styles.dosageText}>{medication.dosage || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.medicationDetails}>
                  <Text style={styles.medicationInstruction}>
                    <Text style={styles.instructionLabel}>Instructions: </Text>
                    {medication.instructions || 'Take as directed'}
                  </Text>
                  <Text style={styles.medicationPrescriber}>
                    <Text style={styles.prescriberLabel}>Prescribed by: </Text>
                    {medication.prescriberName || 'Unknown Doctor'}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No medications currently prescribed</Text>
          )}
          
          {medications.length > 3 && (
            <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllRecords}>
              <Text style={styles.viewAllText}>View All Medications</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Test Results */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="assignment" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>My Test Results</Text>
          </View>

          {testResults.length > 0 ? (
            testResults.map((result) => (
              <View key={result.id} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultName}>{result.testType || 'Test Result'}</Text>
                  <Text style={styles.resultDate}>{result.date}</Text>
                </View>
                <Text style={styles.resultStatus}>
                  Status: {result.status || 'Completed'}
                </Text>
                {result.notes && (
                  <Text style={styles.resultNotes}>
                    Notes: {result.notes}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No test results available</Text>
          )}
        </View>

        {/* Health Tips */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="favorite" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Health Tips</Text>
          </View>
          <Text style={styles.tipText}>
            • Drink at least 8 glasses of water daily
          </Text>
          <Text style={styles.tipText}>
            • Get 7-8 hours of sleep each night
          </Text>
          <Text style={styles.tipText}>
            • Exercise for 30 minutes most days
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    paddingTop: Platform.OS === 'ios' ? 44 : 24
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text
  },
  content: {
    flex: 1,
    padding: 16
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.text,
    marginLeft: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '500'
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
    color: THEME.text,
    fontWeight: '500'
  },
  appointmentItem: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text
  },
  appointmentDate: {
    fontSize: 14,
    color: THEME.primary,
    fontWeight: '500'
  },
  appointmentLocation: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 12
  },
  appointmentActionButton: {
    backgroundColor: THEME.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  appointmentActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600'
  },
  scheduleButton: {
    backgroundColor: THEME.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: THEME.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  medicationItem: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    flex: 1
  },
  medicationDosage: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  dosageText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500'
  },
  medicationDetails: {
    marginTop: 8
  },
  medicationInstruction: {
    fontSize: 14,
    color: THEME.text,
    marginBottom: 4
  },
  instructionLabel: {
    color: THEME.textSecondary,
    fontWeight: '500'
  },
  medicationPrescriber: {
    fontSize: 14,
    color: THEME.text
  },
  prescriberLabel: {
    color: THEME.textSecondary,
    fontWeight: '500'
  },
  viewAllButton: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  viewAllText: {
    color: THEME.primary,
    fontSize: 14,
    fontWeight: '600'
  },
  emptyText: {
    fontSize: 14,
    color: THEME.textSecondary,
    textAlign: 'center',
    marginVertical: 16
  },
  errorText: {
    fontSize: 16,
    color: THEME.danger,
    textAlign: 'center',
    marginTop: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.background
  },

  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    width: 100,
    fontSize: 15,
    color: '#718096',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  appointmentItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  appointmentDate: {
    fontSize: 14,
    color: '#718096',
  },
  appointmentLocation: {
    fontSize: 14,
    color: '#4A5568',
  },
  resultItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultDate: {
    fontSize: 14,
    color: '#718096',
  },
  resultStatus: {
    fontSize: 14,
    color: '#4A5568',
  },
  resultNotes: {
    fontSize: 14,
    color: '#4A5568',
    fontStyle: 'italic',
    marginTop: 4,
  },
  tipText: {
    fontSize: 15,
    color: '#4A5568',
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginVertical: 16,
  },
  errorText: {
    color: '#F56565',
    textAlign: 'center',
    padding: 20,
  },
});
