import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Button,
  useToast,
  Heading,
  Text,
  Select,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Alert,
  AlertIcon,
  CloseButton,
  useBreakpointValue,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { SearchIcon, AttachmentIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';
import { FaCloudUploadAlt } from 'react-icons/fa';

function SubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [topLabs, setTopLabs] = useState([]);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [labs, setLabs] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedLabId, setSelectedLabId] = useState('');
  const [updatingLab, setUpdatingLab] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchSubmissions();
    fetchLabs();
  }, []);

  useEffect(() => {
    // Filter out submissions with unknown phlebotomist
    const validSubmissions = submissions.filter(sub => sub.phlebotomist_name && sub.phlebotomist_name !== 'Unknown' && sub.phlebotomist_name.trim() !== '');
    // Calculate top labs by submission count
    const labCounts = {};
    validSubmissions.forEach(sub => {
      const name = sub.phlebotomist_name;
      labCounts[name] = (labCounts[name] || 0) + 1;
    });
    const sortedLabs = Object.entries(labCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    setTopLabs(sortedLabs);
  }, [submissions]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching submissions',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLabs = async () => {
    const { data, error } = await supabase
      .from('labs')
      .select('id, name');
    if (!error) setLabs(data || []);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setSubmissions(submissions.map(sub => 
        sub.id === id ? { ...sub, status: newStatus } : sub
      ));

      toast({
        title: 'Status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error updating status',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleFedexLabelUpload = async (submissionId, file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `fedex-labels/${submissionId}.${fileExt}`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from('fedex-labels').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    // Get public URL
    const { data: urlData } = supabase.storage.from('fedex-labels').getPublicUrl(filePath);
    const labelUrl = urlData.publicUrl;
    // Update submission record
    const { error: updateError } = await supabase.from('submissions').update({ fedex_label_url: labelUrl }).eq('id', submissionId);
    if (updateError) {
      toast({ title: 'Error saving label URL', description: updateError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    setSubmissions(submissions.map(sub => sub.id === submissionId ? { ...sub, fedex_label_url: labelUrl } : sub));
    toast({ title: 'FedEx label uploaded', status: 'success', duration: 3000, isClosable: true });
  };

  const handleLabResultsUpload = async (submissionId, file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `lab-results/${submissionId}.${fileExt}`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from('lab-results').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    // Get public URL
    const { data: urlData } = supabase.storage.from('lab-results').getPublicUrl(filePath);
    const resultsUrl = urlData.publicUrl;
    // Update submission record
    const { error: updateError } = await supabase.from('submissions').update({ lab_results_url: resultsUrl }).eq('id', submissionId);
    if (updateError) {
      toast({ title: 'Error saving lab results URL', description: updateError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    setSubmissions(submissions.map(sub => sub.id === submissionId ? { ...sub, lab_results_url: resultsUrl } : sub));
    toast({ title: 'Lab results uploaded', status: 'success', duration: 3000, isClosable: true });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'yellow';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getLabName = (lab_id) => {
    const lab = labs.find(l => l.id === lab_id);
    return lab ? lab.name : 'Unknown';
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = searchTerm === '' || 
      (submission.patient_name && submission.patient_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (submission.phlebotomist_name && submission.phlebotomist_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const waitingForFedex = submissions.filter(sub => sub.need_fedex_label && !sub.fedex_label_url);

  // Filter out submissions with unknown phlebotomist
  const validSubmissions = submissions.filter(sub => sub.phlebotomist_name && sub.phlebotomist_name !== 'Unknown' && sub.phlebotomist_name.trim() !== '');

  const handleLabChange = (submission) => {
    setSelectedSubmission(submission);
    setSelectedLabId(submission.lab_id || '');
    onOpen();
  };

  const handleUpdateLab = async () => {
    if (!selectedSubmission || !selectedLabId) return;
    
    setUpdatingLab(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ lab_id: selectedLabId })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id ? { ...sub, lab_id: selectedLabId } : sub
      ));

      toast({
        title: 'Lab updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error updating lab',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUpdatingLab(false);
    }
  };

  const getFileCount = (submission) => {
    let count = 0;
    if (Array.isArray(submission.script_image)) count += submission.script_image.filter(Boolean).length;
    if (Array.isArray(submission.insurance_card_image)) count += submission.insurance_card_image.filter(Boolean).length;
    if (Array.isArray(submission.patient_id_image)) count += submission.patient_id_image.filter(Boolean).length;
    return count;
  };

  if (loading) {
    return <Text>Loading submissions...</Text>;
  }

  return (
    <Box w="100vw" maxW="100vw" px={0} py={2} overflowX="auto" bg="white">
      <Heading mb={2} size="md" textAlign="left">Submissions</Heading>
      {/* Scoreboard for top mobile labs */}
      <Box mb={4} p={3} bg="gray.100" borderRadius="lg" boxShadow="sm" maxW="100%">
        <Heading size="sm" mb={2}>Top Mobile Labs (by Draws Submitted)</Heading>
        <Box
          display={{ base: 'flex', md: 'grid' }}
          flexWrap={{ base: 'nowrap', md: 'wrap' }}
          overflowX={{ base: 'auto', md: 'visible' }}
          gridTemplateColumns={{ md: 'repeat(3, 1fr)' }}
          gap={4}
          alignItems="center"
          pb={{ base: 2, md: 0 }}
        >
          {topLabs.length === 0 ? (
            <Box color="gray.500">No submissions yet.</Box>
          ) : (
            topLabs.map(([name, count], idx) => (
              <Box key={name} minW={{ base: '220px', md: '180px' }} maxW="240px" px={4} py={2} bg="white" borderRadius="md" boxShadow="xs" fontWeight="bold" fontSize="lg" border="1px solid #e0e0e0" textAlign="center">
                <Box color="blue.600" fontSize="xl">#{idx + 1}</Box>
                <Box>{name}</Box>
                <Box color="green.600" fontSize="2xl">{count}</Box>
                <Box fontSize="sm" color="gray.500">draws</Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
      {/* Card List for Submissions */}
      <VStack spacing={4} align="stretch" w="100%">
        {filteredSubmissions.map((submission, idx) => {
          const expanded = expandedId === submission.id;
          const fileCount = getFileCount(submission);
          return (
            <Box
              key={submission.id}
              borderWidth={1}
              borderRadius="lg"
              boxShadow="sm"
              bg={expanded ? 'blue.50' : idx % 2 === 0 ? 'white' : 'gray.100'}
              p={4}
              transition="background 0.2s"
              cursor="pointer"
              onClick={() => setExpandedId(expanded ? null : submission.id)}
              _hover={{ bg: 'blue.100' }}
              w="100%"
              maxW="100vw"
            >
              {/* Collapsed view: key fields only */}
              <HStack justify="space-between" align="center" w="100%" spacing={2}>
                <Box textAlign="center" flex={1} fontWeight="bold">{new Date(submission.submitted_at).toLocaleDateString()}</Box>
                <Box textAlign="center" flex={1}>{submission.patient_name || 'N/A'}</Box>
                <Badge textAlign="center" flex={1} colorScheme={submission.status === 'completed' ? 'green' : submission.status === 'cancelled' ? 'red' : 'yellow'} fontSize="lg">{submission.status}</Badge>
                <Box textAlign="center" flex={1}>{getLabName(submission.lab_id)}</Box>
                <Badge textAlign="center" flex={1} colorScheme={submission.created_by_user === 'LAB' ? 'blue' : 'green'} fontSize="lg">{submission.created_by_user || 'LAB'}</Badge>
                <Box flex={1} display="flex" justifyContent="center" alignItems="center">
                  <Box bg="blue.600" color="white" borderRadius="full" fontSize="2xl" fontWeight="bold" w="48px" h="48px" display="flex" alignItems="center" justifyContent="center">{fileCount}</Box>
                </Box>
                <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setExpandedId(expanded ? null : submission.id); }}>
                  {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                </Button>
              </HStack>
              {/* Expanded view: all details and actions */}
              {expanded && (
                <Box mt={4}>
                  <Text><b>Draw ID:</b> {submission.draw_code || submission.id}</Text>
                  <Text><b>Phlebotomist:</b> {submission.phlebotomist_name || 'N/A'}</Text>
                  <Text><b>Doctor:</b> {submission.doctor_name || 'N/A'}</Text>
                  <Text><b>Insurance Company:</b> {submission.insurance_company || 'N/A'}</Text>
                  <Text><b>Special Instructions:</b> {submission.special_instructions || 'N/A'}</Text>
                  <Text><b>FedEx:</b> {submission.need_fedex_label ? (submission.fedex_label_url ? <Button as="a" href={submission.fedex_label_url} download target="_blank" size="sm" colorScheme="blue">View</Button> : 'Waiting for label') : 'No'}</Text>
                  <Text><b>Lab Results:</b> {submission.lab_results_url ? <Button as="a" href={submission.lab_results_url} download target="_blank" size="sm" colorScheme="green">Download</Button> : 'Not uploaded'}</Text>
                  <Text><b>Insurance Card:</b> {Array.isArray(submission.insurance_card_image) && submission.insurance_card_image.length > 0 && submission.insurance_card_image[0] ? <Button as="a" href={submission.insurance_card_image[0]} download target="_blank" size="sm" colorScheme="blue">View</Button> : 'No file'}</Text>
                  <Text><b>Patient ID:</b> {Array.isArray(submission.patient_id_image) && submission.patient_id_image.length > 0 && submission.patient_id_image[0] ? <Button as="a" href={submission.patient_id_image[0]} download target="_blank" size="sm" colorScheme="blue">View</Button> : 'No file'}</Text>
                  <Text><b>Deleted:</b> {submission.deleted_by_lab ? <Badge colorScheme="red">DELETED BY LAB</Badge> : ''}</Text>
                  <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                    <Button as={RouterLink} to={`/admin/submissions/${submission.id}`} colorScheme="blue" size="sm">Edit/View</Button>
                    <Button size="sm" colorScheme="blue" variant="outline" onClick={e => { e.stopPropagation(); handleLabChange(submission); }}>Change Lab</Button>
                    <Select
                      value={submission.status}
                      onChange={e => { e.stopPropagation(); handleStatusChange(submission.id, e.target.value); }}
                      size="sm"
                      maxW="120px"
                      fontWeight="bold"
                      minW="100px"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Select>
                  </Box>
                </Box>
              )}
            </Box>
          );
        })}
      </VStack>

      {/* Lab Change Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Lab for Submission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb={4}>
              Change the lab for submission: <strong>{selectedSubmission?.patient_name || 'Unknown'}</strong>
            </Text>
            <Select
              value={selectedLabId}
              onChange={(e) => setSelectedLabId(e.target.value)}
              placeholder="Select a lab"
            >
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </Select>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleUpdateLab}
              isLoading={updatingLab}
              isDisabled={!selectedLabId}
            >
              Update Lab
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default SubmissionsList; 