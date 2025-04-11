import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ActivityIndicator, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  Image,
  Easing,
  StatusBar
} from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

// Mock data for medical history
const MOCK_MEDICAL_HISTORY = [
  {
    id: '1',
    date: new Date('2025-03-15'),
    type: 'Annual Checkup',
    provider: 'Dr. Sarah Johnson',
    providerSpecialty: 'Primary Care',
    facilityName: 'Brookside Medical Center',
    diagnosis: 'Healthy, minor vitamin D deficiency',
    treatment: 'Vitamin D supplements, 2000 IU daily',
    notes: 'Patient reported occasional fatigue. Blood work shows slightly low vitamin D levels. Recommended supplements and increased sun exposure.',
    vitalSigns: {
      bloodPressure: '120/78',
      heartRate: '72',
      temperature: '98.6°F',
      respiratoryRate: '16',
      oxygenSaturation: '98%'
    },
    medications: ['Vitamin D3 2000 IU'],
    severity: 'low',
    followUp: '12 months'
  },
  {
    id: '2',
    date: new Date('2025-02-03'),
    type: 'Emergency Visit',
    provider: 'Dr. Michael Chen',
    providerSpecialty: 'Emergency Medicine',
    facilityName: 'Metropolitan Hospital',
    diagnosis: 'Ankle sprain, Grade II',
    treatment: 'RICE protocol, ankle brace, pain management',
    notes: 'Patient injured ankle while playing basketball. X-ray negative for fracture. Grade II lateral ankle sprain diagnosed. Pain medication prescribed and physical therapy recommended.',
    vitalSigns: {
      bloodPressure: '132/84',
      heartRate: '88',
      temperature: '98.8°F',
      respiratoryRate: '18',
      oxygenSaturation: '99%'
    },
    medications: ['Ibuprofen 600mg', 'Acetaminophen 500mg'],
    severity: 'moderate',
    followUp: '2 weeks'
  },
  {
    id: '3',
    date: new Date('2025-01-12'),
    type: 'Specialist Consultation',
    provider: 'Dr. Elizabeth Wright',
    providerSpecialty: 'Dermatology',
    facilityName: 'Skin & Wellness Institute',
    diagnosis: 'Eczema, mild',
    treatment: 'Topical corticosteroid cream, moisturizing regimen',
    notes: 'Patient presented with dry, itchy patches on elbows and knees. Prescribed hydrocortisone cream for acute flare-ups and recommended daily moisturizing routine.',
    vitalSigns: {
      bloodPressure: '118/76',
      heartRate: '70',
      temperature: '98.4°F',
      respiratoryRate: '15',
      oxygenSaturation: '99%'
    },
    medications: ['Hydrocortisone 1% cream', 'Cerave Moisturizing Cream'],
    severity: 'low',
    followUp: '3 months if symptoms persist'
  },
  {
    id: '4',
    date: new Date('2024-12-05'),
    type: 'Dental Examination',
    provider: 'Dr. Robert Garcia',
    providerSpecialty: 'Dentistry',
    facilityName: 'Smile Bright Dental Care',
    diagnosis: 'Mild gingivitis, one cavity (lower right molar)',
    treatment: 'Dental filling, improved oral hygiene routine',
    notes: 'Patient requires filling on tooth #30. Recommended improved flossing technique and twice-daily brushing with fluoride toothpaste.',
    medications: ['Prescription fluoride toothpaste'],
    severity: 'low',
    followUp: '6 months'
  },
  {
    id: '5',
    date: new Date('2024-11-18'),
    type: 'Physical Therapy',
    provider: 'Amanda Torres, DPT',
    providerSpecialty: 'Physical Therapy',
    facilityName: 'Active Recovery Center',
    diagnosis: 'Rotator cuff strain',
    treatment: 'Therapeutic exercises, heat therapy, massage',
    notes: 'Patient showing good progress with shoulder mobility. Continuing with strengthening exercises and range of motion work. Reduced pain reported.',
    medications: [],
    severity: 'moderate',
    followUp: '1 week'
  },
];

// Medical record type icons mapping
const RECORD_TYPE_ICONS = {
  'Annual Checkup': 'clipboard-check',
  'Emergency Visit': 'ambulance',
  'Specialist Consultation': 'user-md',
  'Dental Examination': 'tooth',
  'Physical Therapy': 'hand-holding-medical',
  'Surgery': 'procedures',
  'Vaccination': 'syringe',
  'Lab Test': 'flask',
  'Imaging': 'x-ray',
  'Mental Health': 'brain'
};

// Severity colors
const SEVERITY_COLORS = {
  'low': '#4CAF50',
  'moderate': '#FF9800',
  'high': '#F44336',
  'critical': '#9C27B0'
};

export default function PatientMedicalHistoryScreen({ navigation }) {
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterVisible, setFilterVisible] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  
  // Create the spinning animation for the loading indicator
  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Start spinning animation
  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, []);
  
  useEffect(() => {
    // Start fade-in animation when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: filterVisible ? 0 : -50,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
    
    // Simulate API loading
    setTimeout(() => {
      try {
        // Sort the mock data based on the current sort order
        const sortedData = [...MOCK_MEDICAL_HISTORY].sort((a, b) => {
          if (sortOrder === 'desc') {
            return b.date - a.date;
          } else {
            return a.date - b.date;
          }
        });
        
        // Apply any type filters if needed
        let filteredData = sortedData;
        if (selectedFilter !== 'all') {
          filteredData = sortedData.filter(item => item.type === selectedFilter);
        }
        
        setMedicalHistory(filteredData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading mock data:', err);
        setError('Failed to load medical history');
        setLoading(false);
      }
    }, 1500); // Simulate loading delay
    
  }, [sortOrder, selectedFilter]);

  const toggleSortOrder = () => {
    setSortOrder(prevOrder => prevOrder === 'desc' ? 'asc' : 'desc');
  };

  const toggleFilterOptions = () => {
    setFilterVisible(prev => !prev);
    Animated.spring(slideAnim, {
      toValue: filterVisible ? -50 : 0,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };
  
  const toggleCardExpansion = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };
  
  const applyTypeFilter = (type) => {
    setSelectedFilter(type);
    setFilterVisible(false);
    Animated.spring(slideAnim, {
      toValue: -50,
      tension: 80,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };
  
  // Get unique record types for filter
  const recordTypes = ['all', ...new Set(MOCK_MEDICAL_HISTORY.map(item => item.type))];

  // Create animations for all items upfront
  const itemAnimations = useRef(
    medicalHistory.map(() => new Animated.Value(0))
  ).current;

  const renderHistoryItem = ({ item, index }) => {
    const isExpanded = expandedCard === item.id;
    
    // Format date nicely
    const formattedDate = item.date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Get the appropriate icon for this record type
    const recordIcon = RECORD_TYPE_ICONS[item.type] || 'medical-services';
    
    return (
      <Animated.View style={styles.historyItem}>
        <TouchableOpacity 
          style={styles.historyHeader}
          onPress={() => toggleCardExpansion(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: SEVERITY_COLORS[item.severity] || '#4E73DF' }]}>
            <FontAwesome5 name={recordIcon} size={18} color="#fff" />
          </View>
          <View style={styles.historyInfo}>
            <Text style={styles.historyType}>{item.type}</Text>
            <Text style={styles.historyDate}>
              {formattedDate}
            </Text>
          </View>
          <View style={styles.severityBadge}>
            <Text style={styles.severityText}>{item.severity || 'N/A'}</Text>
          </View>
          <Animated.View style={{
            transform: [{ 
              rotate: isExpanded ? '180deg' : '0deg' 
            }]
          }}>
            <MaterialIcons name="expand-more" size={28} color="#4E73DF" />
          </Animated.View>
        </TouchableOpacity>
        
        <View style={styles.divider} />
        
        <View style={styles.providerSection}>
          <FontAwesome5 name="user-md" size={14} color="#666" style={{ marginRight: 8 }} />
          <View style={styles.providerInfo}>
            <Text style={styles.historyProvider}>{item.provider}</Text>
            <Text style={styles.facilityText}>{item.providerSpecialty} · {item.facilityName}</Text>
          </View>
        </View>
        
        <View style={styles.diagnosisSection}>
          <Text style={styles.sectionLabel}>Diagnosis:</Text>
          <Text style={styles.historyDiagnosis}>{item.diagnosis}</Text>
        </View>
        
        {isExpanded && (
          <Animated.View style={styles.expandedContent}>
            {item.treatment && (
              <View style={styles.treatmentSection}>
                <Text style={styles.sectionLabel}>Treatment Plan:</Text>
                <Text style={styles.treatmentText}>{item.treatment}</Text>
              </View>
            )}
            
            {item.vitalSigns && (
              <View style={styles.vitalsSection}>
                <Text style={styles.sectionLabel}>Vital Signs:</Text>
                <View style={styles.vitalsGrid}>
                  {item.vitalSigns.bloodPressure && (
                    <View style={styles.vitalItem}>
                      <FontAwesome5 name="heartbeat" size={14} color="#F44336" />
                      <Text style={styles.vitalLabel}>BP</Text>
                      <Text style={styles.vitalValue}>{item.vitalSigns.bloodPressure}</Text>
                    </View>
                  )}
                  
                  {item.vitalSigns.heartRate && (
                    <View style={styles.vitalItem}>
                      <FontAwesome5 name="heart" size={14} color="#F44336" />
                      <Text style={styles.vitalLabel}>Heart</Text>
                      <Text style={styles.vitalValue}>{item.vitalSigns.heartRate} bpm</Text>
                    </View>
                  )}
                  
                  {item.vitalSigns.temperature && (
                    <View style={styles.vitalItem}>
                      <FontAwesome5 name="thermometer-half" size={14} color="#FF9800" />
                      <Text style={styles.vitalLabel}>Temp</Text>
                      <Text style={styles.vitalValue}>{item.vitalSigns.temperature}</Text>
                    </View>
                  )}
                  
                  {item.vitalSigns.respiratoryRate && (
                    <View style={styles.vitalItem}>
                      <FontAwesome5 name="lungs" size={14} color="#4CAF50" />
                      <Text style={styles.vitalLabel}>Resp</Text>
                      <Text style={styles.vitalValue}>{item.vitalSigns.respiratoryRate}/min</Text>
                    </View>
                  )}
                  
                  {item.vitalSigns.oxygenSaturation && (
                    <View style={styles.vitalItem}>
                      <FontAwesome5 name="tint" size={14} color="#2196F3" />
                      <Text style={styles.vitalLabel}>O2</Text>
                      <Text style={styles.vitalValue}>{item.vitalSigns.oxygenSaturation}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
            
            {item.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.sectionLabel}>Clinical Notes:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}
            
            {item.medications && item.medications.length > 0 && (
              <View style={styles.medicationContainer}>
                <Text style={styles.sectionLabel}>Medications:</Text>
                {item.medications.map((med, idx) => (
                  <View key={idx} style={styles.medicationItem}>
                    <FontAwesome5 name="prescription-bottle-alt" size={14} color="#4E73DF" />
                    <Text style={styles.medicationText}>{med}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {item.followUp && (
              <View style={styles.followUpSection}>
                <Text style={styles.sectionLabel}>Follow-up:</Text>
                <Text style={styles.followUpText}>
                  <FontAwesome5 name="calendar-check" size={14} color="#4E73DF" /> {item.followUp}
                </Text>
              </View>
            )}
          </Animated.View>
        )}
        
        <TouchableOpacity 
          style={[styles.detailsButton, isExpanded && styles.detailsButtonExpanded]}
          onPress={() => toggleCardExpansion(item.id)}
        >
          <Text style={styles.detailsButtonText}>
            {isExpanded ? 'Show Less' : 'View Complete Details'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <FontAwesome5 name="heartbeat" size={48} color="#4E73DF" />
        </Animated.View>
        <Text style={styles.loadingText}>Loading your medical history...</Text>
        <View style={styles.loadingBar}>
          <Animated.View 
            style={[
              styles.loadingProgress,
              { 
                width: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]} 
          />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
        <View style={styles.errorContainer}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1053/1053367.png' }} 
            style={styles.errorImage}
          />
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.errorSubtext}>We couldn't retrieve your medical records at this time.</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get filter option buttons
  const filterOptions = recordTypes.map(type => (
    <TouchableOpacity 
      key={type}
      style={[
        styles.filterTypeButton,
        selectedFilter === type && styles.filterTypeButtonSelected
      ]}
      onPress={() => applyTypeFilter(type)}
    >
      {type !== 'all' && (
        <FontAwesome5 
          name={RECORD_TYPE_ICONS[type] || 'file-medical'} 
          size={16} 
          color={selectedFilter === type ? '#fff' : '#4E73DF'} 
        />
      )}
      {type === 'all' && (
        <FontAwesome5 
          name="layer-group" 
          size={16} 
          color={selectedFilter === type ? '#fff' : '#4E73DF'} 
        />
      )}
      <Text 
        style={[
          styles.filterButtonText,
          selectedFilter === type && styles.filterButtonTextSelected
        ]}
      >
        {type === 'all' ? 'All Records' : type}
      </Text>
    </TouchableOpacity>
  ));

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9FC" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Medical History</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={toggleFilterOptions}
        >
          <Ionicons name="options-outline" size={24} color="#4E73DF" />
        </TouchableOpacity>
      </View>

      <Animated.View 
        style={[
          styles.filterOptions,
          { 
            transform: [{ translateY: slideAnim }],
            height: filterVisible ? 'auto' : 0,
            opacity: filterVisible ? 1 : 0
          }
        ]}
      >
        <TouchableOpacity 
          style={[
            styles.sortButton,
            sortOrder === 'asc' && styles.sortButtonActive
          ]}
          onPress={toggleSortOrder}
        >
          <MaterialIcons 
            name={sortOrder === 'desc' ? "arrow-downward" : "arrow-upward"} 
            size={18} 
            color={sortOrder === 'desc' ? "#4E73DF" : "#fff"} 
          />
          <Text style={[
            styles.sortButtonText,
            sortOrder === 'asc' && styles.sortButtonTextActive
          ]}>
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.filterSectionTitle}>Filter by Record Type</Text>
        <View style={styles.filterButtonsContainer}>
          {filterOptions}
        </View>
      </Animated.View>

      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{medicalHistory.length}</Text>
          <Text style={styles.summaryLabel}>Records</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>5</Text>
          <Text style={styles.summaryLabel}>Providers</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>4</Text>
          <Text style={styles.summaryLabel}>Medications</Text>
        </View>
      </View>

      {medicalHistory.length > 0 ? (
        <FlatList
          data={medicalHistory}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076432.png' }}
            style={styles.emptyStateImage}
          />
          <Text style={styles.emptyStateText}>No medical records found</Text>
          <Text style={styles.emptyStateSubtext}>We couldn't find any medical records matching your filter criteria.</Text>
          <TouchableOpacity 
            style={styles.addRecordButton}
            onPress={() => applyTypeFilter('all')}
          >
            <Text style={styles.addRecordButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <TouchableOpacity style={styles.fabButton} activeOpacity={0.8}>
        <Animated.View style={{ transform: [{ rotate: '0deg' }] }}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FC',
    padding: 20,
  },
  loadingText: {
    marginTop: 24,
    color: '#4E73DF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingBar: {
    width: '80%',
    height: 6,
    backgroundColor: '#E0E7FF',
    borderRadius: 3,
    marginTop: 24,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    backgroundColor: '#4E73DF',
    borderRadius: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF5',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#F0F5FF',
  },
  filterOptions: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF5',
    overflow: 'hidden',
    zIndex: 10,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F5FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 50,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  sortButtonActive: {
    backgroundColor: '#4E73DF',
    borderColor: '#4E73DF',
  },
  sortButtonText: {
    marginLeft: 8,
    color: '#4E73DF',
    fontWeight: '600',
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  filterTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F5FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  filterTypeButtonSelected: {
    backgroundColor: '#4E73DF',
    borderColor: '#4E73DF',
  },
  filterButtonText: {
    marginLeft: 8,
    color: '#4E73DF',
    fontWeight: '500',
    fontSize: 13,
  },
  filterButtonTextSelected: {
    color: '#fff',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6EAF5',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4E73DF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#E6EAF5',
    alignSelf: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Additional space for FAB
  },
  historyItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#A0AEC0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F5FF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#4E73DF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyDate: {
    fontSize: 13,
    color: '#666',
  },
  historyType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 50,
    backgroundColor: '#F0F5FF',
    marginRight: 8,
  },
  severityText: {
    color: '#4E73DF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EAF5',
    marginBottom: 12,
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  providerInfo: {
    flex: 1,
  },
  historyProvider: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  facilityText: {
    fontSize: 13,
    color: '#666',
  },
  diagnosisSection: {
    marginBottom: 12,
  },
  historyDiagnosis: {
    fontSize: 15,
    color: '#333',
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4E73DF',
    marginBottom: 4,
  },
  expandedContent: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E6EAF5',
    paddingTop: 12,
  },
  treatmentSection: {
    marginBottom: 14,
  },
  treatmentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  vitalsSection: {
    marginBottom: 14,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  vitalItem: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '20%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  notesSection: {
    marginBottom: 14,
  },
  notesText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  medicationContainer: {
    marginBottom: 14,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  medicationText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
  },
  followUpSection: {
    marginBottom: 4,
  },
  followUpText: {
    fontSize: 15,
    color: '#333',
  },
  detailsButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 12,
    backgroundColor: '#F0F5FF',
    borderRadius: 8,
  },
  detailsButtonExpanded: {
    backgroundColor: '#E6EAF5',
  },
  detailsButtonText: {
    color: '#4E73DF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addRecordButton: {
    backgroundColor: '#4E73DF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addRecordButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4E73DF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorImage: {
    width: 100,
    height: 100,
    marginBottom: 24,
    opacity: 0.7,
  },
  error: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#4E73DF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 50,
    shadowColor: '#4E73DF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});