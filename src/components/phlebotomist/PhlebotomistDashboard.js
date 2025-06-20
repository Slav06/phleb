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
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Stack,
  Image as ChakraImage,
} from '@chakra-ui/react';
import { StarIcon, TimeIcon, PhoneIcon, EmailIcon } from '@chakra-ui/icons';
import { FaBuilding, FaClock, FaDownload, FaShare } from 'react-icons/fa';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import AppointmentCard from './AppointmentCard';
import WorkingHoursForm from './WorkingHoursForm';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import emailjs from '@emailjs/browser';

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
  const [shippedIds, setShippedIds] = useState([]);
  const [waitingIds, setWaitingIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [shippedOutModal, setShippedOutModal] = useState({ open: false, submissionId: null });
  const [shippedOutImage, setShippedOutImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [emailModal, setEmailModal] = useState({ open: false, submission: null });
  const [patientEmail, setPatientEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCompanyInfo();
      fetchAppointments();
      fetchPatientDraws();
      fetchPastSubmissions();
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
    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          deleted_by_lab: true,
          deleted_at: new Date().toISOString(),
          deleted_by: id // assuming 'id' is the current lab's id
        })
        .eq('id', submissionId);
      if (error) throw error;
      setPastSubmissions(pastSubmissions.filter(sub => sub.id !== submissionId));
      toast({ title: 'Submission marked as deleted', status: 'success', duration: 3000, isClosable: true });
    } catch (error) {
      toast({ title: 'Error deleting submission', description: error.message, status: 'error', duration: 5000, isClosable: true });
    }
  };

  const openShippedOutModal = (submissionId) => {
    setShippedOutModal({ open: true, submissionId });
    setShippedOutImage(null);
  };

  const closeShippedOutModal = () => {
    setShippedOutModal({ open: false, submissionId: null });
    setShippedOutImage(null);
  };

  const handleShippedOut = async (submissionId, imageFile = null) => {
    try {
      setUploading(true);
      let imageUrl = null;
      if (imageFile) {
        // Upload image to Supabase Storage
        const fileExt = imageFile.name.split('.').pop();
        const filePath = `shipped_out/${submissionId}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('submission-files').upload(filePath, imageFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('submission-files').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      const { error } = await supabase
        .from('submissions')
        .update({ status: 'waiting_to_be_received', shipped_out: true, shipped_out_at: new Date().toISOString(), shipped_out_image_url: imageUrl })
        .eq('id', submissionId);
      if (error) throw error;
      setShippedIds(prev => [...prev, submissionId]);
      // Update local state
      setPastSubmissions(prev => prev.map(sub => sub.id === submissionId ? { ...sub, status: 'waiting_to_be_received', shipped_out: true, shipped_out_at: new Date().toISOString(), shipped_out_image_url: imageUrl } : sub));
      toast({ title: 'Marked as shipped out', status: 'success', duration: 2000, isClosable: true });
      closeShippedOutModal();
    } catch (error) {
      toast({ title: 'Error marking as shipped', description: error.message, status: 'error', duration: 4000, isClosable: true });
    } finally {
      setUploading(false);
    }
  };

  // Group draws by status
  const newRequests = patientDraws.filter(draw => draw.status === 'new_request');
  const upcoming = patientDraws.filter(draw => !draw.status || draw.status === 'upcoming' || draw.status === 'new_request');

  // Replace the simulated email function with actual Gmail integration
  const sendLabResultsEmail = async (submission, email) => {
    setSendingEmail(true);
    try {
      // Update submission with email if it was missing
      if (!submission.patient_email && email) {
        await supabase
          .from('submissions')
          .update({ patient_email: email })
          .eq('id', submission.id);
      }
      
      // EmailJS configuration using environment variables
      const serviceId = process.env.REACT_APP_EMAILJS_SERVICE_ID || 'service_i6nlpgd';
      const templateId = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || 'template_lab_results';  
      const publicKey = process.env.REACT_APP_EMAILJS_PUBLIC_KEY || 'BLR6XLz1LfrhTjxOo';
      
      // Email template parameters
      const templateParams = {
        to_email: email,
        to_name: submission.patient_name || 'Patient',
        patient_name: submission.patient_name || 'Patient',
        lab_name: companyInfo?.company_name || 'Lab',
        contact_person: companyInfo?.full_name || 'Lab Staff',
        contact_email: companyInfo?.email || '',
        contact_phone: companyInfo?.phone || '',
        lab_results_url: submission.lab_results_url,
        submission_date: submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A',
        message: `Dear ${submission.patient_name || 'Patient'},

Your lab results are now available. You can download them using the link below:

${submission.lab_results_url}

If you have any questions about your results, please contact your healthcare provider or reach out to us.

Best regards,
${companyInfo?.company_name || 'Lab Team'}
${companyInfo?.full_name || ''}
${companyInfo?.email || ''}
${companyInfo?.phone || ''}`
      };
      
      // Send email via EmailJS
      const response = await emailjs.send(
        serviceId,
        templateId, 
        templateParams,
        publicKey
      );
      
      if (response.status === 200) {
        toast({
          title: 'Lab results sent successfully',
          description: `Results sent to ${email}`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        setEmailModal({ open: false, submission: null });
        setPatientEmail('');
      } else {
        throw new Error('Failed to send email');
      }
      
    } catch (error) {
      console.error('Email sending error:', error);
      toast({
        title: 'Error sending email',
        description: error.text || error.message || 'Failed to send email. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const openEmailModal = (submission) => {
    setEmailModal({ open: true, submission });
    setPatientEmail(submission.patient_email || '');
  };

  const closeEmailModal = () => {
    setEmailModal({ open: false, submission: null });
    setPatientEmail('');
  };

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
        {/* Grouped Submissions by Status */}
        {['pending', 'waiting_to_be_received', 'waiting_on_lab_results', 'in_progress', 'completed', 'cancelled'].map(status => {
          const group = pastSubmissions.filter(sub => (sub.status || 'pending').toLowerCase() === status);
          if (group.length === 0) return null;
          return (
            <Box key={status} mb={4}>
              <Text fontSize="xl" fontWeight="bold" color={
                status === 'pending' ? 'yellow.600' :
                status === 'waiting_to_be_received' ? 'purple.600' :
                status === 'waiting_on_lab_results' ? 'orange.500' :
                status === 'in_progress' ? 'blue.600' :
                status === 'completed' ? 'green.600' :
                status === 'cancelled' ? 'red.600' : 'gray.700'
              } mb={2}>
                {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Text>
              <VStack spacing={3} align="stretch">
                {group.map(submission => {
                  const isShipped = submission.shipped_out || shippedIds.includes(submission.id);
                  const isExpanded = expandedId === submission.id;
                  return (
                    <Box
                      key={submission.id}
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      bg="gray.50"
                      mb={2}
                      cursor="pointer"
                      boxShadow={isExpanded ? 'lg' : 'sm'}
                      onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                      transition="box-shadow 0.2s"
                    >
                      <HStack justify="space-between" align="start">
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="bold">{submission.patient_name || 'Unknown Patient'}</Text>
                          <Text fontSize="sm" color="gray.500">Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}</Text>
                          <Text fontSize="sm" color="gray.500">Status: {submission.status || 'Pending'}</Text>
                        </VStack>
                        
                        {/* Action buttons on the right side */}
                        <VStack spacing={2} align="end">
                          {/* FedEx Label button */}
                          {status === 'pending' && submission.fedex_label_url && !isExpanded && (
                            !isShipped ? (
                              <Button
                                as="a"
                                href={submission.fedex_label_url}
                                target="_blank"
                                colorScheme="teal"
                                size="sm"
                                variant="outline"
                                leftIcon={<span role="img" aria-label="fedex">📦</span>}
                                onClick={e => {
                                  e.stopPropagation();
                                  setShippedIds(prev => [...prev, submission.id]);
                                }}
                              >
                                FedEx Label
                              </Button>
                            ) : (
                              <Button
                                colorScheme="purple"
                                size="sm"
                                variant="solid"
                                leftIcon={<span role="img" aria-label="shipped">🚚</span>}
                                onClick={e => {
                                  e.stopPropagation();
                                  openShippedOutModal(submission.id);
                                }}
                              >
                                Shipped Out
                              </Button>
                            )
                          )}
                          
                          {/* Lab Results buttons */}
                          {submission.lab_results_url && !isExpanded && (
                            <HStack spacing={1}>
                              <Button
                                as="a"
                                href={submission.lab_results_url}
                                target="_blank"
                                colorScheme="green"
                                size="sm"
                                variant="solid"
                                leftIcon={<FaDownload />}
                                onClick={e => e.stopPropagation()}
                              >
                                Results
                              </Button>
                              <Button
                                colorScheme="blue"
                                size="sm"
                                variant="outline"
                                leftIcon={<FaShare />}
                                onClick={e => {
                                  e.stopPropagation();
                                  openEmailModal(submission);
                                }}
                              >
                                Email
                              </Button>
                            </HStack>
                          )}
                        </VStack>
                      </HStack>
                      
                      {/* Rest of the expanded content... */}
                      {isExpanded && <Divider my={3} />}
                      {isExpanded && (
                        <>
                          {/* Summary info */}
                          <VStack align="start" spacing={1} mb={3}>
                            {submission.patient_email && <Text><b>Email:</b> {submission.patient_email}</Text>}
                            {submission.patient_address && <Text><b>Address:</b> {submission.patient_address}</Text>}
                            {submission.patient_dob && <Text><b>DOB:</b> {submission.patient_dob}</Text>}
                            {submission.doctor_name && <Text><b>Doctor:</b> {submission.doctor_name}</Text>}
                            {submission.doctor_email && <Text><b>Doctor Email:</b> {submission.doctor_email}</Text>}
                            {submission.doctor_phone && <Text><b>Doctor Phone:</b> {submission.doctor_phone}</Text>}
                            {submission.lab_brand && <Text><b>Lab Brand:</b> {submission.lab_brand}</Text>}
                            {submission.blood_collection_time && <Text><b>Collection Time:</b> {submission.blood_collection_time}</Text>}
                            {submission.insurance_company && <Text><b>Insurance:</b> {submission.insurance_company}</Text>}
                            {submission.insurance_policy_number && <Text><b>Policy #:</b> {submission.insurance_policy_number}</Text>}
                          </VStack>
                          
                          {/* Action buttons in expanded view */}
                          <HStack spacing={3} mb={3} flexWrap="wrap">
                            {/* Cancel button */}
                            {status === 'pending' && (
                              <Button
                                colorScheme="red"
                                size="lg"
                                variant="outline"
                                onClick={e => { e.stopPropagation(); handleDeleteSubmission(submission.id); }}
                                leftIcon={<span role="img" aria-label="cancel">✖️</span>}
                              >
                                Cancel
                              </Button>
                            )}
                            
                            {/* Lab Results buttons (expanded) */}
                            {submission.lab_results_url && (
                              <>
                                <Button
                                  as="a"
                                  href={submission.lab_results_url}
                                  target="_blank"
                                  colorScheme="green"
                                  size="lg"
                                  variant="solid"
                                  leftIcon={<FaDownload />}
                                  onClick={e => e.stopPropagation()}
                                >
                                  Download Lab Results
                                </Button>
                                <Button
                                  colorScheme="blue"
                                  size="lg"
                                  variant="outline"
                                  leftIcon={<FaShare />}
                                  onClick={e => {
                                    e.stopPropagation();
                                    openEmailModal(submission);
                                  }}
                                >
                                  Email to Patient
                                </Button>
                              </>
                            )}
                          </HStack>
                        </>
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Box>
          );
        })}
      </VStack>

      {showWorkingHoursForm && (
        <WorkingHoursForm onClose={() => setShowWorkingHoursForm(false)} />
      )}

      <Modal isOpen={shippedOutModal.open} onClose={closeShippedOutModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Attach a Picture (Optional)</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Upload a picture of the package or label (optional):</FormLabel>
              <Input type="file" accept="image/*" onChange={e => setShippedOutImage(e.target.files[0])} />
              {shippedOutImage && (
                <ChakraImage src={URL.createObjectURL(shippedOutImage)} alt="Preview" mt={3} maxH="200px" borderRadius="md" />
              )}
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => handleShippedOut(shippedOutModal.submissionId, shippedOutImage)} colorScheme="purple" mr={3} isLoading={uploading}>
              Submit
            </Button>
            <Button onClick={() => handleShippedOut(shippedOutModal.submissionId, null)} variant="ghost" isLoading={uploading}>
              Skip
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={emailModal.open} onClose={closeEmailModal} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Lab Results to Patient</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>Send lab results for: <strong>{emailModal.submission?.patient_name}</strong></Text>
              <FormControl isRequired>
                <FormLabel>Patient Email</FormLabel>
                <Input
                  type="email"
                  value={patientEmail}
                  onChange={e => setPatientEmail(e.target.value)}
                  placeholder="Enter patient's email address"
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={() => sendLabResultsEmail(emailModal.submission, patientEmail)}
              isLoading={sendingEmail}
              isDisabled={!patientEmail}
            >
              Send Email
            </Button>
            <Button variant="ghost" onClick={closeEmailModal}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PhlebotomistDashboard; 