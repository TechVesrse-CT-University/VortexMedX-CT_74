import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert,
  TextInput,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../supabase';
export default function ScheduleNewTestScreen({ user, navigation }) {
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  // Time slots for scheduling
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (schedules.length > 0) {
      updateAvailableSlots();
    }
  }, [selectedDate, schedules]);

  const fetchSchedules = async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch schedules for lab owner from Supabase
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('labId', user.uid)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      const schedulesData = data.map(item => ({
        id: item.id,
        ...item
      }));
      
      setSchedules(schedulesData);
      updateAvailableSlots();
    } catch (error) {
      console.error('Error fetching schedules:', error);
      Alert.alert('Error', 'Failed to load schedules. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateAvailableSlots = () => {
    // Format selected date to match the date format in schedules
    const formattedDate = selectedDate.toISOString().split('T')[0];
    
    // Find schedule for selected date
    const schedule = schedules.find(s => s.date === formattedDate);
    
    if (schedule && schedule.slots) {
      // Filter available slots
      const available = schedule.slots.filter(slot => slot.available);
      setAvailableSlots(available.map(slot => slot.time));
    } else {
      // If no schedule exists for this date, all slots are available
      setAvailableSlots(timeSlots);
    }
    
    // Reset selected slot
    setSelectedSlot(null);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleAddSchedule = async () => {
    if (!selectedSlot) {
      Alert.alert('Error', 'Please select a time slot');
      return;
    }

    try {
      setLoading(true);
      
      // Format date for Supabase
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const dateTime = new Date(`${formattedDate}T${selectedSlot}`).toISOString();
      
      // Check if schedule already exists for this date
      const { data: existingSchedules, error: queryError } = await supabase
        .from('schedules')
        .select('*')
        .eq('labId', user.uid)
        .eq('date', formattedDate)
        .single();
      
      if (queryError && queryError.code !== 'PGRST116') throw queryError;
      
      if (existingSchedules) {
        // Update existing schedule
        const updatedSlots = existingSchedules.slots.map(slot => {
          if (slot.time === selectedSlot) {
            return { ...slot, available: false };
          }
          return slot;
        });
        
        // Add new slot if it doesn't exist
        if (!updatedSlots.some(slot => slot.time === selectedSlot)) {
          updatedSlots.push({ time: selectedSlot, available: false });
        }
        
        // Update schedule in Supabase
        const { error: updateError } = await supabase
          .from('schedules')
          .update({ 
            slots: updatedSlots,
            updatedAt: new Date().toISOString()
          })
          .eq('id', existingSchedules.id);
          
        if (updateError) throw updateError;
      } else {
        // Create new schedule
        const { error: insertError } = await supabase
          .from('schedules')
          .insert({
            labId: user.uid,
            date: formattedDate,
            slots: timeSlots.map(time => ({
              time,
              available: time !== selectedSlot
            })),
            createdAt: new Date().toISOString()
          });
          
        if (insertError) throw insertError;
      }
      
      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          labId: user.uid,
          dateTime,
          status: 'scheduled',
          createdAt: new Date().toISOString()
        });
        
      if (appointmentError) throw appointmentError;
      
      Alert.alert(
        'Success', 
        'New test slot scheduled successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding schedule:', error);
      Alert.alert('Error', 'Failed to add schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
        <Text style={styles.screenTitle}>Schedule New Test</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4E73DF" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content}>
          {/* Date Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <TouchableOpacity 
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={24} color="#4E73DF" />
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>
          
          {/* Time Slot Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time Slot</Text>
            <View style={styles.slotsContainer}>
              {availableSlots.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.slotButton,
                        selectedSlot === slot && styles.slotButtonSelected
                      ]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[
                        styles.slotText,
                        selectedSlot === slot && styles.slotTextSelected
                      ]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptySlots}>
                  <MaterialIcons name="event-busy" size={24} color="#A0AEC0" />
                  <Text style={styles.emptySlotsText}>No available slots for this date</Text>
                </View>
              )}
            </View>
          </View>
          
          {/* Schedule Button */}
          <TouchableOpacity 
            style={[styles.scheduleButton, !selectedSlot && styles.scheduleButtonDisabled]}
            onPress={handleAddSchedule}
            disabled={!selectedSlot}
          >
            <Text style={styles.scheduleButtonText}>Schedule Test</Text>
          </TouchableOpacity>
        </ScrollView>
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
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#2D3748',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 16,
    marginLeft: 10,
    color: '#333',
  },
  slotsContainer: {
    minHeight: 60,
  },
  slotButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  slotButtonSelected: {
    backgroundColor: '#4E73DF',
  },
  slotText: {
    fontSize: 16,
    color: '#333',
  },
  slotTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptySlots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 20,
  },
  emptySlotsText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#A0AEC0',
  },
  scheduleButton: {
    backgroundColor: '#4E73DF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  scheduleButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  scheduleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});