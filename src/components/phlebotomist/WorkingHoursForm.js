import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  Text,
  Box,
  Divider,
} from '@chakra-ui/react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WorkingHoursForm = ({ onClose }) => {
  const [workingHours, setWorkingHours] = useState(
    DAYS_OF_WEEK.map((_, index) => ({
      day_of_week: index,
      start_time: '09:00',
      end_time: '17:00',
    }))
  );
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (id) {
      navigate(`/lab/${id}`);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    fetchExistingHours();
    // eslint-disable-next-line
  }, []);

  const fetchExistingHours = async () => {
    try {
      let phlebId = id;
      if (!phlebId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        phlebId = user.id;
      }
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .eq('phlebotomist_id', phlebId);
      if (error) throw error;
      if (data.length > 0) {
        setWorkingHours(data);
      }
    } catch (error) {
      toast({
        title: 'Error fetching working hours',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleTimeChange = (dayIndex, field, value) => {
    const newHours = [...workingHours];
    newHours[dayIndex] = {
      ...newHours[dayIndex],
      [field]: value,
    };
    setWorkingHours(newHours);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let phlebId = id;
      if (!phlebId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        phlebId = user.id;
      }
      // Delete existing hours
      const { error: deleteError } = await supabase
        .from('working_hours')
        .delete()
        .eq('phlebotomist_id', phlebId);
      if (deleteError) throw deleteError;
      // Insert new hours
      const { error: insertError } = await supabase
        .from('working_hours')
        .insert(
          workingHours.map((hours) => ({
            ...hours,
            phlebotomist_id: phlebId,
          }))
        );
      if (insertError) throw insertError;
      toast({
        title: 'Working hours updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      handleClose();
    } catch (error) {
      toast({
        title: 'Error updating working hours',
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
    <Modal isOpen={true} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Set Working Hours</ModalHeader>
        <ModalCloseButton onClick={handleClose} />
        <ModalBody pb={6}>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              {DAYS_OF_WEEK.map((day, index) => (
                <Box key={day} width="100%">
                  <Text fontWeight="medium" mb={2}>
                    {day}
                  </Text>
                  <HStack spacing={4}>
                    <FormControl>
                      <FormLabel>Start Time</FormLabel>
                      <Input
                        type="time"
                        value={workingHours[index].start_time}
                        onChange={(e) =>
                          handleTimeChange(index, 'start_time', e.target.value)
                        }
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>End Time</FormLabel>
                      <Input
                        type="time"
                        value={workingHours[index].end_time}
                        onChange={(e) =>
                          handleTimeChange(index, 'end_time', e.target.value)
                        }
                      />
                    </FormControl>
                  </HStack>
                  {index < DAYS_OF_WEEK.length - 1 && <Divider my={4} />}
                </Box>
              ))}

              <Button
                type="submit"
                colorScheme="blue"
                width="100%"
                isLoading={loading}
                loadingText="Saving..."
              >
                Save Working Hours
              </Button>
            </VStack>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WorkingHoursForm; 