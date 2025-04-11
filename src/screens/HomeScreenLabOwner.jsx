import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { uploadFile } from '../services/storageService'; // Import Supabase storage function
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

export default function HomeScreenLabOwner({ navigation, user }) {
  // State variables
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [nextTest, setNextTest] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPatientUID, setSelectedPatientUID] = useState('');

  // Function to fetch lab owner data from Firebase with timeout handling
  const fetchLabOwnerData = async () => {
    // Create a timeout promise that rejects after 15 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), 15000);
    });

    try {
      setLoading(true);
      
      // Check if user.uid is valid
      if (!user?.uid) {
        throw new Error('User ID is missing or invalid');
      }
      
      // Initialize collections if they don't exist
      await Promise.race([initializeCollectionsIfNeeded(), timeoutPromise]);
      
      // Fetch appointments with timeout
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('labId', '==', user.uid)
      );
      const appointmentsSnapshot = await Promise.race([
        getDocs(appointmentsQuery),
        timeoutPromise
      ]);
      const appointmentsData = appointmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAppointments(appointmentsData);
      
      // Fetch test requests with timeout
      const testRequestsQuery = query(
        collection(db, 'testRequests'),
        where('labId', '==', user.uid),
        where('status', '==', 'pending')
      );
      const testRequestsSnapshot = await Promise.race([
        getDocs(testRequestsQuery),
        timeoutPromise
      ]);
      const testRequestsData = testRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestRequests(testRequestsData);
      
      // Fetch schedules with timeout
      const schedulesQuery = query(
        collection(db, 'schedules'),
        where('labId', '==', user.uid)
      );
      const schedulesSnapshot = await Promise.race([
        getDocs(schedulesQuery),
        timeoutPromise
      ]);
      const schedulesData = schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSchedules(schedulesData);
      
      // Find next test appointment
      if (appointmentsData.length > 0) {
        const sortedAppointments = [...appointmentsData].sort(
          (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
        );
        const nextAppointment = sortedAppointments.find(
          appointment => new Date(appointment.dateTime) > new Date()
        );
        if (nextAppointment) {
          try {
            // Get patient details with timeout
            const patientDoc = await Promise.race([
              getDoc(doc(db, 'users', nextAppointment.patientId)),
              timeoutPromise
            ]);
            if (patientDoc.exists()) {
              setNextTest({
                ...nextAppointment,
                patientName: patientDoc.data().name || 'Unknown Patient'
              });
            }
          } catch (patientError) {
            console.error('Error fetching patient details:', patientError);
            // Continue without patient details rather than failing completely
            setNextTest({
              ...nextAppointment,
              patientName: 'Unknown Patient'
            });
          }
        }
      }
      
      // Fetch recent activity
      const recentActivityData = [
        ...testRequestsData.slice(0, 2).map(req => ({
          type: 'request',
          text: `Received new test request from Dr. ${req.doctorName || 'Unknown'}`,
          timestamp: req.createdAt || new Date()
        })),
        ...appointmentsData.slice(0, 2).map(app => ({
          type: 'appointment',
          text: `Added slot to ${new Date(app.dateTime).toLocaleDateString()} schedule`,
          timestamp: app.createdAt || new Date()
        }))
      ];
      recentActivityData.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRecentActivity(recentActivityData.slice(0, 3));
      
    } catch (error) {
      console.error('Error fetching lab owner data:', error);
      Alert.alert(
        'Error', 
        `Failed to load data: ${error.message}. Please try again.`,
        [{ text: 'OK', onPress: () => setLoading(false) }]
      );
      // Set default empty values to prevent UI issues
      setAppointments([]);
      setTestRequests([]);
      setSchedules([]);
      setNextTest(null);
      setRecentActivity([]);
    } finally {
      // Ensure loading state is always turned off
      setLoading(false);
    }
  };

  // Initialize collections with sample data if they don't exist
  const initializeCollectionsIfNeeded = async () => {
    try {
      // Check if collections exist
      const appointmentsSnapshot = await getDocs(collection(db, 'appointments'));
      const testRequestsSnapshot = await getDocs(collection(db, 'testRequests'));
      const schedulesSnapshot = await getDocs(collection(db, 'schedules'));
      
      // If collections are empty, add sample data
      if (appointmentsSnapshot.empty) {
        await addDoc(collection(db, 'appointments'), {
          labId: user.uid,
          patientId: 'PT1234567890',
          dateTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          testType: 'Blood Test',
          status: 'scheduled',
          createdAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'appointments'), {
          labId: user.uid,
          patientId: 'PT9876543210',
          dateTime: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
          testType: 'X-Ray',
          status: 'scheduled',
          createdAt: serverTimestamp()
        });
      }
      
      if (testRequestsSnapshot.empty) {
        await addDoc(collection(db, 'testRequests'), {
          labId: user.uid,
          patientId: 'PT1234567890',
          doctorId: 'DR1234567890',
          doctorName: 'Smith',
          testType: 'Blood Test',
          urgency: 'normal',
          status: 'pending',
          createdAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'testRequests'), {
          labId: user.uid,
          patientId: 'PT9876543210',
          doctorId: 'DR9876543210',
          doctorName: 'Johnson',
          testType: 'MRI Scan',
          urgency: 'high',
          status: 'pending',
          createdAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'testRequests'), {
          labId: user.uid,
          patientId: 'PT5555555555',
          doctorId: 'DR5555555555',
          doctorName: 'Williams',
          testType: 'CT Scan',
          urgency: 'normal',
          status: 'pending',
          createdAt: serverTimestamp()
        });
      }
      
      if (schedulesSnapshot.empty) {
        await addDoc(collection(db, 'schedules'), {
          labId: user.uid,
          date: new Date().toISOString().split('T')[0],
          slots: [
            { time: '09:00', available: false },
            { time: '10:00', available: false },
            { time: '11:00', available: true },
            { time: '12:00', available: true }
          ],
          createdAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'schedules'), {
          labId: user.uid,
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          slots: [
            { time: '09:00', available: true },
            { time: '10:00', available: true },
            { time: '11:00', available: false },
            { time: '12:00', available: false }
          ],
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error initializing collections:', error);
    }
  };

  // Function to handle uploading test results
  const handleUploadTestResults = async (patientUID) => {
    try {
      setSelectedPatientUID(patientUID);
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });
      
      if (result.canceled === false || result.type === 'success') {
        setUploading(true);
        
        // Get file URI and name
        const fileUri = result.uri || result.assets[0].uri;
        const fileName = result.name || result.assets[0].name;
        
        // Upload file to Firebase Storage
        await uploadFile(patientUID, fileUri, fileName, 'Test Result');
        
        // Update test request status
        const testRequestsQuery = query(
          collection(db, 'testRequests'),
          where('patientId', '==', patientUID),
          where('labId', '==', user.uid),
          where('status', '==', 'pending')
        );
        const testRequestsSnapshot = await getDocs(testRequestsQuery);
        
        if (!testRequestsSnapshot.empty) {
          const testRequestDoc = testRequestsSnapshot.docs[0];
          await updateDoc(doc(db, 'testRequests', testRequestDoc.id), {
            status: 'completed',
            resultUploadedAt: serverTimestamp()
          });
        }
        
        // Add to test results collection
        await addDoc(collection(db, 'testResults'), {
          patientId: patientUID,
          labId: user.uid,
          fileName,
          fileType: fileName.split('.').pop().toLowerCase(),
          uploadedAt: serverTimestamp()
        });
        
        Alert.alert('Success', 'Test result uploaded successfully');
        
        // Refresh data
        fetchLabOwnerData();
      }
    } catch (error) {
      console.error('Error uploading test result:', error);
      Alert.alert('Error', 'Failed to upload test result. Please try again.');
    } finally {
      setUploading(false);
      setSelectedPatientUID('');
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    if (user?.uid) {
      fetchLabOwnerData();
    }
  }, [user]);

  // Loading indicator
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4E73DF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Render lab owner dashboard
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, <Text style={styles.highlightText}> Lab Owner {user.name}</Text></Text>
       
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <MaterialIcons name="date-range" size={24} color="#4E73DF" />
          <Text style={styles.statTitle}>Lab Appointments</Text>
          {appointments.length > 0 ? (
            <Text style={styles.statValue}>Today: {appointments.filter(a => 
              new Date(a.dateTime).toDateString() === new Date().toDateString()).length} tests</Text>
          ) : (
            <Text style={styles.emptyStateText}>No appointments</Text>
          )}
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="description" size={24} color="#4E73DF" />
          <Text style={styles.statTitle}>Test Requests</Text>
          {testRequests.length > 0 ? (
            <Text style={styles.statValue}>{testRequests.length} pending tests</Text>
          ) : (
            <Text style={styles.emptyStateText}>No pending requests</Text>
          )}
        </View>
        
        <View style={styles.statCard}>
          <MaterialIcons name="event-available" size={24} color="#4E73DF" />
          <Text style={styles.statTitle}>New Schedules</Text>
          {schedules.length > 0 ? (
            <Text style={styles.statValue}>{schedules.reduce((count, schedule) => 
              count + schedule.slots.filter(slot => slot.available).length, 0)} slots to fill</Text>
          ) : (
            <Text style={styles.emptyStateText}>No available slots</Text>
          )}
        </View>
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ViewAppointments', { user })}
        >
          <MaterialIcons name="list-alt" size={20} color="#4E73DF" />
          <Text style={styles.actionButtonText}>View Appointments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('UploadTestResult', { user })}
        >
          <MaterialIcons name="file-download" size={20} color="#4E73DF" />
          <Text style={styles.actionButtonText}>Upload Test Results</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('PatientRecords', { user })}
        >
          <MaterialIcons name="people" size={20} color="#4E73DF" />
          <Text style={styles.actionButtonText}>Patient Records</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('ScheduleNewTest', { user })}
        >
          <MaterialIcons name="event-available" size={20} color="#4E73DF" />
          <Text style={styles.actionButtonText}>Schedule Test</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.nextTestContainer}>
        <Text style={styles.sectionTitle}>Next Test</Text>
        {nextTest ? (
          <View style={styles.nextTestCard}>
            <View style={styles.nextTestInfo}>
              <View style={styles.nextTestRow}>
                <Text style={styles.nextTestLabel}>Patient: </Text>
                <Text style={styles.nextTestValue}>{nextTest.patientName}</Text>
                <View style={styles.nextTestSpacer} />
                <Text style={styles.nextTestLabel}>Time: </Text>
                <Text style={styles.nextTestValue}>{new Date(nextTest.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
              </View>
            </View>
            <View style={styles.nextTestActions}>
              <TouchableOpacity 
                style={styles.nextTestButton}
                onPress={() => handleUploadTestResults(nextTest.patientId)}
              >
                <Text style={styles.nextTestButtonText}>Mark as Complete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.nextTestButton}>
                <Text style={styles.nextTestButtonText}>Patient Info</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <MaterialIcons name="event-busy" size={24} color="#A0AEC0" />
            <Text style={styles.emptyStateMessage}>No upcoming tests scheduled</Text>
          </View>
        )}
      </View>
      
      <View style={styles.recentActivityContainer}>
        <Text style={styles.sectionTitle}> Today's Activity</Text>
        {recentActivity.length > 0 ? (
          recentActivity.map((activity, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.activityItem}
              onPress={() => navigation.navigate('History', { activityType: activity.type })}
            >
              <Text style={styles.activityBullet}>•</Text>
              <Text style={styles.activityText}>{activity.text}</Text>
              <MaterialIcons name="chevron-right" size={16} color="#A0AEC0" style={styles.activityArrow} />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateCard}>
            <MaterialIcons name="history" size={24} color="#A0AEC0" />
            <Text style={styles.emptyStateMessage}>No recent activity</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  highlightText: {
    color: '#4E73DF',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionText: {
    marginTop: 10,
    fontSize: 14,
    color: '#4A5568',
    textAlign: 'center',
  },
  viewAllButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  viewAllText: {
    color: '#4E73DF',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4E73DF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  nextTestContainer: {
    marginVertical: 15,
  },
  nextTestCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 10,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4E73DF',
  },
  nextTestInfo: {
    marginBottom: 10,
  },
  nextTestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  nextTestLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
  },
  nextTestValue: {
    fontSize: 14,
    color: '#2D3748',
  },
  nextTestSpacer: {
    width: 20,
  },
  nextTestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextTestButton: {
    backgroundColor: '#4E73DF',
    borderRadius: 6,
    padding: 10,
    flex: 0.48,
    alignItems: 'center',
  },
  nextTestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  recentActivityContainer: {
    marginVertical: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityBullet: {
    fontSize: 20,
    color: '#4E73DF',
    marginRight: 5,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  activityArrow: {
    marginLeft: 'auto',
  },
  emptyStateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F9FAFC',
    borderRadius: 8,
  },
  emptyStateMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#A0AEC0',
    textAlign: 'center',
  },
});
