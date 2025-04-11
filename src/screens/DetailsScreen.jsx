import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DetailsScreen({ route, navigation, userRole }) {
  const { userId } = route.params || {};
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!userId) {
        setError("No patient ID provided");
        setLoading(false);
        return;
      }

      try {
        // Create a timeout promise that rejects after 10 seconds
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 10000);
        });
        
        // Fetch patient data from Firestore with timeout
        let patientDataFound = false;
        
        try {
          // First try users collection
          const patientDoc = await Promise.race([
            getDoc(doc(db, 'users', userId)),
            timeoutPromise
          ]);
          
          if (patientDoc.exists()) {
            setPatientData({
              id: patientDoc.id,
              ...patientDoc.data(),
              source: 'users'
            });
            patientDataFound = true;
          }
        } catch (userError) {
          console.error('Error fetching from users collection:', userError);
          // Continue to try other collections
        }
        
        if (!patientDataFound) {
          try {
            // Try to find patient in patientRecords collection
            const patientRecordsQuery = query(
              collection(db, 'patientRecords'),
              where('patientId', '==', userId)
            );
            
            const patientRecordsSnapshot = await Promise.race([
              getDocs(patientRecordsQuery),
              timeoutPromise
            ]);
            
            if (!patientRecordsSnapshot.empty) {
              setPatientData({
                id: patientRecordsSnapshot.docs[0].id,
                ...patientRecordsSnapshot.docs[0].data(),
                source: 'patientRecords'
              });
              patientDataFound = true;
            }
          } catch (recordsError) {
            console.error('Error fetching from patientRecords collection:', recordsError);
            // Continue to fallback
          }
        }
        
        if (!patientDataFound) {
          // Set default values if patient not found in any collection
          setPatientData({ 
            name: "Unknown Patient", 
            patientId: userId,
            age: "N/A", 
            medicalHistory: [],
            source: 'default'
          });
        }

        // Fetch test results for the patient with timeout and error handling
        try {
          const testResultsQuery = query(
            collection(db, 'testResults'),
            where('patientId', '==', userId),
            orderBy('uploadedAt', 'desc')
          );
          
          const testResultsSnapshot = await Promise.race([
            getDocs(testResultsQuery),
            timeoutPromise
          ]);
          
          const testResultsData = testResultsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            formattedDate: doc.data().uploadedAt ? 
              (doc.data().uploadedAt.toDate ? doc.data().uploadedAt.toDate().toLocaleDateString() : new Date(doc.data().uploadedAt).toLocaleDateString()) : 
              'Unknown date'
          }));
          
          setTestResults(testResultsData);
        } catch (resultsError) {
          console.error('Error fetching test results:', resultsError);
          setTestResults([]);
        }
        
        // Fetch appointments for the patient with timeout and error handling
        try {
          const appointmentsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', userId),
            orderBy('dateTime', 'desc')
          );
          
          const appointmentsSnapshot = await Promise.race([
            getDocs(appointmentsQuery),
            timeoutPromise
          ]);
          
          const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            formattedDate: doc.data().dateTime ? new Date(doc.data().dateTime).toLocaleString() : 'Unknown date'
          }));
          
          setAppointments(appointmentsData);
        } catch (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
          setAppointments([]);
        }

        // Fetch reports for the patient (if fetchReports function exists)
        try {
          const reportsData = await Promise.race([
            fetchReports(userId),
            timeoutPromise
          ]);
          if (reportsData) setReports(reportsData);
        } catch (reportErr) {
          console.error('Error fetching reports:', reportErr);
          // Continue without reports rather than failing completely
          setReports([]);
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError("Failed to fetch patient data");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const formatDate = (dateTime) => {
    if (!dateTime) return 'N/A';
    
    try {
      // Handle both Firestore timestamps and ISO strings
      const date = dateTime.toDate ? dateTime.toDate() : new Date(dateTime);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Patient Details</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E73DF" />
          <Text style={styles.loadingText}>Loading patient data...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#F56565" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : patientData ? (
        <ScrollView style={styles.contentContainer}>
          {/* Patient Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="person" size={24} color="#4E73DF" />
              <Text style={styles.cardTitle}>Patient Information</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{patientData.name || patientData.patientName || "Unknown"}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Patient ID:</Text>
              <Text style={styles.infoValue}>{patientData.patientId || patientData.id || "Unknown"}</Text>
            </View>
            
            {patientData.age && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Age:</Text>
                <Text style={styles.infoValue}>{patientData.age}</Text>
              </View>
            )}
            
            {patientData.sex && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sex:</Text>
                <Text style={styles.infoValue}>{patientData.sex}</Text>
              </View>
            )}
            
            {patientData.contactNumber && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Contact:</Text>
                <Text style={styles.infoValue}>{patientData.contactNumber}</Text>
              </View>
            )}
            
            {patientData.email && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{patientData.email}</Text>
              </View>
            )}
          </View>
          
          {/* Test Results Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="assignment" size={24} color="#4E73DF" />
              <Text style={styles.cardTitle}>Test Results</Text>
            </View>
            
            {testResults.length > 0 ? (
              testResults.map((result, index) => (
                <View key={result.id || index} style={styles.resultItem}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultTitle}>{result.testType || "Test Result"}</Text>
                    <Text style={styles.resultDate}>{formatDate(result.uploadedAt)}</Text>
                  </View>
                  <Text style={styles.resultFileName}>{result.fileName || "Unknown file"}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="assignment-late" size={32} color="#A0AEC0" />
                <Text style={styles.emptyStateText}>No test results available</Text>
              </View>
            )}
          </View>
          
          {/* Appointments Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="event" size={24} color="#4E73DF" />
              <Text style={styles.cardTitle}>Appointments</Text>
            </View>
            
            {appointments.length > 0 ? (
              appointments.map((appointment, index) => (
                <View key={appointment.id || index} style={styles.appointmentItem}>
                  <View style={styles.appointmentHeader}>
                    <Text style={styles.appointmentTitle}>{appointment.testType || "Appointment"}</Text>
                    <View style={[
                      styles.statusBadge,
                      appointment.status === 'completed' ? styles.statusCompleted :
                      appointment.status === 'scheduled' ? styles.statusScheduled :
                      styles.statusPending
                    ]}>
                      <Text style={styles.statusText}>
                        {appointment.status ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1) : "Unknown"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.appointmentDate}>
                    {appointment.dateTime ? new Date(appointment.dateTime).toLocaleString() : "Date not specified"}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="event-busy" size={32} color="#A0AEC0" />
                <Text style={styles.emptyStateText}>No appointments scheduled</Text>
              </View>
            )}
          </View>
          
          {/* Reports Card */}
          {reports.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons name="description" size={24} color="#4E73DF" />
                <Text style={styles.cardTitle}>Medical Reports</Text>
              </View>
              
              {reports.map((report, index) => (
                <View key={report.id || index} style={styles.reportItem}>
                  <Text style={styles.reportText}>{report.name || "Unknown report"}</Text>
                  {report.date && <Text style={styles.reportDate}>{formatDate(report.date)}</Text>}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <MaterialIcons name="person-outline" size={48} color="#A0AEC0" />
          <Text style={styles.emptyStateText}>No patient data available</Text>
        </View>
      )}
    </View>
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 8,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4E73DF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F56565',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
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
    width: 80,
    fontSize: 15,
    color: '#718096',
    fontWeight: '500',
  },
  infoValue: {
    flex: 1,
    fontSize: 15,
    color: '#333',
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
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  resultDate: {
    fontSize: 14,
    color: '#718096',
  },
  resultFileName: {
    fontSize: 14,
    color: '#4E73DF',
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
    alignItems: 'center',
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusCompleted: {
    backgroundColor: '#C6F6D5',
  },
  statusScheduled: {
    backgroundColor: '#BEE3F8',
  },
  statusPending: {
    backgroundColor: '#FED7D7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportText: {
    fontSize: 15,
    color: '#333',
  },
  reportDate: {
    fontSize: 14,
    color: '#718096',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});
