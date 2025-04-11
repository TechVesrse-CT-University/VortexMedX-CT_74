import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function PatientRecordsScreen({ user, navigation }) {
  const [patientRecords, setPatientRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecords, setFilteredRecords] = useState([]);

  useEffect(() => {
    fetchPatientRecords();
  }, []);

  useEffect(() => {
    if (patientRecords.length > 0) {
      setFilteredRecords(
        patientRecords.filter(record => 
          record.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          record.patientId?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, patientRecords]);

  const fetchPatientRecords = async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch patient records for lab owner
      const recordsQuery = query(
        collection(db, 'patientRecords'),
        where('labId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const recordsSnapshot = await getDocs(recordsQuery);
      const recordsData = recordsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // If no records found, check test results for patient data
      if (recordsData.length === 0) {
        const resultsQuery = query(
          collection(db, 'testResults'),
          where('labId', '==', user.uid)
        );
        
        const resultsSnapshot = await getDocs(resultsQuery);
        const patientsMap = new Map();
        
        resultsSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.patientId && !patientsMap.has(data.patientId)) {
            patientsMap.set(data.patientId, {
              id: doc.id,
              patientId: data.patientId,
              patientName: data.patientName || 'Unknown Patient',
              lastTestDate: data.date || data.uploadedAt,
              testCount: 1
            });
          } else if (data.patientId) {
            const patient = patientsMap.get(data.patientId);
            patient.testCount += 1;
            // Update last test date if newer
            if (data.date && patient.lastTestDate && 
                data.date.toDate() > patient.lastTestDate.toDate()) {
              patient.lastTestDate = data.date;
            }
          }
        });
        
        const patientsArray = Array.from(patientsMap.values());
        setPatientRecords(patientsArray);
        setFilteredRecords(patientsArray);
      } else {
        setPatientRecords(recordsData);
        setFilteredRecords(recordsData);
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      Alert.alert('Error', 'Failed to load patient records. Please try again.');
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
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleViewPatientDetails = (patientId) => {
    // Navigate to patient details screen with the patient ID
    navigation.navigate('Details', { userId: patientId });
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
        <Text style={styles.screenTitle}>Patient Records</Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name or ID"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <MaterialIcons name="clear" size={20} color="#A0AEC0" />
          </TouchableOpacity>
        )}
      </View>

      {/* Patient records list */}
      {loading ? (
        <ActivityIndicator size="large" color="#4E73DF" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={64} color="#E2E8F0" />
              <Text style={styles.emptyStateText}>No patient records found</Text>
              <Text style={styles.emptyStateSubText}>Patient records will appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.patientCard}
              onPress={() => handleViewPatientDetails(item.patientId)}
            >
              <View style={styles.patientHeader}>
                <View style={styles.patientIcon}>
                  <MaterialIcons name="person" size={24} color="#4E73DF" />
                </View>
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{item.patientName || 'Unknown Patient'}</Text>
                  <Text style={styles.patientId}>ID: {item.patientId || 'Unknown'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#A0AEC0" />
              </View>
              
              {item.lastTestDate && (
                <View style={styles.patientDetail}>
                  <Text style={styles.detailLabel}>Last Test:</Text>
                  <Text style={styles.detailValue}>{formatDate(item.lastTestDate)}</Text>
                </View>
              )}
              
              {item.testCount && (
                <View style={styles.patientDetail}>
                  <Text style={styles.detailLabel}>Tests:</Text>
                  <Text style={styles.detailValue}>{item.testCount}</Text>
                </View>
              )}
              
              {item.contactNumber && (
                <View style={styles.patientDetail}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{item.contactNumber}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  loader: {
    marginTop: 50,
  },
  patientCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  patientIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patientId: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  patientDetail: {
    flexDirection: 'row',
    marginTop: 8,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#A0AEC0',
    marginTop: 16,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: '#A0AEC0',
    marginTop: 8,
    textAlign: 'center',
  },
});