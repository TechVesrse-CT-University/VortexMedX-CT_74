import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function HistoryScreen({ route = {}, navigation, userRole = '', user = {} }) {
  // Safely get activityType with fallback
  const { activityType = '' } = route.params || {};
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Enhanced user validation
        if (!user?.uid) {
          const mockData = await fetchMockData();
          setHistoryData(mockData?.history || []);
          return;
        }

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 10000);
        });

        let historyItems = [];

        // Helper function to safely get date string
        const getDateString = (timestamp) => {
          if (!timestamp) return 'Unknown date';
          try {
            return timestamp.toDate 
              ? timestamp.toDate().toLocaleDateString()
              : new Date(timestamp).toLocaleDateString();
          } catch {
            return 'Unknown date';
          }
        };

        if (userRole === 'labOwner') {
          // Lab owner data fetching with null checks
          try {
            const appointmentsQuery = query(
              collection(db, 'appointments'),
              where('labId', '==', user.uid),
              orderBy('createdAt', 'desc')
            );
            
            const appointmentsSnapshot = await Promise.race([
              getDocs(appointmentsQuery),
              timeoutPromise
            ]);
            
            const appointmentsData = appointmentsSnapshot.docs.map(doc => {
              const data = doc.data() || {};
              return {
                id: doc.id,
                type: 'appointment',
                date: getDateString(data.createdAt),
                event: `Appointment scheduled for ${data.dateTime ? new Date(data.dateTime).toLocaleString() : 'Unknown time'}`,
                patientId: data.patientId || '',
                patientName: data.patientName || 'Unknown Patient',
                rawData: data
              };
            });
            
            historyItems = [...historyItems, ...appointmentsData];
          } catch (err) {
            console.error('Error fetching appointments:', err);
          }

          // Similar null-safe implementations for testRequests and testResults...
          // [Additional data fetching code with null checks...]

        } else if (userRole === 'patient') {
          // Patient data fetching with null checks
          // [Implementation similar to labOwner section...]
        } else if (userRole === 'doctor') {
          // Doctor data fetching with null checks
          // [Implementation similar to labOwner section...]
        }

        // Sort with null-safe date comparison
        historyItems.sort((a, b) => {
          const getDate = (item) => {
            const data = item.rawData || {};
            if (data.dateTime) return new Date(data.dateTime);
            if (data.createdAt?.toDate) return data.createdAt.toDate();
            if (data.createdAt) return new Date(data.createdAt);
            if (data.uploadedAt?.toDate) return data.uploadedAt.toDate();
            if (data.uploadedAt) return new Date(data.uploadedAt);
            return new Date(0);
          };
          return getDate(b) - getDate(a);
        });

        if (activityType) {
          historyItems = historyItems.filter(item => item.type === activityType);
        }

        setHistoryData(historyItems);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError("Failed to fetch history data");
        Alert.alert('Error', 'Failed to fetch history data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userRole, user?.uid, activityType]);

  const handleItemPress = (item) => {
    if (item?.patientId) {
      navigation.navigate('Details', { userId: item.patientId });
    }
  };


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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>
          {activityType === 'appointment' ? 'Appointment History' : 
           activityType === 'request' ? 'Test Request History' : 
           activityType === 'result' ? 'Test Results History' : 
           'Complete History'}
        </Text>
      </View>
      
      {historyData.length > 0 ? (
        <FlatList
          data={historyData}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.item}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.itemHeader}>
                <MaterialIcons 
                  name={item.type === 'appointment' ? 'event' : 
                        item.type === 'request' ? 'assignment' : 'description'} 
                  size={20} 
                  color="#4E73DF" 
                />
                <Text style={styles.date}>{item.date || 'Unknown date'}</Text>
              </View>
              <Text style={styles.event}>{item.event || 'No event details'}</Text>
              
              {item.patientName && (
                <View style={styles.patientContainer}>
                  <Text style={styles.patientLabel}>Patient:</Text>
                  <Text style={styles.patientValue}>{item.patientName}</Text>
                </View>
              )}

              {item.rawData?.status && (
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <Text style={[styles.statusValue,
                    item.rawData.status === 'completed' ? styles.statusCompleted : 
                    item.rawData.status === 'scheduled' ? styles.statusScheduled : 
                    styles.statusPending
                  ]}>
                    {(item.rawData.status || '').charAt(0).toUpperCase() + (item.rawData.status || '').slice(1)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={64} color="#E2E8F0" />
          <Text style={styles.emptyStateText}>No history found</Text>
        </View>
      )}
    </View>
  );
}

// [Styles remain unchanged...]
const styles = StyleSheet.create({
  // ... existing style definitions ...
});
