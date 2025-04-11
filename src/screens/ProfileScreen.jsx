import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../supabase';

export default function ProfileScreen({ user, setUser, navigation }) {
  // Mock user data if not provided
  const mockUser = {
    uid: 'PT12345678',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'patient',
    sex: 'Male',
    age: '32',
    phone: '(555) 123-4567',
    address: '123 Main St, Anytown, USA'
  };

  // Use provided user or mock data
  const currentUser = user || mockUser;

  // State with mock data
  const [medicalHistory, setMedicalHistory] = useState([
    {
      id: '1',
      date: new Date('2023-05-15'),
      title: 'Annual Checkup',
      description: 'Routine physical examination. All vitals normal. Recommended to maintain current diet and exercise routine.',
      doctor: 'Dr. Sarah Johnson'
    },
    {
      id: '2',
      date: new Date('2023-02-28'),
      title: 'Flu Vaccination',
      description: 'Received seasonal flu vaccine. No adverse reactions reported.',
      doctor: 'Nurse Practitioner Mark Williams'
    },
    {
      id: '3',
      date: new Date('2022-11-10'),
      title: 'Blood Work Results',
      description: 'Complete blood count shows normal ranges. Cholesterol slightly elevated - recommended reduced saturated fat intake.',
      doctor: 'Dr. Sarah Johnson'
    }
  ]);

  const [labData, setLabData] = useState({
    appointments: [
      { id: '1', patient: 'Emma Wilson', date: '2023-06-15', time: '10:00 AM', test: 'Blood Panel' },
      { id: '2', patient: 'Michael Brown', date: '2023-06-16', time: '2:30 PM', test: 'Urinalysis' }
    ],
    testResults: [
      { id: '1', patient: 'David Lee', test: 'Lipid Panel', status: 'Completed', date: '2023-06-10' },
      { id: '2', patient: 'Sophia Chen', test: 'CBC', status: 'Pending Review', date: '2023-06-12' }
    ]
  });

  const [labInfo, setLabInfo] = useState({
    name: 'Advanced Diagnostic Labs',
    registrationNumber: 'LAB-2023-7890',
    address: '456 Healthcare Ave, Medical District, NY 10001',
    hours: 'Mon-Fri: 8:00 AM - 6:00 PM\nSat: 9:00 AM - 2:00 PM',
    contact: '(555) 987-6543'
  });

  const [loading, setLoading] = useState(false);

  const getRoleName = () => {
    switch(currentUser.role) {
      case 'doctor': return 'Medical Doctor';
      case 'labOwner': return 'Laboratory Director';
      default: return 'Patient';
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      navigation.navigate('Login');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
  const handleAddNote = () => {
    navigation.navigate('AddMedicalNote');
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Render patient profile view
  if (currentUser.role === 'patient') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#2D3748" />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>My Health Profile</Text>
        </View>
        
        {/* Patient info card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatar}>
              <MaterialIcons name="person" size={48} color="#4E73DF" />
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentUser.name}</Text>
              <Text style={styles.profileRole}>Patient</Text>
              
              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="person-outline" size={16} color="#718096" />
                  <Text style={styles.metaText}>{currentUser.sex}, {currentUser.age} yrs</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="phone" size={16} color="#718096" />
                  <Text style={styles.metaText}>{currentUser.phone}</Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="location-on" size={16} color="#718096" />
                  <Text style={styles.metaText}>{currentUser.address}</Text>
                </View>
              </View>
            </View>
          </View>
          
          <View style={styles.profileActions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction]}
              onPress={handleAddNote}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Add Medical Note</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => navigation.navigate('EditProfile')}
            >
              <MaterialIcons name="edit" size={20} color="#4E73DF" />
              <Text style={[styles.actionButtonText, styles.secondaryActionText]}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Medical History Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {medicalHistory.length > 0 ? (
            medicalHistory.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyDateBadge}>
                  <Text style={styles.historyDateText}>{formatDate(item.date)}</Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyTitle}>{item.title}</Text>
                  <Text style={styles.historyDescription}>{item.description}</Text>
                  <View style={styles.historyFooter}>
                    <MaterialIcons name="medical-services" size={16} color="#4E73DF" />
                    <Text style={styles.historyDoctor}>{item.doctor}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="info-outline" size={48} color="#CBD5E0" />
              <Text style={styles.emptyStateText}>No medical history available</Text>
            </View>
          )}
        </View>
        
        {/* Upcoming Appointments */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
            <TouchableOpacity>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.appointmentCard}>
            <View style={styles.appointmentDateTime}>
              <Text style={styles.appointmentDay}>Wed</Text>
              <Text style={styles.appointmentDate}>14</Text>
              <Text style={styles.appointmentMonth}>Jun</Text>
            </View>
            <View style={styles.appointmentDetails}>
              <Text style={styles.appointmentTitle}>Annual Physical Exam</Text>
              <Text style={styles.appointmentTime}>10:30 AM - 11:15 AM</Text>
              <Text style={styles.appointmentLocation}>City Medical Center</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  
  // Render lab owner profile view
  if (currentUser.role === 'labOwner') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.profileHeaderLab}>
          <View style={styles.labAvatar}>
            <MaterialIcons name="science" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.labName}>{labInfo.name}</Text>
          <Text style={styles.labRole}>Laboratory Director</Text>
        </View>

        {/* Lab Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Laboratory Information</Text>
          
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <MaterialIcons name="business" size={20} color="#4E73DF" />
              <Text style={styles.infoLabel}>Registration Number:</Text>
              <Text style={styles.infoValue}>{labInfo.registrationNumber}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="location-on" size={20} color="#4E73DF" />
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{labInfo.address}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={20} color="#4E73DF" />
              <Text style={styles.infoLabel}>Hours:</Text>
              <Text style={styles.infoValue}>{labInfo.hours}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={20} color="#4E73DF" />
              <Text style={styles.infoLabel}>Contact:</Text>
              <Text style={styles.infoValue}>{labInfo.contact}</Text>
            </View>
          </View>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{labData.appointments.length}</Text>
            <Text style={styles.statLabel}>Today's Appointments</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{labData.testResults.filter(t => t.status === 'Pending Review').length}</Text>
            <Text style={styles.statLabel}>Results Pending</Text>
          </View>
        </View>
        
        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {labData.testResults.slice(0, 3).map((test) => (
            <View key={test.id} style={styles.activityCard}>
              <View style={[
                styles.activityIcon, 
                test.status === 'Completed' ? styles.activityIconSuccess : styles.activityIconWarning
              ]}>
                <MaterialIcons 
                  name={test.status === 'Completed' ? 'check' : 'hourglass-empty'} 
                  size={18} 
                  color="#FFFFFF" 
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{test.test} for {test.patient}</Text>
                <Text style={styles.activityStatus}>{test.status}</Text>
                <Text style={styles.activityDate}>{test.date}</Text>
              </View>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }
  
  // Render default profile view for doctors
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.profileHeader}>
        <View style={styles.doctorAvatar}>
          <MaterialIcons name="medical-services" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{currentUser.name}</Text>
        <Text style={styles.role}>Medical Doctor</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Information</Text>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="alternate-email" size={20} color="#4E73DF" />
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{currentUser.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#4E73DF" />
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>{currentUser.phone || '(555) 123-4567'}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="business" size={20} color="#4E73DF" />
            <Text style={styles.infoLabel}>Specialty:</Text>
            <Text style={styles.infoValue}>Cardiology</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#4E73DF" />
            <Text style={styles.infoLabel}>Hospital:</Text>
            <Text style={styles.infoValue}>City Medical Center</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleTime}>
            <Text style={styles.scheduleHour}>9:00</Text>
            <Text style={styles.schedulePeriod}>AM</Text>
          </View>
          <View style={styles.scheduleDetails}>
            <Text style={styles.scheduleTitle}>Patient Consultation</Text>
            <Text style={styles.schedulePatient}>Robert Johnson</Text>
          </View>
        </View>
        
        <View style={styles.scheduleCard}>
          <View style={styles.scheduleTime}>
            <Text style={styles.scheduleHour}>11:30</Text>
            <Text style={styles.schedulePeriod}>AM</Text>
          </View>
          <View style={styles.scheduleDetails}>
            <Text style={styles.scheduleTitle}>Follow-up Visit</Text>
            <Text style={styles.schedulePatient}>Maria Garcia</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  // Patient Profile Styles
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 16,
    color: '#4E73DF',
    fontWeight: '600',
    marginBottom: 12,
  },
  profileMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#718096',
  },
  profileActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  primaryAction: {
    backgroundColor: '#4E73DF',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionText: {
    color: '#4E73DF',
  },
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  sectionAction: {
    fontSize: 14,
    color: '#4E73DF',
    fontWeight: '600',
  },
  // History Card Styles
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  historyDateBadge: {
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    minWidth: 80,
  },
  historyDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E73DF',
    textAlign: 'center',
  },
  historyContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  historyDescription: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 8,
    lineHeight: 20,
  },
  historyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDoctor: {
    fontSize: 13,
    color: '#4E73DF',
    fontWeight: '500',
  },
  // Empty State
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#A0AEC0',
    marginTop: 12,
    textAlign: 'center',
  },
  // Appointment Card
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentDateTime: {
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  appointmentDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E73DF',
    textTransform: 'uppercase',
  },
  appointmentDate: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
  },
  appointmentMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4E73DF',
    textTransform: 'uppercase',
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#4E73DF',
    marginBottom: 4,
  },
  appointmentLocation: {
    fontSize: 14,
    color: '#718096',
  },
  // Lab Owner Styles
  profileHeaderLab: {
    alignItems: 'center',
    marginBottom: 32,
  },
  labAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4E73DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  labName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
    textAlign: 'center',
  },
  labRole: {
    fontSize: 16,
    color: '#4E73DF',
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    minWidth: 120,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#4A5568',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4E73DF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityIconSuccess: {
    backgroundColor: '#48BB78',
  },
  activityIconWarning: {
    backgroundColor: '#ED8936',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 2,
  },
  activityStatus: {
    fontSize: 14,
    color: '#718096',
    marginBottom: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  // Doctor Profile Styles
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  doctorAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4E73DF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#4E73DF',
    fontWeight: '600',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
  },
  scheduleTime: {
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  scheduleHour: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
  },
  schedulePeriod: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4E73DF',
  },
  scheduleDetails: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 4,
  },
  schedulePatient: {
    fontSize: 14,
    color: '#718096',
  },
  // Logout Button
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E53E3E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: {
    color: '#E53E3E',
    fontSize: 16,
    fontWeight: '600',
  },
});