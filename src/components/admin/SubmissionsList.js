import React, { useState, useEffect, useMemo } from 'react';
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
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  SimpleGrid,
  IconButton,
  Wrap,
  WrapItem,
} from '@chakra-ui/react';
import { SearchIcon, AttachmentIcon, ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import { Link as RouterLink } from 'react-router-dom';
import { FaCloudUploadAlt } from 'react-icons/fa';

function isImageFile(url) {
  return url && /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(url);
}

const PdfIcon = () => (
  <span
    style={{
      display: 'inline-block',
      width: 60,
      height: 60,
      background: '#f5f5f5',
      borderRadius: 6,
      border: '1px solid #ccc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 32,
      color: '#e53e3e'
    }}
  >
    📄
  </span>
);

function PreviewModal({ isOpen, onClose, fileUrl }) {
  const isImage = isImageFile(fileUrl);
  const isPdf = fileUrl && fileUrl.endsWith('.pdf');
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalBody display="flex" alignItems="center" justifyContent="center" p={0}>
          {isImage && (
            <img src={fileUrl} alt="Preview" style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain' }} />
          )}
          {isPdf && (
            <iframe src={fileUrl} title="PDF Preview" style={{ width: '90vw', height: '80vh', border: 'none' }} />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function SubmissionsList() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilters, setStatusFilters] = useState({
    pending: true,
    waiting_to_be_received: true,
    completed: true,
    cancelled: true,
    in_progress: true
  });
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
  
  const [editingForm, setEditingForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchLabs();
  }, []);

  useEffect(() => {
    const validSubmissions = submissions.filter(sub => sub.phlebotomist_name && sub.phlebotomist_name !== 'Unknown' && sub.phlebotomist_name.trim() !== '');
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
    const { error: uploadError } = await supabase.storage.from('fedex-labels').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    const { data: urlData } = supabase.storage.from('fedex-labels').getPublicUrl(filePath);
    const labelUrl = urlData.publicUrl;
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
    const { error: uploadError } = await supabase.storage.from('lab-results').upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    const { data: urlData } = supabase.storage.from('lab-results').getPublicUrl(filePath);
    const resultsUrl = urlData.publicUrl;
    const { error: updateError } = await supabase.from('submissions').update({ lab_results_url: resultsUrl }).eq('id', submissionId);
    if (updateError) {
      toast({ title: 'Error saving lab results URL', description: updateError.message, status: 'error', duration: 5000, isClosable: true });
      return;
    }
    setSubmissions(submissions.map(sub => sub.id === submissionId ? { ...sub, lab_results_url: resultsUrl } : sub));
    toast({ title: 'Lab results uploaded', status: 'success', duration: 3000, isClosable: true });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'yellow';
      case 'waiting_to_be_received':
        return 'purple';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'in_progress':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getLabName = (lab_id) => {
    const lab = labs.find(l => l.id === lab_id);
    return lab ? lab.name : 'Unknown';
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(submission => {
      if (!statusFilters[submission.status?.toLowerCase() || 'pending']) {
        return false;
      }
      
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          submission.patient_name?.toLowerCase().includes(searchLower) ||
          submission.doctor_name?.toLowerCase().includes(searchLower) ||
          submission.status?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [submissions, searchQuery, statusFilters]);

  const waitingForFedex = submissions.filter(sub => sub.need_fedex_label && !sub.fedex_label_url);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file || !selectedSubmission) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${field}/${selectedSubmission.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from(field).upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error' });
      return;
    }
    const { data: urlData } = supabase.storage.from(field).getPublicUrl(filePath);
    let column = '';
    if (field === 'lab-results') column = 'lab_results_url';
    else if (field === 'fedex-labels') column = 'fedex_label_url';
    else column = `${field}_url`;
    setEditingForm(f => ({ ...f, [column]: urlData.publicUrl }));
    toast({ title: 'File uploaded', status: 'success' });
  };

  const handleSave = async () => {
    if (!selectedSubmission) return;
    setSaving(true);
    const { error } = await supabase.from('submissions').update(editingForm).eq('id', selectedSubmission.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Saved successfully', status: 'success' });
      setSubmissions(submissions.map(sub => 
        sub.id === selectedSubmission.id ? { ...sub, ...editingForm } : sub
      ));
      setSelectedSubmission({ ...selectedSubmission, ...editingForm });
    }
  };

  useEffect(() => {
    if (selectedSubmission) {
      setEditingForm(selectedSubmission);
    }
  }, [selectedSubmission]);

  const toggleStatusFilter = (status) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const openPreview = (url) => { setPreviewUrl(url); setIsPreviewOpen(true); };
  const closePreview = () => { setIsPreviewOpen(false); setPreviewUrl(null); };

  const SubmissionDetails = ({ submission }) => {
    if (!submission) return <Box p={8} textAlign="center">Select a submission to view details</Box>;

    return (
      <Box p={3} bg="white" borderRadius="lg" boxShadow="sm">
        <HStack justify="space-between" mb={2}>
          <Heading size="md">Edit Submission</Heading>
          <Button colorScheme="blue" size="sm" onClick={handleSave} isLoading={saving}>
            Save Changes
          </Button>
        </HStack>
        {editingForm.status === 'waiting_to_be_received' && (
          <Button colorScheme="green" mb={4} onClick={async () => {
            const { error } = await supabase.from('submissions').update({ status: 'waiting_on_lab_results' }).eq('id', submission.id);
            if (!error) {
              setEditingForm(f => ({ ...f, status: 'waiting_on_lab_results' }));
              toast({ title: 'Marked as received', status: 'success', duration: 2000, isClosable: true });
            } else {
              toast({ title: 'Error', description: error.message, status: 'error', duration: 4000, isClosable: true });
            }
          }}>
            Mark as Received
          </Button>
        )}
        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={3}>
          <VStack spacing={3} align="stretch">
            <Box>
              <Heading size="sm" mb={1} color="blue.600">Patient Information</Heading>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={1}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Patient Name</FormLabel>
                  <Input name="patient_name" value={editingForm.patient_name || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Patient Email</FormLabel>
                  <Input name="patient_email" value={editingForm.patient_email || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Patient Address</FormLabel>
                  <Input name="patient_address" value={editingForm.patient_address || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Patient DOB</FormLabel>
                  <Input name="patient_dob" value={editingForm.patient_dob || ''} onChange={handleChange} size="sm" maxW="150px" />
                </FormControl>
              </SimpleGrid>
            </Box>
            <Box>
              <Heading size="sm" mb={1} color="green.600">Doctor Information</Heading>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={1}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Doctor Name</FormLabel>
                  <Input name="doctor_name" value={editingForm.doctor_name || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Doctor Email</FormLabel>
                  <Input name="doctor_email" value={editingForm.doctor_email || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Doctor Phone</FormLabel>
                  <Input name="doctor_phone" value={editingForm.doctor_phone || ''} onChange={handleChange} size="sm" maxW="150px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Doctor Fax</FormLabel>
                  <Input name="doctor_fax" value={editingForm.doctor_fax || ''} onChange={handleChange} size="sm" maxW="150px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Doctor Address</FormLabel>
                  <Input name="doctor_address" value={editingForm.doctor_address || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
              </SimpleGrid>
            </Box>
            <Box>
              <Heading size="sm" mb={1} color="purple.600">Test Information</Heading>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={1}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Lab Brand</FormLabel>
                  <Input name="lab_brand" value={editingForm.lab_brand || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Blood Collection Time</FormLabel>
                  <Input name="blood_collection_time" value={editingForm.blood_collection_time || ''} onChange={handleChange} size="sm" maxW="150px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Special Instructions</FormLabel>
                  <Box p={2} bg="gray.50" borderRadius="md" fontSize="sm" minH="32px">
                    {editingForm.special_instructions || <Text color="gray.400">No special instructions</Text>}
                  </Box>
                </FormControl>
              </SimpleGrid>
            </Box>
          </VStack>
          <VStack spacing={3} align="stretch">
            <Box>
              <Heading size="sm" mb={1} color="orange.600">Insurance Information</Heading>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={1}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Insurance Company</FormLabel>
                  <Input name="insurance_company" value={editingForm.insurance_company || ''} onChange={handleChange} size="sm" maxW="250px" />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Insurance Policy Number</FormLabel>
                  <Input name="insurance_policy_number" value={editingForm.insurance_policy_number || ''} onChange={handleChange} size="sm" maxW="150px" />
                </FormControl>
              </SimpleGrid>
            </Box>
            <Box>
              <Heading size="sm" mb={1} color="red.600">Status & Actions</Heading>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={1}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Status</FormLabel>
                  <Select name="status" value={editingForm.status || ''} onChange={handleChange} size="sm" maxW="150px">
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="in_progress">In Progress</option>
                  </Select>
                </FormControl>
                <HStack spacing={2} alignItems="flex-end">
                  <Button size="sm" colorScheme="blue" variant="outline" onClick={() => handleLabChange(submission)}>
                    Change Lab
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    Lab: {getLabName(submission.lab_id)}
                  </Text>
                </HStack>
              </SimpleGrid>
            </Box>
            <Box>
              <Heading size="sm" mb={1} color="teal.600">Files & Documents</Heading>
              <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={1}>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>FedEx Label</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {editingForm.fedex_label_url && (
                      <Box textAlign="center">
                        <a href={editingForm.fedex_label_url} target="_blank" rel="noopener noreferrer">
                          {isImageFile(editingForm.fedex_label_url) ? (
                            <img src={editingForm.fedex_label_url} alt="FedEx Label" style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                          ) : editingForm.fedex_label_url && typeof editingForm.fedex_label_url === 'string' && editingForm.fedex_label_url.endsWith('.pdf') ? (
                            <PdfIcon />
                          ) : null}
                        </a>
                        <Button as="a" href={editingForm.fedex_label_url} target="_blank" colorScheme="blue" size="sm" leftIcon={<AttachmentIcon />}>View</Button>
                      </Box>
                    )}
                    <Input type="file" accept="application/pdf,image/*" onChange={e => handleFileUpload('fedex-labels', e.target.files[0])} size="sm" maxW="250px" />
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Lab Results</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {editingForm.lab_results_url && (
                      <Box textAlign="center">
                        <a href={editingForm.lab_results_url} target="_blank" rel="noopener noreferrer">
                          {isImageFile(editingForm.lab_results_url) ? (
                            <img src={editingForm.lab_results_url} alt="Lab Results" style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                          ) : editingForm.lab_results_url && typeof editingForm.lab_results_url === 'string' && editingForm.lab_results_url.endsWith('.pdf') ? (
                            <PdfIcon />
                          ) : null}
                        </a>
                        <Button as="a" href={editingForm.lab_results_url} target="_blank" colorScheme="green" size="sm" leftIcon={<AttachmentIcon />}>View</Button>
                      </Box>
                    )}
                    <Input type="file" accept="application/pdf,image/*" onChange={e => handleFileUpload('lab-results', e.target.files[0])} size="sm" maxW="250px" />
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Doctor's Script</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {Array.isArray(editingForm.script_image)
                      ? editingForm.script_image.map((url, idx) => (
                          <Box key={idx} textAlign="center">
                            <Box as="span" style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => openPreview(url)}>
                              {isImageFile(url) ? (
                                <img src={url} alt={`Script ${idx + 1}`} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                              ) : url && typeof url === 'string' && url.endsWith('.pdf') ? (
                                <PdfIcon />
                              ) : null}
                            </Box>
                            <Button as="a" href={url} target="_blank" colorScheme="blue" size="sm" leftIcon={<AttachmentIcon />}>View {idx + 1}</Button>
                          </Box>
                        ))
                      : editingForm.script_image && (
                          <Box textAlign="center">
                            <Box as="span" style={{ cursor: 'pointer', display: 'inline-block' }} onClick={() => openPreview(editingForm.script_image)}>
                              {isImageFile(editingForm.script_image) ? (
                                <img src={editingForm.script_image} alt="Script" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                              ) : editingForm.script_image && typeof editingForm.script_image === 'string' && editingForm.script_image.endsWith('.pdf') ? (
                                <PdfIcon />
                              ) : null}
                            </Box>
                            <Button as="a" href={editingForm.script_image} target="_blank" colorScheme="blue" size="sm" leftIcon={<AttachmentIcon />}>View</Button>
                          </Box>
                        )}
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Insurance Card</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {Array.isArray(editingForm.insurance_card_image)
                      ? editingForm.insurance_card_image.map((url, idx) => (
                          <Box key={idx} textAlign="center">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              {isImageFile(url) ? (
                                <img src={url} alt={`Insurance Card ${idx + 1}`} style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                              ) : url && typeof url === 'string' && url.endsWith('.pdf') ? (
                                <PdfIcon />
                              ) : null}
                            </a>
                            <Button as="a" href={url} target="_blank" colorScheme="purple" size="sm" leftIcon={<AttachmentIcon />}>
                              View {idx + 1}
                            </Button>
                          </Box>
                        ))
                      : editingForm.insurance_card_image && (
                          <Box textAlign="center">
                            <a href={editingForm.insurance_card_image} target="_blank" rel="noopener noreferrer">
                              {isImageFile(editingForm.insurance_card_image) ? (
                                <img src={editingForm.insurance_card_image} alt="Insurance Card" style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                              ) : editingForm.insurance_card_image && typeof editingForm.insurance_card_image === 'string' && editingForm.insurance_card_image.endsWith('.pdf') ? (
                                <PdfIcon />
                              ) : null}
                            </a>
                            <Button as="a" href={editingForm.insurance_card_image} target="_blank" colorScheme="purple" size="sm" leftIcon={<AttachmentIcon />}>
                              View
                            </Button>
                          </Box>
                        )}
                  </HStack>
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" mb={0.5}>Patient ID</FormLabel>
                  <HStack spacing={2} flexWrap="wrap">
                    {Array.isArray(editingForm.patient_id_image)
                      ? editingForm.patient_id_image.map((url, idx) => (
                          <Box key={idx} textAlign="center">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                              {isImageFile(url) ? (
                                <img src={url} alt={`Patient ID ${idx + 1}`} style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                              ) : url && typeof url === 'string' && url.endsWith('.pdf') ? (
                                <PdfIcon />
                              ) : null}
                            </a>
                            <Button as="a" href={url} target="_blank" colorScheme="orange" size="sm" leftIcon={<AttachmentIcon />}>
                              View {idx + 1}
                            </Button>
                          </Box>
                        ))
                      : editingForm.patient_id_image && (
                          <Box textAlign="center">
                            <a href={editingForm.patient_id_image} target="_blank" rel="noopener noreferrer">
                              {isImageFile(editingForm.patient_id_image) ? (
                                <img src={editingForm.patient_id_image} alt="Patient ID" style={{ width: 300, height: 300, objectFit: 'cover', borderRadius: 6, marginBottom: 2, border: '1px solid #ccc' }} />
                              ) : editingForm.patient_id_image && typeof editingForm.patient_id_image === 'string' && editingForm.patient_id_image.endsWith('.pdf') ? (
                                <PdfIcon />
                              ) : null}
                            </a>
                            <Button as="a" href={editingForm.patient_id_image} target="_blank" colorScheme="orange" size="sm" leftIcon={<AttachmentIcon />}>
                              View
                            </Button>
                          </Box>
                        )}
                  </HStack>
                </FormControl>
              </SimpleGrid>
            </Box>
          </VStack>
        </Grid>
        <PreviewModal isOpen={isPreviewOpen} onClose={closePreview} fileUrl={previewUrl} />
      </Box>
    );
  };

  const SubmissionCard = ({ submission, isExpanded, onClick }) => {
    const fileCount = getFileCount(submission);
    return (
      <Box
        borderWidth={1}
        borderRadius="lg"
        boxShadow="sm"
        bg={isExpanded ? 'blue.50' : 'white'}
        p={4}
        transition="background 0.2s"
        cursor="pointer"
        onClick={onClick}
        _hover={{ bg: 'blue.100' }}
        w="100%"
      >
        <HStack spacing={4} justify="space-between">
          <VStack align="start" flex={1} spacing={1}>
            <Text fontWeight="bold">{submission.patient_name || 'N/A'}</Text>
            <Text fontSize="sm" color="gray.600">
              {new Date(submission.submitted_at).toLocaleDateString()}
            </Text>
          </VStack>
          <HStack spacing={4}>
            <Badge colorScheme={getStatusColor(submission.status)}>{submission.status}</Badge>
            <Box bg="blue.600" color="white" borderRadius="full" fontSize="sm" fontWeight="bold" w="24px" h="24px" display="flex" alignItems="center" justifyContent="center">
              {fileCount}
            </Box>
            {isMobile && (
              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : submission.id); }}>
                {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
              </Button>
            )}
          </HStack>
        </HStack>
        
        {isMobile && isExpanded && (
          <Box mt={4}>
            <SubmissionDetails submission={submission} />
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return <Text>Loading submissions...</Text>;
  }

  return (
    <Box w="100%" maxW="100%" px={4} py={2} bg="gray.50">
      <Grid
        templateColumns={{ base: "1fr", md: "350px 1fr" }}
        gap={6}
        h={{ md: "calc(100vh - 100px)" }}
      >
        <GridItem overflowY="auto">
          <VStack spacing={4} align="stretch">
            <Heading size="md">Submissions</Heading>
            
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={2}>Filter by Status:</Text>
              <Wrap spacing={2}>
                {Object.entries(statusFilters).map(([status, isEnabled]) => (
                  <WrapItem key={status}>
                    <Button
                      size="sm"
                      variant={isEnabled ? "solid" : "outline"}
                      colorScheme={getStatusColor(status)}
                      onClick={() => toggleStatusFilter(status)}
                      textTransform="capitalize"
                    >
                      {status.replace('_', ' ')}
                    </Button>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>

            <Input
              placeholder="Search submissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="sm"
            />

            <VStack
              align="stretch"
              spacing={2}
              overflowY="auto"
              flex={1}
              sx={{
                '&::-webkit-scrollbar': {
                  width: '8px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '8px',
                },
              }}
            >
              {filteredSubmissions.map((submission) => (
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  isExpanded={expandedId === submission.id}
                  onClick={() => {
                    if (isMobile) {
                      setExpandedId(expandedId === submission.id ? null : submission.id);
                    } else {
                      setSelectedSubmission(submission);
                    }
                  }}
                />
              ))}
            </VStack>
          </VStack>
        </GridItem>

        {!isMobile && (
          <GridItem bg="gray.50" position="sticky" top={0}>
            <SubmissionDetails submission={selectedSubmission} />
          </GridItem>
        )}
      </Grid>

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