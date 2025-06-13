import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Button, Spinner, Divider } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function LabDrawSummary() {
  const { id, submissionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      setSubmission(data);
      setLoading(false);
    };
    fetchSubmission();
  }, [submissionId]);

  if (loading) return <Spinner size="xl" mt={12} />;
  if (!submission) return <Text mt={12}>Submission not found.</Text>;

  return (
    <Box maxW="600px" mx="auto" mt={8} p={8} bg="white" borderRadius="xl" boxShadow="xl">
      <Heading size="lg" mb={4}>Blood Draw Summary</Heading>
      <Divider mb={4} />
      <VStack align="start" spacing={4}>
        {/* Doctor's Script Image Preview */}
        {submission.script_url && (
          <Box>
            <Text fontWeight="bold">Doctor's Script</Text>
            <Box mt={2} mb={2}>
              <img src={submission.script_url} alt="Doctor's Script" style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 8, border: '1px solid #e0e0e0' }} />
            </Box>
          </Box>
        )}
        {/* Insurance Card Image Preview */}
        {submission.insurance_card_url && (
          <Box>
            <Text fontWeight="bold">Insurance Card</Text>
            <Box mt={2} mb={2}>
              <img src={submission.insurance_card_url} alt="Insurance Card" style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 8, border: '1px solid #e0e0e0' }} />
            </Box>
          </Box>
        )}
        {/* Patient Info */}
        <Box>
          <Text fontWeight="bold">Patient Info</Text>
          <Text>Name: {submission.patient_name}</Text>
          <Text>Email: {submission.patient_email}</Text>
          <Text>Address: {submission.patient_address}</Text>
          <Text>DOB: {submission.patient_dob}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">Doctor Info</Text>
          <Text>Name: {submission.doctor_name}</Text>
          <Text>Email: {submission.doctor_email}</Text>
          <Text>Phone: {submission.doctor_phone}</Text>
          <Text>Fax: {submission.doctor_fax}</Text>
          <Text>Address: {submission.doctor_address}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">Insurance Info</Text>
          <Text>Company: {submission.insurance_company}</Text>
          <Text>Policy #: {submission.insurance_policy_number}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">Delivery Info</Text>
          <Text>FedEx Ship From: {submission.fedex_ship_from}</Text>
          <Text>STAT Test: {submission.stat_test ? 'Yes' : 'No'}</Text>
        </Box>
        <Box>
          <Text fontWeight="bold">Download Links</Text>
          {submission.fedex_label_url ? (
            <Button as="a" href={submission.fedex_label_url} target="_blank" colorScheme="blue" mb={2}>Download FedEx Label</Button>
          ) : null}
          {submission.lab_results_url ? (
            <Button as="a" href={submission.lab_results_url} target="_blank" colorScheme="green">Download Lab Results</Button>
          ) : null}
        </Box>
      </VStack>
      <Button mt={8} onClick={() => navigate(`/lab/${id}`)} colorScheme="blue" variant="outline">Back to Dashboard</Button>
    </Box>
  );
} 