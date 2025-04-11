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
  Platform,
  Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

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

export default function HomeScreenPatient({ navigation, user }) {
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [testResults, setTestResults] = useState([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [healthSummary, setHealthSummary] = useState({});
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [noteModalVisible, setNoteModalVisible] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Modal animation values - moved to top level
  const modalSlideAnim = useRef(new Animated.Value(300)).current;
  
  // Animation for add note button
  const pulseAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ])
  );
  
  // Spinning animation for loading indicator
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  const spinAnimation = Animated.loop(
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1500,
      easing: Easing.linear,
      useNativeDriver: true
    })
  );

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      if (!user?.uid) {
        throw new Error('User ID is missing or invalid');
      }
      
      // Simulating data fetch delay
      setTimeout(() => {
        setAppointments([]);
        setUpcomingAppointment({
          id: '123',
          testType: 'Blood Test',
          dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          labName: 'HealthFirst Lab'
        });
        
        setTestResults([]);
        
        setHealthSummary({
          lastCheckup: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
          bloodPressure: '120/80',
          heartRate: '72 bpm',
          weight: '70 kg'
        });
        
        setNotes([]);
        
        // Start animations when data is loaded
        startAnimations();
        setLoading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert(
        'Error', 
        `Failed to load data: ${error.message}. Please try again.`,
        [{ text: 'OK' }]
      );
      setLoading(false);
    }
  };

  const startAnimations = () => {
    // Start all animations together
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start the pulsing animation for add note button
    pulseAnimation.start();
  };

  // Function to add a new note
  const handleAddNote = async () => {
    try {
      if (noteText.trim() === '') {
        Alert.alert('Error', 'Note cannot be empty');
        return;
      }

      const newNote = {
        id: Date.now().toString(),
        text: noteText,
        createdAt: new Date(),
        userId: user?.uid || 'user123'
      };

      // Update local state with animation
      setNotes([newNote, ...notes]);
      
      // Clear input and close modal
      setNoteText('');
      setNoteModalVisible(false);
      
      // Show success animation (could be a toast)
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      Alert.alert('Error', 'Failed to add note. Please try again.');
    }
  };

  // Handle modal animations
  useEffect(() => {
    if (noteModalVisible) {
      Animated.spring(modalSlideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset the animation when modal is hidden
      modalSlideAnim.setValue(300);
    }
  }, [noteModalVisible]);

  // Fetch data when component mounts
  useEffect(() => {
    fetchPatientData();
    spinAnimation.start();
    
    // Clean up animations
    return () => {
      spinAnimation.stop();
      pulseAnimation.stop();
    };
  }, []);

  // Loading indicator with animation
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialIcons name="refresh" size={40} color="#4E73DF" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Note input modal with animations */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={noteModalVisible}
        onRequestClose={() => setNoteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            <Text style={styles.modalTitle}>Add a Note</Text>
            
            <TextInput
              style={styles.noteInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Enter your note here..."
              multiline={true}
              numberOfLines={4}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setNoteModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddNote}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header with animation */}
        <Animated.View 
          style={[
            styles.header,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: translateY }]
            }
          ]}
        >
          <Text style={styles.welcomeText}>My Health Portal</Text>
          <Text style={styles.subtitle}>Welcome back, {user?.name || 'Patient'}</Text>
        </Animated.View>

        {/* Quick Actions with staggered animation */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 1.2) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('ViewAppointments')}
              activeOpacity={0.8}
            >
              <MaterialIcons name="event" size={32} color="#4E73DF" />
              <Text style={styles.actionText}>My Appointments</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => navigation.navigate('History', { activityType: 'result' })}
              activeOpacity={0.8}
            >
              <MaterialIcons name="assignment" size={32} color="#4E73DF" />
              <Text style={styles.actionText}>Test Results</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Health Summary with fade-in */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 1.4) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Health Summary</Text>
          {Object.keys(healthSummary).length > 0 ? (
            <View style={styles.healthSummaryContainer}>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Last Checkup:</Text>
                <Text style={styles.healthValue}>{healthSummary.lastCheckup}</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Blood Pressure:</Text>
                <Text style={styles.healthValue}>{healthSummary.bloodPressure}</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Heart Rate:</Text>
                <Text style={styles.healthValue}>{healthSummary.heartRate}</Text>
              </View>
              <View style={styles.healthItem}>
                <Text style={styles.healthLabel}>Weight:</Text>
                <Text style={styles.healthValue}>{healthSummary.weight}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <MaterialIcons name="healing" size={24} color="#A0AEC0" />
              <Text style={styles.emptyStateMessage}>No health data available</Text>
            </View>
          )}
        </Animated.View>

        {/* Upcoming Appointments with animation */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 1.6) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('ViewAppointments')}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
          
          {upcomingAppointment ? (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <MaterialIcons name="event" size={20} color="#4E73DF" />
                <Text style={styles.appointmentType}>{upcomingAppointment.testType}</Text>
              </View>
              <View style={styles.appointmentDetails}>
                <Text style={styles.appointmentInfo}>
                  <Text style={styles.appointmentLabel}>Date: </Text>
                  {new Date(upcomingAppointment.dateTime).toLocaleDateString()}
                </Text>
                <Text style={styles.appointmentInfo}>
                  <Text style={styles.appointmentLabel}>Time: </Text>
                  {new Date(upcomingAppointment.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
                <Text style={styles.appointmentInfo}>
                  <Text style={styles.appointmentLabel}>Lab: </Text>
                  {upcomingAppointment.labName}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.emptyStateCard}>
              <MaterialIcons name="event-busy" size={24} color="#A0AEC0" />
              <Text style={styles.emptyStateMessage}>No upcoming appointments</Text>
            </View>
          )}
        </Animated.View>
        
        {/* Notes Section with animation */}
        <Animated.View 
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: Animated.multiply(translateY, 1.8) },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.notesHeader}>
            <Text style={styles.sectionTitle}>My Notes</Text>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={styles.addNoteButton}
                onPress={() => setNoteModalVisible(true)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="add" size={16} color="#fff" />
                <Text style={styles.addNoteButtonText}>Add Note</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {notes.length > 0 ? (
            notes.map((note, index) => (
              <Animated.View 
                key={note.id} 
                style={[
                  styles.noteItem,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateX: translateY }]
                  }
                ]}
              >
                <Text style={styles.noteText}>{note.text}</Text>
                <Text style={styles.noteDate}>
                  {note.createdAt.toLocaleDateString()} {note.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </Text>
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyStateCard}>
              <MaterialIcons name="note" size={24} color="#A0AEC0" />
              <Text style={styles.emptyStateMessage}>No notes yet. Add your first note!</Text>
            </View>
          )}
        </Animated.View>
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
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginTop: 5,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
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
    padding: 5,
  },
  viewAllText: {
    color: '#4E73DF',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4E73DF',
  },
  healthSummaryContainer: {
    backgroundColor: '#F9FAFC',
    borderRadius: 8,
    padding: 12,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  healthLabel: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '500',
  },
  healthValue: {
    fontSize: 14,
    color: '#2D3748',
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4E73DF',
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  appointmentType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginLeft: 8,
  },
  appointmentDetails: {
    marginLeft: 28,
  },
  appointmentInfo: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  appointmentLabel: {
    fontWeight: '500',
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
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addNoteButton: {
    flexDirection: 'row',
    backgroundColor: '#4E73DF',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  addNoteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  noteItem: {
    backgroundColor: '#F9FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#4E73DF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'right',
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
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
    paddingVertical: 10,
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