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
        {/* Patient ID Image Preview */}
        {submission.patient_id_url && (
          <Box>
            <Text fontWeight="bold">Patient ID</Text>
            <Box mt={2} mb={2}>
              <img src={submission.patient_id_url} alt="Patient ID" style={{ maxWidth: '100%', maxHeight: 250, borderRadius: 8, border: '1px solid #e0e0e0' }} />
            </Box>
          </Box>
        )}
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
        {(submission.patient_name || submission.patient_email || submission.patient_address || submission.patient_dob) && (
          <Box>
            <Text fontWeight="bold">Patient Info</Text>
            {submission.patient_name && <Text>Name: {submission.patient_name}</Text>}
            {submission.patient_email && <Text>Email: {submission.patient_email}</Text>}
            {submission.patient_address && <Text>Address: {submission.patient_address}</Text>}
            {submission.patient_dob && <Text>DOB: {submission.patient_dob}</Text>}
          </Box>
        )}
        {/* Doctor Info */}
        {(submission.doctor_name || submission.doctor_email || submission.doctor_phone || submission.doctor_fax || submission.doctor_address) && (
          <Box>
            <Text fontWeight="bold">Doctor Info</Text>
            {submission.doctor_name && <Text>Name: {submission.doctor_name}</Text>}
            {submission.doctor_email && <Text>Email: {submission.doctor_email}</Text>}
            {submission.doctor_phone && <Text>Phone: {submission.doctor_phone}</Text>}
            {submission.doctor_fax && <Text>Fax: {submission.doctor_fax}</Text>}
            {submission.doctor_address && <Text>Address: {submission.doctor_address}</Text>}
          </Box>
        )}
        {/* Insurance Info */}
        {(submission.insurance_company || submission.insurance_policy_number) && (
          <Box>
            <Text fontWeight="bold">Insurance Info</Text>
            {submission.insurance_company && <Text>Company: {submission.insurance_company}</Text>}
            {submission.insurance_policy_number && <Text>Policy #: {submission.insurance_policy_number}</Text>}
          </Box>
        )}
        {/* Delivery Info */}
        {(submission.fedex_ship_from || submission.stat_test) && (
          <Box>
            <Text fontWeight="bold">Delivery Info</Text>
            {submission.fedex_ship_from && <Text>FedEx Ship From: {submission.fedex_ship_from}</Text>}
            {typeof submission.stat_test !== 'undefined' && <Text>STAT Test: {submission.stat_test ? 'Yes' : 'No'}</Text>}
          </Box>
        )}
        {/* Download Links */}
        {(submission.fedex_label_url || submission.lab_results_url) && (
          <Box>
            <Text fontWeight="bold">Download Links</Text>
            {submission.fedex_label_url && (
              <Button as="a" href={submission.fedex_label_url} target="_blank" colorScheme="blue" mb={2}>Download FedEx Label</Button>
            )}
            {submission.lab_results_url && (
              <Button as="a" href={submission.lab_results_url} target="_blank" colorScheme="green">Download Lab Results</Button>
            )}
          </Box>
        )}
      </VStack>
      <Button mt={8} onClick={() => navigate(`/lab/${id}`)} colorScheme="blue" variant="outline">Back to Dashboard</Button>
    </Box>
  );
} 