import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { checkDatabaseConnection } from './services/databaseService';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserContext } from './contexts/UserContext';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreenPatient from './screens/HomeScreenPatient';
import HomeScreenDoctor from './screens/HomeScreenDoctor';
import HomeScreenLabOwner from './screens/HomeScreenLabOwner';
import ProfileScreen from './screens/ProfileScreen';
import PatientRecordsScreen from './screens/PatientRecordsScreen';
import DoctorPatientRecordsScreen from './screens/DoctorPatientRecordsScreen';
import LabOwnerPatientTestsScreen from './screens/LabOwnerPatientTestsScreen';
import UploadTestResultScreen from './screens/UploadTestResultScreen';
import ScheduleNewTestScreen from './screens/ScheduleNewTestScreen';
import ViewAppointmentsScreen from './screens/ViewAppointmentsScreen';

const AuthStack = createStackNavigator();
const PatientStack = createStackNavigator();
const DoctorStack = createStackNavigator();
const LabOwnerStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function PatientNavigator() {
  return (
    <PatientStack.Navigator screenOptions={{ headerShown: false }}>
      <PatientStack.Screen name="PatientHome" component={HomeScreenPatient} />
      <PatientStack.Screen name="PatientProfile" component={ProfileScreen} />
      <PatientStack.Screen name="PatientRecords" component={PatientRecordsScreen} />
      <PatientStack.Screen name="PatientScheduleTest" component={ScheduleNewTestScreen} />
      <PatientStack.Screen name="PatientAppointments" component={ViewAppointmentsScreen} />
    </PatientStack.Navigator>
  );
}

function DoctorNavigator() {
  return (
    <DoctorStack.Navigator screenOptions={{ headerShown: false }}>
      <DoctorStack.Screen name="DoctorHome" component={HomeScreenDoctor} />
      <DoctorStack.Screen name="DoctorProfile" component={ProfileScreen} />
      <DoctorStack.Screen name="DoctorRecords" component={DoctorPatientRecordsScreen} />
      <DoctorStack.Screen name="DoctorAppointments" component={ViewAppointmentsScreen} />
    </DoctorStack.Navigator>
  );
}

function LabOwnerNavigator() {
  return (
    <LabOwnerStack.Navigator screenOptions={{ headerShown: false }}>
      <LabOwnerStack.Screen name="LabOwnerHome" component={HomeScreenLabOwner} />
      <LabOwnerStack.Screen name="LabOwnerProfile" component={ProfileScreen} />
      <LabOwnerStack.Screen name="LabOwnerTests" component={LabOwnerPatientTestsScreen} />
      <LabOwnerStack.Screen name="LabOwnerUpload" component={UploadTestResultScreen} />
    </LabOwnerStack.Navigator>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initializeApp = async () => {
      await checkDatabaseConnection();

      // For testing - manually assign role (remove in production)
      setUser({
        email: 'test@e.com',
        password: 'test123', // Test password
        role: 'doctor',
        name: 'Test User',
        uid: 'test-uid-123',
        userFriendlyUid: 'DR1234567890'
      });
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session?.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('role, user_friendly_uid')
              .eq('id', session.user.id)
              .single();
            
            setUser({
              email: session.user.email,
              uid: session.user.id,
              role: profile?.role || 'doctor',
              userFriendlyUid: profile?.user_friendly_uid || '',
              name: session.user.user_metadata?.name || session.user.email.split('@')[0]
            });
          } else {
            setUser(null);
          }
        }
      );
      return () => authListener.unsubscribe();
    };
    initializeApp();
  }, []);

  console.log('Current user role:', user?.role);
  return (
    <UserContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        {!user ? (
          <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Login" component={LoginScreen} />
            <AuthStack.Screen name="Signup" component={SignupScreen} />
            <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </AuthStack.Navigator>
        ) : user.role === 'doctor' ? (
          <DoctorNavigator />
        ) : user.role === 'labOwner' ? (
          <LabOwnerNavigator />
        ) : (
          <PatientNavigator />
        )}
      </NavigationContainer>
    </UserContext.Provider>
  );
}

export default App;
