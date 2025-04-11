import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Animated,
  Dimensions,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const THEME = {
  primary: '#4E73DF',
  secondary: '#1CC88A',
  warning: '#F6C23E',
  danger: '#E74A3B',
  info: '#36B9CC',
  background: '#F8F9FC',
  card: '#FFFFFF',
  text: '#2D3748',
  textSecondary: '#718096',
  border: '#E3E6F0',
  gradients: {
    primary: ['#4E73DF', '#3A5FD1'],
    success: ['#1CC88A', '#16A673'],
    warning: ['#F6C23E', '#E5B02D'],
    danger: ['#E74A3B', '#D32F2F'],
    info: ['#36B9CC', '#2A91A3']
  }
};

export default function HomeScreenDoctor({ navigation, user }) {
  // State variables
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [testRequests, setTestRequests] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);

  // Function to fetch doctor data
  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      
      // Check if user.uid is valid
      if (!user?.uid) {
        throw new Error('User ID is missing or invalid');
      }
      
      // Fetch patients assigned to this doctor
      const patientsQuery = query(
        collection(db, 'users'),
        where('doctorId', '==', user.uid),
        where('role', '==', 'patient')
      );
      const patientsSnapshot = await getDocs(patientsQuery);
      const patientsData = patientsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPatients(patientsData);
      
      // Fetch test requests made by this doctor
      const testRequestsQuery = query(
        collection(db, 'testRequests'),
        where('doctorId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const testRequestsSnapshot = await getDocs(testRequestsQuery);
      const testRequestsData = testRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTestRequests(testRequestsData);
      
      // Fetch recent test results for patients of this doctor
      const testResultsQuery = query(
        collection(db, 'testResults'),
        where('doctorId', '==', user.uid),
        orderBy('uploadedAt', 'desc'),
        limit(5)
      );
      const testResultsSnapshot = await getDocs(testResultsQuery);
      const testResultsData = testResultsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch patient names for test results
      const resultsWithPatientNames = await Promise.all(
        testResultsData.map(async (result) => {
          try {
            const patientDoc = await getDoc(doc(db, 'users', result.patientId));
            return {
              ...result,
              patientName: patientDoc.exists() ? patientDoc.data().name : 'Unknown Patient'
            };
          } catch (error) {
            console.error('Error fetching patient details:', error);
            return {
              ...result,
              patientName: 'Unknown Patient'
            };
          }
        })
      );
      
      setRecentResults(resultsWithPatientNames);
      
      // Initialize with sample data if needed
      if (patientsData.length === 0) {
        // Add sample patients
        await addDoc(collection(db, 'users'), {
          name: 'John Doe',
          role: 'patient',
          doctorId: user.uid,
          email: 'john.doe@example.com',
          createdAt: serverTimestamp()
        });
        
        await addDoc(collection(db, 'users'), {
          name: 'Jane Smith',
          role: 'patient',
          doctorId: user.uid,
          email: 'jane.smith@example.com',
          createdAt: serverTimestamp()
        });
      }
      
      // Fetch doctor's notes
      const notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const notesSnapshot = await getDocs(notesQuery);
      const notesData = notesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? new Date(doc.data().createdAt.toDate()) : new Date()
      }));
      setNotes(notesData);
      
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      Alert.alert(
        'Error', 
        `Failed to load data: ${error.message}. Please try again.`,
        [{ text: 'OK', onPress: () => setLoading(false) }]
      );
      // Set default empty values
      setPatients([]);
      setTestRequests([]);
      setRecentResults([]);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to add a new note
  const handleAddNote = async () => {
    try {
      if (noteText.trim() === '') {
        Alert.alert('Error', 'Note cannot be empty');
        return;
      }

      const newNote = {
        text: noteText,
        createdAt: new Date(),
        userId: user.uid
      };

      // Add to notes collection in Firebase
      const docRef = await addDoc(collection(db, 'notes'), {
        ...newNote,
        createdAt: serverTimestamp()
      });

      // Update local state
      setNotes([{
        id: docRef.id,
        ...newNote
      }, ...notes]);
      
      // Clear input and close modal
      setNoteText('');
      setNoteModalVisible(false);
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };

  // Note input modal
  const renderNoteModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={noteModalVisible}
      onRequestClose={() => setNoteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add a Note</Text>
          
          <TextInput
            style={styles.noteInput}
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Enter your note here..."
            multiline={true}
            numberOfLines={4}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setNoteModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleAddNote}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Fetch data when component mounts
  useEffect(() => {
    if (user?.uid) {
      fetchDoctorData();
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Doctor Dashboard</Text>
          <Text style={styles.subtitle}>Welcome back, Dr. {user?.name || 'Doctor'}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('PatientRecords')}
            >
              <MaterialIcons name="people" size={32} color="#4E73DF" />
              <Text style={styles.actionText}>Patient Records</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ScheduleNewTest')}
            >
              <MaterialIcons name="assignment" size={32} color="#4E73DF" />
              <Text style={styles.actionText}>Order Tests</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Test Results */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Test Results</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('History', { activityType: 'result' })}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
          {/* Recent test results would be rendered here */}
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
  scrollContent: {
    padding: 16
  },
  header: {
    marginBottom: 24
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginBottom: 24
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginBottom: 24
  },
  statCard: {
    width: (width - 48) / 2,
    margin: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  statLabel: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginBottom: 8
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 16,
    marginTop: 24
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
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  patientInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold'
  },
  patientInfo: {
    flex: 1
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    marginBottom: 4
  },
  patientEmail: {
    fontSize: 14,
    color: THEME.textSecondary
  },
  testRequestItem: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.text,
    flex: 1
  },
  requestDate: {
    fontSize: 14,
    color: THEME.textSecondary
  },
  requestStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  addNoteButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: THEME.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 20
  },
  noteInput: {
    backgroundColor: THEME.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: THEME.text,
    minHeight: 120,
    textAlignVertical: 'top'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginLeft: 12
  },
  cancelButton: {
    backgroundColor: THEME.background
  },
  saveButton: {
    backgroundColor: THEME.primary
  },
  cancelButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '600'
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
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
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
    marginBottom: 15,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  noteInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#E2E8F0',
  },
  cancelButtonText: {
    color: '#4A5568',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#4E73DF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
