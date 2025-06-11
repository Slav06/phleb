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
  Flex,
  Icon,
  Link as ChakraLink,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
} from '@chakra-ui/react';
import { StarIcon, TimeIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { FaBuilding, FaClock } from 'react-icons/fa';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AppointmentCard from './AppointmentCard';
import WorkingHoursForm from './WorkingHoursForm';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';

const PhlebotomistDashboard = () => {
  const [appointments, setAppointments] = useState({
    new: [],
    upcoming: [],
    past: [],
  });
  const [loading, setLoading] = useState(true);
  const [showWorkingHoursForm, setShowWorkingHoursForm] = useState(false);
  const [companyInfo, setCompanyInfo] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const [patientDraws, setPatientDraws] = useState([]);
  const [pastSubmissions, setPastSubmissions] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sigPad, setSigPad] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [title, setTitle] = useState('');
  const [signDate, setSignDate] = useState('');
  const [agreementSigned, setAgreementSigned] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompanyInfo();
      fetchAppointments();
      fetchPatientDraws();
      fetchPastSubmissions();
    }
    if (typeof window !== 'undefined' && localStorage.getItem('agreement_signed') !== 'true') {
      navigate(`/lab/${id}/agreement`);
    }
    // eslint-disable-next-line
  }, [id, navigate]);

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('phlebotomist_profiles')
        .select('company_name, company_address, full_name, email, phone')
        .eq('id', id)
        .single();
      if (error) throw error;
      setCompanyInfo(data);
    } catch (error) {
      setCompanyInfo(null);
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('phlebotomist_id', id)
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

  const fetchPatientDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('upcoming_draws')
        .select('*')
        .eq('lab_id', id)
        .order('created_at', { ascending: false });
      if (!error) setPatientDraws(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching patient draws',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchPastSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('phlebotomist_id', id)
      .order('submitted_at', { ascending: false });
    if (!error) setPastSubmissions(data || []);
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

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Are you sure you want to delete this incomplete draw?')) return;
    const { error } = await supabase.from('submissions').delete().eq('id', submissionId);
    if (!error) setPastSubmissions(pastSubmissions.filter(s => s.id !== submissionId));
  };

  // Group draws by status
  const newRequests = patientDraws.filter(draw => draw.status === 'new_request');
  const upcoming = patientDraws.filter(draw => !draw.status || draw.status === 'upcoming' || draw.status === 'new_request');

  return (
    <Box p={2} maxW="600px" mx="auto">
      {/* QLS Logo at the top */}
      <Flex justify="center" align="center" mb={4} mt={2}>
        <Image src="/qls-logo.png" alt="Quality Laboratory Service Logo" maxH="70px" mx="auto" mb={2} />
      </Flex>
      <VStack spacing={6} align="stretch">
        {/* Company Info at the top */}
        {companyInfo && (
          <Box bg="blue.50" borderRadius="lg" p={4} mb={2} boxShadow="sm">
            <Flex align="center" justify="space-between" mb={2}>
              <HStack>
                <Icon as={FaBuilding} color="blue.500" boxSize={6} mr={2} />
                <Text fontSize="xl" fontWeight="bold">
                  {companyInfo.company_name || 'Mobile Lab'}
                </Text>
              </HStack>
              <ChakraLink
                as={RouterLink}
                to={`/lab/${id}/working-hours`}
                color="blue.600"
                fontWeight="semibold"
                fontSize="md"
                display="flex"
                alignItems="center"
              >
                <Icon as={FaClock} mr={1} /> Working Hours
              </ChakraLink>
            </Flex>
            <Text color="gray.600" fontSize="md">{companyInfo.company_address}</Text>
            <Text color="gray.500" fontSize="sm">Contact: {companyInfo.full_name} | {companyInfo.email} | {companyInfo.phone}</Text>
          </Box>
        )}
        {/* Large New Blood Draw button */}
        <Button
          colorScheme="blue"
          size="lg"
          width="100%"
          fontSize="xl"
          py={8}
          borderRadius="xl"
          boxShadow="md"
          onClick={() => navigate(`/lab/${id}/new-blood-draw`)}
        >
          + New Blood Draw
        </Button>
        {/* Dashboard tabs and content */}
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            Dashboard
          </Text>
        </HStack>
        <Tabs variant="unstyled" colorScheme="blue">
          <TabList>
            <Tab>New Requests</Tab>
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
                {appointments.past.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    readOnly
                  />
                ))}
                {/* Show past submissions summary links */}
                {pastSubmissions.map((submission) => (
                  <Box key={submission.id} p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Text fontWeight="bold">{submission.patient_name || 'Unknown Patient'}</Text>
                        <Text fontSize="sm" color="gray.500">Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}</Text>
                        {submission.status !== 'completed' && (
                          <Text color="orange.500" fontWeight="semibold">Incomplete</Text>
                        )}
                      </VStack>
                      <HStack>
                        <Button as={RouterLink} to={`/lab/${id}/summary/${submission.id}`} colorScheme="blue" size="sm">View Summary</Button>
                        {submission.status !== 'completed' && (
                          <Button colorScheme="red" size="sm" variant="outline" onClick={() => handleDeleteSubmission(submission.id)}>Delete</Button>
                        )}
                      </HStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        {/* New Requests and Upcoming sections below dashboard tabs */}
        {newRequests.length > 0 && (
          <Box mb={2} p={4} bg="yellow.50" borderRadius="md" boxShadow="sm">
            <Text fontWeight="bold" mb={2}>New Requests</Text>
            <VStack align="start" spacing={2}>
              {newRequests.map(draw => (
                <HStack key={draw.id}>
                  <Text>{draw.patient_email}</Text>
                  <Button as="a" href={`/lab/${id}/patient/${encodeURIComponent(draw.patient_email)}`} size="sm" colorScheme="blue" target="_blank">Open Form</Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
        {upcoming.length > 0 && (
          <Box mb={4} p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
            <Text fontWeight="bold" mb={2}>Upcoming</Text>
            <VStack align="start" spacing={2}>
              {upcoming.map(draw => (
                <HStack key={draw.id} spacing={3}>
                  <Text>{draw.patient_email}</Text>
                  <Button as="a" href={`/lab/${id}/new-blood-draw?email=${encodeURIComponent(draw.patient_email)}`} size="sm" colorScheme="blue" variant="outline" borderRadius="md" target="_blank">Finish Draw File</Button>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    borderRadius="md"
                    onClick={() => {
                      const link = `${window.location.origin}/lab/${id}/patient/${encodeURIComponent(draw.patient_email)}`;
                      navigator.clipboard.writeText(link);
                      toast({
                        title: 'Link copied!',
                        description: 'Patient form link copied to clipboard. You can now share it.',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                      });
                    }}
                  >
                    Share Patient Form Link
                  </Button>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>

      {showWorkingHoursForm && (
        <WorkingHoursForm onClose={() => setShowWorkingHoursForm(false)} />
      )}
    </Box>
  );
};

export default PhlebotomistDashboard; 