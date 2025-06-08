import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Button,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Divider,
} from '@chakra-ui/react';
import { StarIcon, TimeIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import BookingForm from './BookingForm';

const PhlebotomistProfile = () => {
  const [phlebotomist, setPhlebotomist] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const toast = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPhlebotomistDetails();
    fetchReviews();
  }, [id]);

  const fetchPhlebotomistDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('phlebotomist_profiles')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          ),
          working_hours (*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPhlebotomist(data);
    } catch (error) {
      toast({
        title: 'Error fetching phlebotomist details',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          appointments (
            patient_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('appointments.phlebotomist_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data);
    } catch (error) {
      toast({
        title: 'Error fetching reviews',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <Box p={4}>Loading...</Box>;
  }

  if (!phlebotomist) {
    return <Box p={4}>Phlebotomist not found</Box>;
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <HStack spacing={6}>
          <Image
            src={phlebotomist.profiles.avatar_url || 'https://via.placeholder.com/150'}
            alt={phlebotomist.profiles.full_name}
            boxSize="150px"
            borderRadius="full"
          />
          <VStack align="start" spacing={2}>
            <Text fontSize="2xl" fontWeight="bold">
              {phlebotomist.profiles.full_name}
            </Text>
            <HStack>
              <StarIcon color="yellow.400" />
              <Text>{phlebotomist.rating.toFixed(1)}</Text>
              <Badge colorScheme="green">${phlebotomist.hourly_rate}/hr</Badge>
            </HStack>
            <Text>{phlebotomist.bio}</Text>
            <HStack>
              <Button
                leftIcon={<TimeIcon />}
                colorScheme="blue"
                onClick={() => setShowBookingForm(true)}
              >
                Book Appointment
              </Button>
              <Button leftIcon={<PhoneIcon />} variant="outline">
                Contact
              </Button>
            </HStack>
          </VStack>
        </HStack>

        <Divider />

        {/* Tabs Section */}
        <Tabs>
          <TabList>
            <Tab>About</Tab>
            <Tab>Reviews</Tab>
            <Tab>Availability</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack align="start" spacing={4}>
                <Text fontWeight="bold">Services Offered</Text>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem>
                    <Text>• Blood Draw</Text>
                    <Text>• Lab Test Collection</Text>
                    <Text>• Mobile Phlebotomy</Text>
                  </GridItem>
                  <GridItem>
                    <Text>• Home Visits</Text>
                    <Text>• Corporate Services</Text>
                    <Text>• Specialized Testing</Text>
                  </GridItem>
                </Grid>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {reviews.map((review) => (
                  <Box
                    key={review.id}
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                  >
                    <HStack>
                      <StarIcon color="yellow.400" />
                      <Text fontWeight="bold">{review.rating}/5</Text>
                      <Text color="gray.500">
                        by {review.appointments.profiles.full_name}
                      </Text>
                    </HStack>
                    <Text mt={2}>{review.comment}</Text>
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack align="start" spacing={4}>
                <Text fontWeight="bold">Working Hours</Text>
                {phlebotomist.working_hours.map((hours) => (
                  <HStack key={hours.id}>
                    <Text fontWeight="medium">
                      {new Date(0, 0, hours.day_of_week).toLocaleDateString('en-US', {
                        weekday: 'long',
                      })}
                      :
                    </Text>
                    <Text>
                      {new Date(`2000-01-01T${hours.start_time}`).toLocaleTimeString()} -{' '}
                      {new Date(`2000-01-01T${hours.end_time}`).toLocaleTimeString()}
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {showBookingForm && (
        <BookingForm
          phlebotomist={phlebotomist}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </Box>
  );
};

export default PhlebotomistProfile; 