import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  useToast,
  Image,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { StarIcon, TimeIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import AppointmentCard from './AppointmentCard';
import WorkingHoursForm from './WorkingHoursForm';

const PhlebotomistDashboard = () => {
  const [appointments, setAppointments] = useState({
    new: [],
    upcoming: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const [showWorkingHoursForm, setShowWorkingHoursForm] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('phlebotomist_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const today = new Date();
      const sortedAppointments = {
        new: data.filter(
          (apt) =>
            apt.status === 'pending' &&
            new Date(apt.appointment_date) >= today
        ),
        upcoming: data.filter(
          (apt) =>
            apt.status === 'accepted' &&
            new Date(apt.appointment_date) >= today
        ),
        past: data.filter(
          (apt) =>
            new Date(apt.appointment_date) < today ||
            ['completed', 'missed'].includes(apt.status)
        ),
      };

      setAppointments(sortedAppointments);
    } catch (error) {
      toast({
        title: 'Error fetching appointments',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: action })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: 'Appointment updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      fetchAppointments();
    } catch (error) {
      toast({
        title: 'Error updating appointment',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            Dashboard
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => setShowWorkingHoursForm(true)}
          >
            Set Working Hours
          </Button>
        </HStack>

        <Tabs>
          <TabList>
            <Tab>
              New Requests
              {appointments.new.length > 0 && (
                <Badge ml={2} colorScheme="red">
                  {appointments.new.length}
                </Badge>
              )}
            </Tab>
            <Tab>
              Upcoming
              {appointments.upcoming.length > 0 && (
                <Badge ml={2} colorScheme="blue">
                  {appointments.upcoming.length}
                </Badge>
              )}
            </Tab>
            <Tab>Past</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                {appointments.new.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onAccept={() => handleAppointmentAction(appointment.id, 'accepted')}
                    onReject={() => handleAppointmentAction(appointment.id, 'rejected')}
                  />
                ))}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {appointments.upcoming.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onStatusChange={(status) =>
                      handleAppointmentAction(appointment.id, status)
                    }
                  />
                ))}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {appointments.past.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    readOnly
                  />
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {showWorkingHoursForm && (
        <WorkingHoursForm onClose={() => setShowWorkingHoursForm(false)} />
      )}
    </Box>
  );
};

export default PhlebotomistDashboard; 