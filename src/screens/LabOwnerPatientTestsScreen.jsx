import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function LabOwnerPatientTestsScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientTests = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser?.uid) return;

        // Query test requests for this lab
        const testsQuery = query(
          collection(db, 'testRequests'),
          where('labId', '==', currentUser.uid),
          where('status', 'in', ['pending', 'completed'])
        );
        
        const querySnapshot = await getDocs(testsQuery);
        const testData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Group tests by patient
        const patientsMap = new Map();
        testData.forEach(test => {
          if (!patientsMap.has(test.patientId)) {
            patientsMap.set(test.patientId, {
              id: test.patientId,
              name: test.patientName || 'Unknown Patient',
              tests: []
            });
          }
          patientsMap.get(test.patientId).tests.push({
            testId: test.id,
            testName: test.testType || 'Unknown Test',
            status: test.status,
            date: test.requestedDate?.toDate() || new Date()
          });
        });

        setPatients(Array.from(patientsMap.values()));
      } catch (error) {
        console.error('Error fetching patient tests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientTests();
  }, []);

  const renderPatientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.patientItem}
      onPress={() => navigation.navigate('LabPatientDetails', { 
        patientId: item.id,
        patientName: item.name,
        tests: item.tests 
      })}
    >
      <View style={styles.patientInfo}>
        <Text style={styles.patientName}>{item.name}</Text>
        <View style={styles.testsContainer}>
          {item.tests.map((test, index) => (
            <View key={index} style={styles.testItem}>
              <Text style={styles.testName}>{test.testName}</Text>
              <Text style={[
                styles.testStatus,
                test.status === 'completed' ? styles.completed : styles.pending
              ]}>
                {test.status}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#A0AEC0" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Patient Tests</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4E73DF" />
        </View>
      ) : (
        <FlatList
          data={patients}
          renderItem={renderPatientItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No patient tests found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#333',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  testsContainer: {
    marginLeft: 8,
  },
  testItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 14,
    color: '#666',
    width: '60%',
  },
  testStatus: {
    fontSize: 14,
    fontWeight: '500',
    width: '40%',
  },
  pending: {
    color: '#E53E3E',
  },
  completed: {
    color: '#38A169',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#A0AEC0',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
