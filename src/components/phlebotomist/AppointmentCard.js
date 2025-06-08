import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Button,
  useToast,
  Collapse,
  IconButton,
  Link,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';

const AppointmentCard = ({ appointment, onAccept, onReject, onStatusChange, readOnly }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const getStatusColor = (status) => {
    const colors = {
      pending: 'yellow',
      accepted: 'blue',
      rejected: 'red',
      in_progress: 'purple',
      completed: 'green',
      missed: 'gray',
    };
    return colors[status] || 'gray';
  };

  const handleChat = async () => {
    try {
      const { data: thread, error } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('appointment_id', appointment.id)
        .single();

      if (error) throw error;

      // Navigate to chat
      window.location.href = `/chat/${thread.id}`;
    } catch (error) {
      toast({
        title: 'Error opening chat',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      _hover={{ shadow: 'md' }}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <HStack spacing={4}>
            <Image
              src={appointment.profiles.avatar_url || 'https://via.placeholder.com/50'}
              alt={appointment.profiles.full_name}
              boxSize="50px"
              borderRadius="full"
            />
            <VStack align="start" spacing={0}>
              <Text fontWeight="bold">{appointment.profiles.full_name}</Text>
              <Text fontSize="sm" color="gray.500">
                {new Date(appointment.appointment_date).toLocaleDateString()} at{' '}
                {appointment.start_time}
              </Text>
            </VStack>
          </HStack>
          <HStack>
            <Badge colorScheme={getStatusColor(appointment.status)}>
              {appointment.status.replace('_', ' ')}
            </Badge>
            <IconButton
              icon={showDetails ? <ChevronUpIcon /> : <ChevronDownIcon />}
              onClick={() => setShowDetails(!showDetails)}
              variant="ghost"
            />
          </HStack>
        </HStack>

        <Collapse in={showDetails}>
          <VStack align="stretch" spacing={3} pt={3}>
            <Box>
              <Text fontWeight="medium">Address</Text>
              <Text>{appointment.patient_address}</Text>
            </Box>

            <Box>
              <Text fontWeight="medium">Test Details</Text>
              <Text>{appointment.test_details.testDetails}</Text>
              <Text fontSize="sm" color="gray.500">
                Doctor: {appointment.test_details.doctorName}
              </Text>
            </Box>

            {appointment.insurance_info && (
              <Box>
                <Text fontWeight="medium">Insurance</Text>
                <Text>
                  {appointment.insurance_info.provider} -{' '}
                  {appointment.insurance_info.number}
                </Text>
              </Box>
            )}

            <HStack spacing={4}>
              <Button
                leftIcon={<PhoneIcon />}
                size="sm"
                variant="outline"
                as={Link}
                href={`tel:${appointment.profiles.phone}`}
              >
                Call
              </Button>
              <Button
                leftIcon={<EmailIcon />}
                size="sm"
                variant="outline"
                as={Link}
                href={`mailto:${appointment.profiles.email}`}
              >
                Email
              </Button>
              <Button
                size="sm"
                colorScheme="blue"
                onClick={handleChat}
              >
                Chat
              </Button>
            </HStack>

            {!readOnly && (
              <HStack spacing={4}>
                {appointment.status === 'pending' && (
                  <>
                    <Button
                      colorScheme="green"
                      size="sm"
                      onClick={onAccept}
                      isLoading={loading}
                    >
                      Accept
                    </Button>
                    <Button
                      colorScheme="red"
                      size="sm"
                      onClick={onReject}
                      isLoading={loading}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {appointment.status === 'accepted' && (
                  <Button
                    colorScheme="purple"
                    size="sm"
                    onClick={() => onStatusChange('in_progress')}
                    isLoading={loading}
                  >
                    Start Visit
                  </Button>
                )}

                {appointment.status === 'in_progress' && (
                  <Button
                    colorScheme="green"
                    size="sm"
                    onClick={() => onStatusChange('completed')}
                    isLoading={loading}
                  >
                    Complete Visit
                  </Button>
                )}
              </HStack>
            )}
          </VStack>
        </Collapse>
      </VStack>
    </Box>
  );
};

export default AppointmentCard; 