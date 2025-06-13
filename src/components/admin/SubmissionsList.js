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
} from '@chakra-ui/react';
import { SearchIcon, AttachmentIcon } from '@chakra-ui/icons';
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

  useEffect(() => {
    fetchSubmissions();
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

  if (loading) {
    return <Text>Loading submissions...</Text>;
  }

  return (
    <Box w="100vw" maxW="100vw" px={0} py={2} overflowX="auto" bg="white">
      <Heading mb={2} size="md" textAlign="left">Submissions</Heading>
      {/* Scoreboard for top mobile labs */}
      <Box mb={4} p={3} bg="gray.100" borderRadius="lg" boxShadow="sm" maxW="100%">
        <Heading size="sm" mb={2}>Top Mobile Labs (by Draws Submitted)</Heading>
        <Box display="flex" flexWrap="wrap" gap={4} alignItems="center">
          {topLabs.length === 0 ? (
            <Box color="gray.500">No submissions yet.</Box>
          ) : (
            topLabs.map(([name, count], idx) => (
              <Box key={name} px={4} py={2} bg="white" borderRadius="md" boxShadow="xs" fontWeight="bold" fontSize="lg" border="1px solid #e0e0e0" minW="180px" textAlign="center">
                <Box color="blue.600" fontSize="xl">#{idx + 1}</Box>
                <Box>{name}</Box>
                <Box color="green.600" fontSize="2xl">{count}</Box>
                <Box fontSize="sm" color="gray.500">draws</Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
      {/* Desktop Table */}
      <Table variant="unstyled" size="sm" width="100%" style={{ tableLayout: 'auto', borderCollapse: 'collapse' }}>
        <Thead>
          <Tr bg="blue.700">
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Date</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Draw ID</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Patient</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Patient ID</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Phlebotomist</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Status</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">FedEx</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Lab Results</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Insurance Card</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Patient ID File</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Deleted</Th>
            <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {validSubmissions.map((submission, idx) => (
            <Tr key={submission.id}
              bg={idx % 2 === 0 ? 'white' : 'gray.100'}
              _hover={{ bg: 'blue.50' }}
            >
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{new Date(submission.submitted_at).toLocaleDateString()}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{submission.id}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{submission.patient_name || 'N/A'}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{submission.patient_id_url ? (<Button as="a" href={submission.patient_id_url} target="_blank" leftIcon={<AttachmentIcon />} size="md" colorScheme="blue" variant="outline" px={2} py={0.5} fontWeight="bold">View</Button>) : (<Text color="gray.400">No file</Text>)}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{submission.phlebotomist_name || 'N/A'}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center" bg={
                submission.status === 'completed'
                  ? 'green.300'
                  : submission.status === 'cancelled'
                  ? 'red.400'
                  : 'yellow.300'
              } color={
                submission.status === 'cancelled' ? 'white' : 'black'
              }>
                <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="xl">
                  {submission.status}
                </Box>
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                {submission.need_fedex_label ? (
                  submission.fedex_label_url ? (
                    <Button
                      as="a"
                      href={submission.fedex_label_url}
                      target="_blank"
                      leftIcon={<AttachmentIcon />}
                      size="md"
                      colorScheme="blue"
                      variant="outline"
                      px={2}
                      py={0.5}
                      fontWeight="bold"
                    >
                      View
                    </Button>
                  ) : (
                    <>
                      <Input
                        type="file"
                        accept="application/pdf,image/*"
                        size="md"
                        py={0.5}
                        fontWeight="bold"
                        onChange={e => handleFedexLabelUpload(submission.id, e.target.files[0])}
                      />
                      <Box mt={2} p={3} bg="yellow.100" color="orange.800" fontWeight="bold" borderRadius="md" fontSize="lg" textAlign="center">
                        Waiting for FedEx label upload!
                      </Box>
                    </>
                  )
                ) : null}
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                {submission.lab_results_url ? (
                  <Button
                    as="a"
                    href={submission.lab_results_url}
                    target="_blank"
                    leftIcon={<AttachmentIcon />}
                    size="md"
                    colorScheme="green"
                    variant="outline"
                    px={2}
                    py={0.5}
                    fontWeight="bold"
                  >
                    Download
                  </Button>
                ) : (
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    size="md"
                    py={0.5}
                    fontWeight="bold"
                    onChange={e => handleLabResultsUpload(submission.id, e.target.files[0])}
                  />
                )}
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{submission.insurance_card_url ? (<Button as="a" href={submission.insurance_card_url} target="_blank" leftIcon={<AttachmentIcon />} size="md" colorScheme="blue" variant="outline" px={2} py={0.5} fontWeight="bold">View</Button>) : (<Text color="gray.400">No file</Text>)}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{submission.patient_id_url ? (<Button as="a" href={submission.patient_id_url} target="_blank" leftIcon={<AttachmentIcon />} size="md" colorScheme="blue" variant="outline" px={2} py={0.5} fontWeight="bold">Download</Button>) : (<Text color="gray.400">No file</Text>)}</Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center" bg={submission.deleted_by_lab ? 'red.400' : idx % 2 === 0 ? 'white' : 'gray.100'} color={submission.deleted_by_lab ? 'white' : 'black'}>
                <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" fontWeight="bold" fontSize="xl">
                  {submission.deleted_by_lab ? 'DELETED BY LAB' : ''}
                </Box>
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center" bg={idx % 2 === 0 ? 'white' : 'gray.100'}>
                <Box display="flex" alignItems="center" justifyContent="center" gap={2} w="100%">
                  <Select
                    value={submission.status}
                    onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                    size="md"
                    maxW="120px"
                    py={0.5}
                    fontWeight="bold"
                    flex={1}
                    minW="100px"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <Button
                    as={RouterLink}
                    to={`/admin/submissions/${submission.id}`}
                    colorScheme="blue"
                    size="md"
                    px={2}
                    py={0.5}
                    fontWeight="bold"
                    flex={1}
                    minW="100px"
                  >
                    Edit/View
                  </Button>
                </Box>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      {/* Mobile Cards */}
      <Box display={{ base: 'block', md: 'none' }}>
        <VStack spacing={4} align="stretch">
          {validSubmissions.map((submission, idx) => (
            <Box key={submission.id} p={4} borderWidth={1} borderRadius="lg" boxShadow="sm" bg={idx % 2 === 0 ? 'white' : 'gray.100'}>
              <Box fontWeight="bold" fontSize="lg">Draw #{submission.id} - {new Date(submission.submitted_at).toLocaleDateString()}</Box>
              <Box>Patient: <b>{submission.patient_name || 'N/A'}</b></Box>
              <Box>Patient ID: <b>{submission.patient_id_url ? 'View' : 'No file'}</b></Box>
              <Box>Phlebotomist: <b>{submission.phlebotomist_name || 'N/A'}</b></Box>
              <Box>Status: <b>{submission.status}</b></Box>
              <Box mt={2} mb={2}>
                <InputGroup size="md">
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    display="none"
                    id={`fedex-upload-${submission.id}`}
                    onChange={e => handleFedexLabelUpload(submission.id, e.target.files[0])}
                  />
                  <label htmlFor={`fedex-upload-${submission.id}`} style={{ width: '100%' }}>
                    <Box as="span" display="flex" alignItems="center" borderWidth={2} borderStyle="dashed" borderRadius="lg" p={2} cursor="pointer" _hover={{ borderColor: 'blue.400' }}>
                      <FaCloudUploadAlt style={{ marginRight: 8 }} />
                      {submission.fedex_label_url ? (
                        <Button as="a" href={submission.fedex_label_url} target="_blank" size="sm" colorScheme="blue" ml={2}>View FedEx</Button>
                      ) : (
                        <Box color="gray.500">Upload FedEx Label</Box>
                      )}
                    </Box>
                  </label>
                </InputGroup>
              </Box>
              <Box mb={2}>
                <InputGroup size="md">
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    display="none"
                    id={`labresults-upload-${submission.id}`}
                    onChange={e => handleLabResultsUpload(submission.id, e.target.files[0])}
                  />
                  <label htmlFor={`labresults-upload-${submission.id}`} style={{ width: '100%' }}>
                    <Box as="span" display="flex" alignItems="center" borderWidth={2} borderStyle="dashed" borderRadius="lg" p={2} cursor="pointer" _hover={{ borderColor: 'green.400' }}>
                      <FaCloudUploadAlt style={{ marginRight: 8 }} />
                      {submission.lab_results_url ? (
                        <Button as="a" href={submission.lab_results_url} target="_blank" size="sm" colorScheme="green" ml={2}>View Results</Button>
                      ) : (
                        <Box color="gray.500">Upload Lab Results</Box>
                      )}
                    </Box>
                  </label>
                </InputGroup>
              </Box>
              <Box display="flex" alignItems="center" gap={2} mt={2}>
                <Select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                  size="md"
                  maxW="120px"
                  fontWeight="bold"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Button as={RouterLink} to={`/admin/submissions/${submission.id}`} colorScheme="blue" size="md" fontWeight="bold">Edit/View</Button>
              </Box>
              {submission.deleted_by_lab && (
                <Box mt={2} color="white" bg="red.400" borderRadius="md" px={2} py={1} fontWeight="bold" textAlign="center">DELETED BY LAB</Box>
              )}
            </Box>
          ))}
        </VStack>
      </Box>
    </Box>
  );
}

export default SubmissionsList; 