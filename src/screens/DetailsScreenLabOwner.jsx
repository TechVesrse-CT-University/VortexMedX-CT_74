import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function DetailsScreenLabOwner({ route, navigation }) {
  const { userId } = route.params || {};
  const [patientData, setPatientData] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch basic patient info
        const patientDoc = await getDoc(doc(db, 'users', userId));
        if (!patientDoc.exists()) {
          throw new Error('Patient not found');
        }
        setPatientData({
          id: patientDoc.id,
          ...patientDoc.data()
        });

        // Fetch test results specific to this lab
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
        <Text style={styles.title}>Patient Details</Text>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      <ScrollView style={styles.content}>
        {/* Patient Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="person" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Patient Information</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{patientData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>ID:</Text>
            <Text style={styles.infoValue}>{patientData.patientId || userId}</Text>
          </View>
        </View>

        {/* Test Results Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons name="assignment" size={24} color="#4E73DF" />
            <Text style={styles.cardTitle}>Test Results</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => navigation.navigate('UploadTestResult', { patientId: userId })}
            >
              <MaterialIcons name="add" size={24} color="#4E73DF" />
            </TouchableOpacity>
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
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No test results found</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ScheduleNewTest', { patientId: userId })}
          >
            <MaterialIcons name="event" size={24} color="#4E73DF" />
            <Text style={styles.actionText}>Schedule Test</Text>
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
  addButton: {
    marginLeft: 'auto',
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
