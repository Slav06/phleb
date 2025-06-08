import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Textarea,
  Select,
  Grid,
  GridItem,
  Text,
  Box,
} from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { supabase } from '../../supabaseClient';

const BookingForm = ({ phlebotomist, onClose }) => {
  const [formData, setFormData] = useState({
    appointmentDate: new Date(),
    startTime: '',
    endTime: '',
    patientName: '',
    dateOfBirth: '',
    address: '',
    phoneNumber: '',
    email: '',
    testDetails: '',
    doctorName: '',
    insuranceProvider: '',
    insuranceNumber: '',
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAvailableTimeSlots();
  }, [formData.appointmentDate]);

  const fetchAvailableTimeSlots = async () => {
    try {
      const dayOfWeek = formData.appointmentDate.getDay();
      const { data: workingHours, error: workingHoursError } = await supabase
        .from('working_hours')
        .select('*')
        .eq('phlebotomist_id', phlebotomist.id)
        .eq('day_of_week', dayOfWeek)
        .single();

      if (workingHoursError) throw workingHoursError;

      const { data: existingAppointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('phlebotomist_id', phlebotomist.id)
        .eq('appointment_date', formData.appointmentDate.toISOString().split('T')[0]);

      if (appointmentsError) throw appointmentsError;

      // Generate available time slots
      const slots = generateTimeSlots(workingHours, existingAppointments);
      setAvailableTimeSlots(slots);
    } catch (error) {
      toast({
        title: 'Error fetching available time slots',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const generateTimeSlots = (workingHours, existingAppointments) => {
    if (!workingHours) return [];

    const slots = [];
    const start = new Date(`2000-01-01T${workingHours.start_time}`);
    const end = new Date(`2000-01-01T${workingHours.end_time}`);
    const interval = 30; // 30-minute intervals

    for (let time = start; time < end; time.setMinutes(time.getMinutes() + interval)) {
      const slotStart = time.toTimeString().slice(0, 5);
      const slotEnd = new Date(time.getTime() + interval * 60000).toTimeString().slice(0, 5);

      // Check if slot is available
      const isAvailable = !existingAppointments.some(
        (appt) =>
          (slotStart >= appt.start_time && slotStart < appt.end_time) ||
          (slotEnd > appt.start_time && slotEnd <= appt.end_time)
      );

      if (isAvailable) {
        slots.push({ start: slotStart, end: slotEnd });
      }
    }

    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: appointment, error } = await supabase.from('appointments').insert([
        {
          patient_id: (await supabase.auth.getUser()).data.user.id,
          phlebotomist_id: phlebotomist.id,
          appointment_date: formData.appointmentDate.toISOString().split('T')[0],
          start_time: formData.startTime,
          end_time: formData.endTime,
          patient_address: formData.address,
          test_details: {
            testDetails: formData.testDetails,
            doctorName: formData.doctorName,
          },
          insurance_info: {
            provider: formData.insuranceProvider,
            number: formData.insuranceNumber,
          },
        },
      ]);

      if (error) throw error;

      // Create chat thread
      const { error: chatError } = await supabase.from('chat_threads').insert([
        {
          appointment_id: appointment[0].id,
        },
      ]);

      if (chatError) throw chatError;

      toast({
        title: 'Appointment booked successfully',
        description: 'You will receive a confirmation email shortly.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error booking appointment',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Book Appointment</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <DatePicker
                  selected={formData.appointmentDate}
                  onChange={(date) => setFormData({ ...formData, appointmentDate: date })}
                  minDate={new Date()}
                  customInput={<Input />}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Available Time Slots</FormLabel>
                <Select
                  placeholder="Select a time slot"
                  value={formData.startTime}
                  onChange={(e) => {
                    const [start, end] = e.target.value.split('-');
                    setFormData({
                      ...formData,
                      startTime: start,
                      endTime: end,
                    });
                  }}
                >
                  {availableTimeSlots.map((slot) => (
                    <option key={slot.start} value={`${slot.start}-${slot.end}`}>
                      {slot.start} - {slot.end}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      value={formData.patientName}
                      onChange={(e) =>
                        setFormData({ ...formData, patientName: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Date of Birth</FormLabel>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        setFormData({ ...formData, dateOfBirth: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl isRequired>
                <FormLabel>Address</FormLabel>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </FormControl>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, phoneNumber: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <FormControl isRequired>
                <FormLabel>Test Details</FormLabel>
                <Textarea
                  value={formData.testDetails}
                  onChange={(e) => setFormData({ ...formData, testDetails: e.target.value })}
                  placeholder="Please provide details about the tests you need"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Doctor's Name</FormLabel>
                <Input
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                />
              </FormControl>

              <Grid templateColumns="repeat(2, 1fr)" gap={4} width="100%">
                <GridItem>
                  <FormControl>
                    <FormLabel>Insurance Provider</FormLabel>
                    <Input
                      value={formData.insuranceProvider}
                      onChange={(e) =>
                        setFormData({ ...formData, insuranceProvider: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl>
                    <FormLabel>Insurance Number</FormLabel>
                    <Input
                      value={formData.insuranceNumber}
                      onChange={(e) =>
                        setFormData({ ...formData, insuranceNumber: e.target.value })
                      }
                    />
                  </FormControl>
                </GridItem>
              </Grid>

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={loading}
                loadingText="Booking..."
              >
                Book Appointment
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BookingForm; 