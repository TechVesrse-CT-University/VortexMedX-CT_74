import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function DetailsScreenDoctor({ route, navigation, user }) {
  const doctorId = user?.uid;
  const [recentPatients, setRecentPatients] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [statistics, setStatistics] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    pendingReports: 0,
    completedAppointments: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctorDashboardData = async () => {
      if (!doctorId) {
        setError('Doctor ID not found');
        setLoading(false);
        return;
      }
      
      try {
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get tomorrow's date at midnight
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Fetch upcoming appointments for this doctor
        const appointmentsQuery = query(
          collection(db, 'appointments'),
          where('doctorId', '==', doctorId),
          where('dateTime', '>=', today),
          orderBy('dateTime', 'asc'),
          limit(10)
        );
        
        const appointmentsSnapshot = await getDocs(appointmentsQuery);
        const appointmentsData = [];
        
        // Count today's appointments
        let todayAppointments = 0;
        
        for (const doc of appointmentsSnapshot.docs) {
          const data = doc.data();
          const appointmentDate = data.dateTime?.toDate();
          
          // Format the appointment data
          const formattedAppointment = {
            id: doc.id,
            ...data,
            date: appointmentDate?.toLocaleDateString() || 'Unknown date',
            time: appointmentDate?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Unknown time'
          };
          
          appointmentsData.push(formattedAppointment);
          
          // Check if appointment is today
          if (appointmentDate && appointmentDate >= today && appointmentDate < tomorrow) {
            todayAppointments++;
          }
        }
        
        setUpcomingAppointments(appointmentsData);
        
        // Fetch recent patients
        const patientsQuery = query(
          collection(db, 'patientRecords'),
          where('doctorId', '==', doctorId),
          orderBy('lastVisit', 'desc'),
          limit(5)
        );
        
        const patientsSnapshot = await getDocs(patientsQuery);
        const patientsData = [];
        
        for (const doc of patientsSnapshot.docs) {
          const data = doc.data();
          // Get patient details
          let patientDetails = { name: 'Unknown Patient' };
          
          try {
            const patientDoc = await getDoc(doc(db, 'users', data.patientId));
            if (patientDoc.exists()) {
              patientDetails = patientDoc.data();
            }
          } catch (err) {
            console.error('Error fetching patient details:', err);
          }
          
          patientsData.push({
            id: doc.id,
            patientId: data.patientId,
            name: patientDetails.name || 'Unknown Patient',
            lastVisit: data.lastVisit?.toDate()?.toLocaleDateString() || 'Unknown date',
            condition: data.condition || 'Not specified',
            age: patientDetails.age || 'N/A'
          });
        }
        
        setRecentPatients(patientsData);
        
        // Fetch pending reports
        const reportsQuery = query(
          collection(db, 'medicalReports'),
          where('doctorId', '==', doctorId),
          where('status', '==', 'pending'),
          limit(5)
        );
        
        const reportsSnapshot = await getDocs(reportsQuery);
        const reportsData = [];
        
        for (const doc of reportsSnapshot.docs) {
          const data = doc.data();
          // Get patient name
          let patientName = 'Unknown Patient';
          
          try {
            const patientDoc = await getDoc(doc(db, 'users', data.patientId));
            if (patientDoc.exists()) {
              patientName = patientDoc.data().name || 'Unknown Patient';
            }
          } catch (err) {
            console.error('Error fetching patient name:', err);
          }
          
          reportsData.push({
            id: doc.id,
            patientId: data.patientId,
            patientName: patientName,
            type: data.type || 'General Report',
            dueDate: data.dueDate?.toDate()?.toLocaleDateString() || 'No due date'
          });
        }
        
        setPendingReports(reportsData);
        
        // Set statistics
        const totalPatientsQuery = query(
          collection(db, 'patientRecords'),
          where('doctorId', '==', doctorId)
        );
        
        const totalPatientsSnapshot = await getDocs(totalPatientsQuery);
        
        const completedAppointmentsQuery = query(
          collection(db, 'appointments'),
          where('doctorId', '==', doctorId),
          where('status', '==', 'completed')
        );
        
        const completedAppointmentsSnapshot = await getDocs(completedAppointmentsQuery);
        
        setStatistics({
          totalPatients: totalPatientsSnapshot.size,
          appointmentsToday: todayAppointments,
          pendingReports: reportsSnapshot.size,
          completedAppointments: completedAppointmentsSnapshot.size
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDashboardData();
  }, [doctorId]);
    
    // Handle search functionality
    const handleSearch = async (query) => {
      setSearchQuery(query);
      
      if (query.trim() === '') {
        setSearchResults([]);
        return;
      }
      
      try {
        // Search for patients by name
        const patientsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'patient'),
          limit(10)
        );
        
        const patientsSnapshot = await getDocs(patientsQuery);
        const results = [];
        
        patientsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          // Simple client-side filtering
          if (data.name && data.name.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              id: doc.id,
              name: data.name,
              type: 'patient'
            });
          }
        });
        
        setSearchResults(results);
      } catch (err) {
        console.error('Error searching patients:', err);
      }
    };
    
    // Navigate to patient details
    const handleViewPatient = (patientId) => {
      navigation.navigate('PatientRecordsScreen', { userId: patientId });
    };
    
    // Navigate to create new appointment
    const handleCreateAppointment = () => {
      navigation.navigate('ViewAppointmentsScreen', { doctorId });
    };

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
      {/* Doctor Dashboard Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Doctor Dashboard</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patients..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
        </View>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {searchResults.map(result => (
              <TouchableOpacity 
                key={result.id} 
                style={styles.searchResultItem}
                onPress={() => handleViewPatient(result.id)}
              >
                <FontAwesome5 name="user" size={16} color="#4E73DF" />
                <Text style={styles.searchResultText}>{result.name}</Text>
                <MaterialIcons name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#4E73DF' }]}>
            <Text style={styles.statNumber}>{statistics.totalPatients}</Text>
            <Text style={styles.statLabel}>Total Patients</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#1CC88A' }]}>
            <Text style={styles.statNumber}>{statistics.appointmentsToday}</Text>
            <Text style={styles.statLabel}>Today's Appointments</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F6C23E' }]}>
            <Text style={styles.statNumber}>{statistics.pendingReports}</Text>
            <Text style={styles.statLabel}>Pending Reports</Text>
          </View>
        </View>
        {/* Recent Patients */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="people" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Recent Patients</Text>
          </View>
          
          {recentPatients.length > 0 ? (
            recentPatients.map(patient => (
              <TouchableOpacity 
                key={patient.id} 
                style={styles.patientItem}
                onPress={() => handleViewPatient(patient.patientId)}
              >
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientDetails}>Age: {patient.age} • Last Visit: {patient.lastVisit}</Text>
                  <Text style={styles.patientCondition}>{patient.condition}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#999" />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent patients</Text>
          )}
          
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('DoctorPatientRecordsScreen')}
          >
            <Text style={styles.viewAllText}>View All Patients</Text>
          </TouchableOpacity>
        </View>

        {/* Medical History Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="history" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Medical History</Text>
          </View>

          {/* Upcoming Appointments */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="event" size={24} color="#4E73DF" />
              <Text style={styles.cardTitle}>Upcoming Appointments</Text>
            </View>
            
            {upcomingAppointments.length > 0 ? (
              upcomingAppointments.map(appointment => (
                <View key={appointment.id} style={styles.appointmentItem}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentDate}>{appointment.date} at {appointment.time}</Text>
                    <Text style={styles.appointmentPatient}>
                      Patient: {appointment.patientName || 'Unknown Patient'}
                    </Text>
                    <Text style={styles.appointmentType}>{appointment.type || 'General Checkup'}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.appointmentButton}
                    onPress={() => navigation.navigate('ViewAppointmentsScreen', { appointmentId: appointment.id })}
                  >
                    <Text style={styles.appointmentButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No upcoming appointments</Text>
            )}
            
            <TouchableOpacity 
              style={styles.scheduleButton}
              onPress={handleCreateAppointment}
            >
              <Text style={styles.scheduleButtonText}>Create New Appointment</Text>
            </TouchableOpacity>
          </View>

          {/* Pending Reports */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="assignment" size={24} color="#4E73DF" />
              <Text style={styles.cardTitle}>Pending Reports</Text>
            </View>
            
            {pendingReports.length > 0 ? (
              pendingReports.map(report => (
                <View key={report.id} style={styles.reportItem}>
                  <View style={styles.reportInfo}>
                    <Text style={styles.reportType}>{report.type}</Text>
                    <Text style={styles.reportPatient}>Patient: {report.patientName}</Text>
                    <Text style={styles.reportDueDate}>Due: {report.dueDate}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.reportButton}
                    onPress={() => navigation.navigate('PatientRecordsScreen', { reportId: report.id })}
                  >
                    <Text style={styles.reportButtonText}>Complete</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No pending reports</Text>
            )}
          </View>

          <Text style={styles.emptyText}>No medical history recorded</Text>
        </View>

        {/* Test Results Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="assignment" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Test Results</Text>
          </View>

          <Text style={styles.emptyText}>No test results found</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ScheduleNewTest')}
          >
            <MaterialIcons name="event" size={24} color="#4E73DF" />
            <Text style={styles.actionText}>Order Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Prescription')}
          >
            <MaterialCommunityIcons name="pill" size={24} color="#4E73DF" />
            <Text style={styles.actionText}>Prescribe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  historyItem: {
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyDate: {
    fontSize: 14,
    color: '#718096',
  },
  historyNotes: {
    fontSize: 14,
    color: '#4A5568',
    fontStyle: 'italic',
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
  resultNotes: {
    fontSize: 14,
    color: '#4A5568',
  },
  emptyText: {
    textAlign: 'center',
    color: '#A0AEC0',
    marginVertical: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  actionText: {
    marginLeft: 8,
    color: '#4E73DF',
    fontWeight: '500',
  },
  errorText: {
    color: '#F56565',
    textAlign: 'center',
    padding: 20,
  },
});
