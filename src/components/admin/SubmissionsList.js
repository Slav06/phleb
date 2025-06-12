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
} from '@chakra-ui/react';
import { SearchIcon, AttachmentIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';

function SubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const toast = useToast();
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  useEffect(() => {
    fetchSubmissions();
  }, []);

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

  if (loading) {
    return <Text>Loading submissions...</Text>;
  }

  return (
    <Box w="100vw" maxW="100vw" px={0} py={2} overflowX="auto" bg="white">
      <Heading mb={4} size="md" textAlign="left">Submissions</Heading>
      <Table variant="unstyled" size="sm" width="100%" style={{ tableLayout: 'auto', borderCollapse: 'collapse' }}>
        <Thead>
          <Tr>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Date</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Draw ID</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Patient</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Phlebotomist</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Status</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">FedEx Label</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Lab Results</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Deleted By Lab</Th>
            <Th fontSize="2xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredSubmissions.map((submission) => (
            <Tr key={submission.id}>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">{new Date(submission.submitted_at).toLocaleDateString()}</Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">{submission.id}</Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">{submission.patient_name || 'N/A'}</Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">{submission.phlebotomist_name || 'N/A'}</Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">
                <Badge
                  colorScheme={
                    submission.status === 'completed'
                      ? 'green'
                      : submission.status === 'cancelled'
                      ? 'red'
                      : 'yellow'
                  }
                  fontSize="xl"
                  px={2}
                  py={0.5}
                  fontWeight="bold"
                >
                  {submission.status}
                </Badge>
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">
                {submission.fedex_label_url ? (
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
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    size="md"
                    py={0.5}
                    fontWeight="bold"
                    onChange={e => handleFedexLabelUpload(submission.id, e.target.files[0])}
                  />
                )}
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">
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
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">
                {submission.deleted_by_lab ? (
                  <Badge colorScheme="red" fontSize="xl" px={2} py={0.5} fontWeight="bold">Deleted by Lab</Badge>
                ) : ''}
              </Td>
              <Td fontSize="xl" fontWeight="bold" py={0.5} px={2} border="1px solid #e0e0e0" bg="white">
                <Select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                  size="md"
                  maxW="120px"
                  py={0.5}
                  fontWeight="bold"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
                <Button as={RouterLink} to={`/admin/submissions/${submission.id}`} colorScheme="blue" size="md" ml={2} px={2} py={0.5} fontWeight="bold">Edit/View</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default SubmissionsList; 