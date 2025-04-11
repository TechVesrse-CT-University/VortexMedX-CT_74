import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreenLabOwner from './src/screens/HomeScreenLabOwner';
import HomeScreenDoctor from './src/screens/HomeScreenDoctor';
import HomeScreenPatient from './src/screens/HomeScreenPatient';
import HistoryScreen from './src/screens/HistoryScreen';
import DetailsScreen from './src/screens/DetailsScreen';
import DetailsScreenLabOwner from './src/screens/DetailsScreenLabOwner';
import DetailsScreenDoctor from './src/screens/DetailsScreenDoctor';
import DetailsScreenPatient from './src/screens/DetailsScreenPatient';
import ProfileScreen from './src/screens/ProfileScreen';
import FooterNav from './src/components/FooterNav';
import UploadScreen from './src/screens/UploadsScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import UploadTestResultScreen from './src/screens/UploadTestResultScreen';
import ViewAppointmentsScreen from './src/screens/ViewAppointmentsScreen';
import PatientRecordsScreen from './src/screens/PatientRecordsScreen';
import ScheduleNewTestScreen from './src/screens/ScheduleNewTestScreen';
import { supabase } from './src/supabase';
import PatientMedicalHistoryScreen from './src/screens/PatientMedicalHistoryScreen';
import DoctorPatientRecordsScreen from './src/screens/DoctorPatientRecordsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [userRole, setUserRole] = useState('');
  const [user, setUser] = useState({});

  useEffect(() => {
    // Subscribe to auth changes using Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = session.user;
          try {
            // Fetch user role from Supabase
            const { data: userData, error } = await supabase
              .from('users')
              .select('role, name')
              .eq('id', user.id)
              .single();

            if (userData) {
              setUser({
                email: user.email,
                role: userData.role,
                name: userData.name,
                uid: user.id
              });
              setUserRole(userData.role);
            } else {
              // If user data doesn't exist, determine role from UID prefix
              let role = 'dco'; // Default role
              
              // Check UID prefix to determine role
              if (user.id.startsWith('LB')) {
                role = 'labOwner';
              } else if (user.id.startsWith('DR')) {
                role = 'doctor';
              } else if (user.id.startsWith('PT')) {
                role = 'patient';
              }
              
              setUser({
                email: user.email,
                role: role,
                name: user.email ? user.email.split('@')[0] : 'User',
                uid: user.id
              });
              setUserRole(role);
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser({});
          setUserRole('');
        }
      }
    );

    // Check for existing session on app load
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        try {
          // Fetch user role from Supabase
          const { data: userData, error } = await supabase
            .from('users')
            .select('role, name')
            .eq('id', user.id)
            .single();

          if (userData) {
            setUser({
              email: user.email,
              role: userData.role,
              name: userData.name,
              uid: user.id
            });
            setUserRole(userData.role);
          } else {
            // If user data doesn't exist, determine role from UID prefix
            let role = 'patient'; // Default role
            
            // Check UID prefix to determine role
            if (user.id.startsWith('LB')) {
              role = 'labOwner';
            } else if (user.id.startsWith('DR')) {
              role = 'doctor';
            } else if (user.id.startsWith('PT')) {
              role = 'patient';
            }
            
            setUser({
              email: user.email,
              role: role,
              name: user.email ? user.email.split('@')[0] : 'User',
              uid: user.id
            });
            setUserRole(role);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };
    
    checkSession();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FooterNav {...props} userRole={userRole} setUserRole={setUserRole} />}
      >
        {!user.uid ? (
          <>
            <Tab.Screen name="Login">
              {(props) => <LoginScreen {...props} setUser={setUser} />}
            </Tab.Screen>
            <Tab.Screen name="Signup">
              {(props) => <SignupScreen {...props} setUser={setUser} />}
            </Tab.Screen>
            <Tab.Screen name="ForgotPassword">
              {(props) => <ForgotPasswordScreen {...props} />}
            </Tab.Screen>
          </>
        ) : (
          <>
            <Tab.Screen name="Home">
              {(props) => {
                switch(userRole) {
                  case 'labOwner':
                    return <HomeScreenLabOwner {...props} user={user} />;
                  case 'doctor':
                    return <HomeScreenDoctor {...props} user={user} />;
                  case 'patient':
                  default:
                    return <HomeScreenPatient {...props} user={user} />;
                }
              }}
            </Tab.Screen>
            <Tab.Screen name="History">
            {(props) => {
                switch(userRole) {
                  case 'labOwner':
                    return <PatientRecordsScreen {...props} user={user} />;
                  case 'doctor':
                    return <HistoryScreen {...props} user={user} />;
                  case 'patient':
                  default:
                    return <PatientMedicalHistoryScreen {...props} user={user} />;
                }
              }}
            </Tab.Screen>
            <Tab.Screen name="Upload">
              {(props) => <UploadScreen {...props} userRole={userRole} />}
            </Tab.Screen>
            <Tab.Screen name="Details">
              {(props) => {
                switch(userRole) {
                  case 'labOwner':
                    return <DetailsScreenLabOwner {...props} user={user} />;
                  case 'doctor':
                    return <DetailsScreenDoctor {...props} user={user} />;
                  case 'patient':
                  default:
                    return <DetailsScreenPatient {...props} user={user} />;
                }
              }}
            </Tab.Screen>
            <Tab.Screen name="Profile">
              {(props) => <ProfileScreen {...props} user={user} setUserRole={setUserRole} />}
            </Tab.Screen>
            <Tab.Screen name="UploadTestResult">
              {(props) => <UploadTestResultScreen {...props} user={user} />}
            </Tab.Screen>
            <Tab.Screen name="ViewAppointments">
              {(props) => <ViewAppointmentsScreen {...props} user={user} />}
            </Tab.Screen>
            <Tab.Screen name="PatientRecords">
              {(props) => <PatientRecordsScreen {...props} user={user} />}
            </Tab.Screen>
            <Tab.Screen name="ScheduleNewTest">
              {(props) => <ScheduleNewTestScreen {...props} user={user} />}
            </Tab.Screen>
          </>
        )}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
