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
    <Box>
      <Heading mb={6}>Submissions</Heading>

      {waitingForFedex.length > 0 && (
        <Box mb={4}>
          {waitingForFedex.map(sub => (
            dismissedAlerts.includes(sub.id) ? null : (
              <Alert status="warning" mb={2} key={sub.id} borderRadius="md">
                <AlertIcon />
                FedEx label needed for <b>{sub.patient_name || 'Unknown Patient'}</b> (submitted {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'N/A'})
                <CloseButton ml="auto" onClick={() => setDismissedAlerts([...dismissedAlerts, sub.id])} />
              </Alert>
            )
          ))}
        </Box>
      )}

      <HStack spacing={4} mb={6}>
        <InputGroup maxW="400px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search by patient or phlebotomist name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Select
          maxW="200px"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </HStack>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Draw ID</Th>
            <Th>Patient</Th>
            <Th>Phlebotomist</Th>
            <Th>Status</Th>
            <Th>FedEx Label</Th>
            <Th>Lab Results</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredSubmissions.map((submission) => (
            <Tr key={submission.id}>
              <Td>{new Date(submission.submitted_at).toLocaleDateString()}</Td>
              <Td>{submission.id}</Td>
              <Td>{submission.patient_name || 'N/A'}</Td>
              <Td>{submission.phlebotomist_name || 'N/A'}</Td>
              <Td>
                <Badge
                  colorScheme={
                    submission.status === 'completed'
                      ? 'green'
                      : submission.status === 'cancelled'
                      ? 'red'
                      : 'yellow'
                  }
                >
                  {submission.status}
                </Badge>
              </Td>
              <Td>
                {submission.fedex_label_url ? (
                  <Button
                    as="a"
                    href={submission.fedex_label_url}
                    target="_blank"
                    leftIcon={<AttachmentIcon />}
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                  >
                    View Label
                  </Button>
                ) : (
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    size="sm"
                    onChange={e => handleFedexLabelUpload(submission.id, e.target.files[0])}
                  />
                )}
              </Td>
              <Td>
                {submission.lab_results_url ? (
                  <Button
                    as="a"
                    href={submission.lab_results_url}
                    target="_blank"
                    leftIcon={<AttachmentIcon />}
                    size="sm"
                    colorScheme="green"
                    variant="outline"
                  >
                    Download Results
                  </Button>
                ) : (
                  <Input
                    type="file"
                    accept="application/pdf,image/*"
                    size="sm"
                    onChange={e => handleLabResultsUpload(submission.id, e.target.files[0])}
                  />
                )}
              </Td>
              <Td>
                <Select
                  value={submission.status}
                  onChange={(e) => handleStatusChange(submission.id, e.target.value)}
                  size="sm"
                  maxW="150px"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </Td>
              <Td>
                <Button as={RouterLink} to={`/admin/submissions/${submission.id}`} colorScheme="blue" size="sm">Edit/View</Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

export default SubmissionsList; 