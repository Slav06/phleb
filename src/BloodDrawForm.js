import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaStethoscope, FaVial, FaShieldAlt, FaTruck, FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaTimes, FaShareAlt, FaIdCard, FaAddressCard } from 'react-icons/fa';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  FormControl,
  FormLabel,
  Icon,
  Button,
  useToast,
  Container,
  Grid,
  GridItem,
  Image,
  IconButton,
  useColorModeValue,
  Select,
  Checkbox,
  Flex,
  Table,
  Thead,
  Tr,
  Tbody,
  Td,
  Th,
  Link,
  Spinner,
  Collapse,
} from '@chakra-ui/react';
import { Image as ChakraImage } from '@chakra-ui/react';
import { supabase } from './supabaseClient';
import { useParams, useLocation, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { analyzeImage } from './aiService'; // Import the AI service
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { getLabs, getTestTypesByLab } from './utils/labUtils';

const initialState = {
  patientName: '',
  patientAddress: '',
  patientEmail: '',
  patientDOB: '',
  doctorName: '',
  doctorAddress: '',
  doctorPhone: '',
  doctorFax: '',
  doctorEmail: '',
  labId: '',
  testTypeId: '',
  bloodCollectionTime: '',
  scriptImage: [],
  insuranceCardImage: [],
  patientIdImage: [],
  insuranceCompany: '',
  insurancePolicyNumber: '',
  needFedexLabel: false,
  fedexShipFrom: '',
  statTest: false,
  specialInstructions: '',
};

const steps = [
  { label: 'Patient Info', icon: FaUser },
  { label: 'Insurance', icon: FaShieldAlt },
  { label: 'Delivery', icon: FaTruck },
];

// DropZone component for drag-and-drop file upload with glassmorphism, animation, and remove button
const DropZone = ({ label, file, setFile, preview, setPreview, mb, icon, handleUpload }) => {
  const inputRef = React.useRef();
  const [dragActive, setDragActive] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.400', 'blue.300');

  // Support multiple files
  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      setFile(prev => [...(prev || []), ...files]);
      setPreview(prev => [...(prev || []), ...files.map(f => URL.createObjectURL(f))]);
      if (handleUpload) await handleUpload(files);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragleave' || e.type === 'dragover') setDragActive(true);
    else setDragActive(false);
  };

  const handleChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setFile(prev => [...(prev || []), ...files]);
      setPreview(prev => [...(prev || []), ...files.map(f => URL.createObjectURL(f))]);
      if (handleUpload) await handleUpload(files);
    }
  };

  const handleRemove = (idx) => {
    setFile((prev) => prev.filter((_, i) => i !== idx));
    setPreview((prev) => prev.filter((_, i) => i !== idx));
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <FormControl>
      <FormLabel color="gray.500">{label}</FormLabel>
      <Box
        onClick={() => inputRef.current.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        tabIndex={0}
        role="button"
        aria-label={label}
        p={8}
        borderWidth={2}
        borderStyle="dashed"
        borderRadius="xl"
        bg="gray.100"
        borderColor={dragActive ? 'blue.400' : 'gray.300'}
        _hover={{ borderColor: 'blue.400', transform: 'scale(1.02)' }}
        transition="all 0.3s"
        cursor="pointer"
        position="relative"
        mb={mb}
      >
        <VStack spacing={4}>
          <Icon as={icon || FaCloudUploadAlt} boxSize={12} color="blue.400" />
          <Text color="gray.500">Click or drag & drop to upload</Text>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          {preview && preview.length > 0 && (
            <Box position="relative" mt={4} w="100%">
              <HStack spacing={4} wrap="wrap">
                {preview.map((src, idx) => (
                  <Box key={idx} position="relative">
                    <Image
                      src={src}
                      alt={`Preview ${idx + 1}`}
                      borderRadius="xl"
                      maxH="120px"
                      objectFit="contain"
                      borderWidth={1}
                      borderColor="gray.300"
                      bg="white"
                    />
                    <IconButton
                      icon={<FaTimes />}
                      position="absolute"
                      top={-2}
                      right={-2}
                      colorScheme="red"
                      size="sm"
                      isRound
                      onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                      aria-label="Remove image"
                    />
                  </Box>
                ))}
              </HStack>
            </Box>
          )}
        </VStack>
      </Box>
    </FormControl>
  );
};

// Floating label input
const FloatingInput = ({ label, id, ...props }) => (
  <FormControl>
    <Box position="relative">
      <Input
        id={id}
        placeholder=" "
        size="lg"
        variant="filled"
        bg="gray.100"
        borderColor="gray.300"
        _hover={{ bg: 'gray.200' }}
        _focus={{ bg: 'gray.200', borderColor: 'blue.400' }}
        color="gray.800"
        {...props}
      />
      <FormLabel
        htmlFor={id}
        position="absolute"
        left={4}
        top={2}
        bg="white"
        px={1}
        transform="scale(0.75) translateY(-24px)"
        transformOrigin="left top"
        transition="all 0.2s"
        pointerEvents="none"
        color="gray.500"
      >
        {label}
      </FormLabel>
    </Box>
  </FormControl>
);

// Helper to map camelCase form fields to snake_case DB columns
function mapFormToDb(form, labInfo, labId) {
  // Check if current user is an admin
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));
  const createdByUser = adminUser ? adminUser.name : 'LAB';
  
  return {
    patient_name: form.patientName || '',
    patient_address: form.patientAddress || '',
    patient_email: form.patientEmail || '',
    patient_dob: form.patientDOB || '',
    doctor_name: form.doctorName || '',
    doctor_address: form.doctorAddress || '',
    doctor_phone: form.doctorPhone || '',
    doctor_fax: form.doctorFax || '',
    doctor_email: form.doctorEmail || '',
    lab_id: form.labId || null,
    test_type_id: form.testTypeId || null,
    blood_collection_time: form.bloodCollectionTime || '',
    script_image: Array.isArray(form.scriptImage) ? form.scriptImage : [],
    insurance_card_image: Array.isArray(form.insuranceCardImage) ? form.insuranceCardImage : [],
    patient_id_image: Array.isArray(form.patientIdImage) ? form.patientIdImage : [],
    insurance_company: form.insuranceCompany || '',
    insurance_policy_number: form.insurancePolicyNumber || '',
    need_fedex_label: form.needFedexLabel || false,
    fedex_ship_from: form.fedexShipFrom || '',
    stat_test: form.statTest || false,
    special_instructions: form.specialInstructions || '',
    phlebotomist_name: labInfo?.company_name || labInfo?.full_name || '',
    phlebotomist_email: labInfo?.email || '',
    phlebotomist_id: labId || null,
    created_by_user: createdByUser,
  };
}

// Utility to generate a random draw code
function generateDrawCode(length = 4) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function BloodDrawForm({ phlebotomistId, isPatientMode }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [scriptPreview, setScriptPreview] = useState([]);
  const [insurancePreview, setInsurancePreview] = useState([]);
  const [patientIdPreview, setPatientIdPreview] = useState([]);
  const [step, setStep] = useState(0);
  const [labInfo, setLabInfo] = useState(null);
  const [pastRequests, setPastRequests] = useState([]);
  const [deliveryTemplates, setDeliveryTemplates] = useState([]);
  const [saveConfirmation, setSaveConfirmation] = useState(false);
  const toast = useToast();
  const { id } = useParams();
  const location = useLocation();
  const [patientEmailForShare, setPatientEmailForShare] = useState("");
  const [showShareLink, setShowShareLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upcomingDraws, setUpcomingDraws] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const submissionIdFromUrlRaw = searchParams.get('submissionId');
  const submissionIdFromUrl = submissionIdFromUrlRaw && !isNaN(Number(submissionIdFromUrlRaw)) && Number(submissionIdFromUrlRaw) > 0 ? Number(submissionIdFromUrlRaw) : null;
  const [submissionId, setSubmissionId] = useState(null);
  const isDraftCreated = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const navigate = useNavigate();
  const [selectedAddress, setSelectedAddress] = useState("");
  const [needFedexLabelChoice, setNeedFedexLabelChoice] = useState(null);
  const [showPatientDoctorLab, setShowPatientDoctorLab] = useState(false);
  const [showInsuranceInfo, setShowInsuranceInfo] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [debouncedDoctorSearch] = useDebounce(doctorSearch, 300);
  const [doctorOptions, setDoctorOptions] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [labs, setLabs] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [labOptions, setLabOptions] = useState([]);

  useEffect(() => {
    if (id) {
      fetchLabInfo();
      fetchLabs();
    }
    // eslint-disable-next-line
  }, [id]);

  useEffect(() => {
    if (form.labId) {
      fetchTestTypes(form.labId);
    } else {
      setTestTypes([]);
    }
  }, [form.labId]);

  const fetchLabs = async () => {
    try {
      const labsData = await getLabs();
      setLabs(labsData);
      setLabOptions([
        { value: '', label: 'Select lab' },
        ...labsData.map(lab => ({
          value: lab.id,
          label: lab.name
        }))
      ]);
    } catch (error) {
      console.error('Error fetching labs:', error);
      toast({
        title: 'Error loading labs',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchTestTypes = async (labId) => {
    try {
      const testTypesData = await getTestTypesByLab(labId);
      setTestTypes(testTypesData);
    } catch (error) {
      console.error('Error fetching test types:', error);
      toast({
        title: 'Error loading test types',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const fetchLabInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('phlebotomist_profiles')
        .select('company_name, company_address, full_name, email, phone')
        .eq('id', id)
        .single();
      if (error) throw error;
      setLabInfo(data);
    } catch (error) {
      setLabInfo(null);
    }
  };

  const handleChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const newForm = type === 'checkbox'
      ? { ...form, [name]: checked }
      : { ...form, [name]: value };
    setForm(newForm);
    setSaving(true);
    setSaveError(null);
    const dbData = { ...mapFormToDb(newForm, labInfo, id), status: 'in_progress', submitted_at: new Date().toISOString() };
    console.log('DB Data (insert/update):', dbData);
    try {
      if (submissionId && submissionId > 0) {
        const { error } = await supabase.from('submissions').update(dbData).eq('id', submissionId);
        if (error) {
          setSaveError(error.message);
          console.log('Save error:', error.message);
          alert('Save error: ' + error.message);
        }
      } else if (id) {
        const { data, error } = await supabase.from('submissions').insert([dbData]).select('id').single();
        if (!error && data && data.id && Number(data.id) > 0) {
          setSubmissionId(Number(data.id));
          setForm(f => ({ ...f, ...data }));
          isDraftCreated.current = true;
        } else if (error) {
          setSaveError(error.message);
          console.log('Save error:', error.message);
          alert('Save error: ' + error.message);
        }
      }
      setSaving(false);
    } catch (err) {
      setSaveError(err.message);
      console.log('Save error:', err.message);
      alert('Save error: ' + err.message);
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault && e.preventDefault();
    setLoading(true);
    try {
      let newSubmissionId = submissionId;
      let newDrawCode = form.drawCode;
      // If creating a new submission, generate a draw code
      if (!submissionId) {
        newDrawCode = generateDrawCode();
      }
      // Upload all files and get URLs
      const scriptUrls = await handleImageUpload(form.scriptImage, 'script', newDrawCode);
      const insuranceUrls = await handleImageUpload(form.insuranceCardImage, 'insurance', newDrawCode);
      const patientIdUrls = await handleImageUpload(form.patientIdImage, 'patient-id', newDrawCode);
      const dbData = {
        ...mapFormToDb(form, labInfo, id),
        script_image: scriptUrls,
        insurance_card_image: insuranceUrls,
        patient_id_image: patientIdUrls,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        draw_code: newDrawCode,
      };
      if (submissionId && submissionId > 0) {
        const { error } = await supabase.from('submissions').update(dbData).eq('id', submissionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('submissions').insert([dbData]).select('id,draw_code').single();
        if (error) throw error;
        if (data && data.id) {
          newSubmissionId = Number(data.id);
          setSubmissionId(newSubmissionId);
          setForm(f => ({ ...f, drawCode: data.draw_code }));
        }
      }
      // Log to admin_activity_log
      if (labInfo && (labInfo.company_name || labInfo.full_name || labInfo.email)) {
        await supabase.from('admin_activity_log').insert([
          {
            action: 'Created Blood Draw Submission',
            username: labInfo.company_name || labInfo.full_name || labInfo.email,
            details: `Patient: ${form.patientName || form.patient_name || ''}, Submission ID: ${newDrawCode}`,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      // Now, if user requested a FedEx label, do it with the new ID
      if (needFedexLabelChoice === true && selectedAddress && newSubmissionId) {
        await handleFedExLabelRequest(newSubmissionId);
      }
      setMessage({ type: 'success', text: 'Form submitted successfully!' });
      setForm(initialState);
      setScriptPreview([]);
      setInsurancePreview([]);
      setPatientIdPreview([]);
      setStep(0);
      setSubmissionId(null);
      isDraftCreated.current = false;
      setTimeout(() => {
        navigate(`/lab/${id}/summary/${newDrawCode}`);
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files, type, drawCodeOverride) => {
    if (!files || files.length === 0) return [];
    let currentSubmissionId = submissionId;
    let currentDrawCode = form.drawCode || drawCodeOverride;
    if (!currentSubmissionId) {
      // Create a draft
      const { data: draft, error: draftError } = await supabase.from('submissions').insert([
        { lab_id: id, status: 'in_progress', submitted_at: new Date().toISOString(), draw_code: currentDrawCode }
      ]).select('id,draw_code').single();
      if (draftError || !draft || !draft.id) {
        toast({ title: 'Draft creation failed', description: draftError?.message || 'Unknown error', status: 'error' });
        return [];
      }
      setSubmissionId(Number(draft.id));
      setForm(f => ({ ...f, drawCode: draft.draw_code }));
      setSearchParams({ submissionId: draft.id });
      currentSubmissionId = draft.id;
      currentDrawCode = draft.draw_code;
    }
    let bucket = '';
    let column = '';
    if (type === 'script') {
      bucket = 'scripts';
      column = 'script_image';
    } else if (type === 'insurance') {
      bucket = 'insurance-cards';
      column = 'insurance_card_image';
    } else if (type === 'patient-id') {
      bucket = 'patient-ids';
      column = 'patient_id_image';
    } else {
      return [];
    }
    // Fetch current URLs from form state
    let currentUrls = form[column] || [];
    if (!Array.isArray(currentUrls)) currentUrls = [];
    // Upload new files and get their URLs
    const newUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `${bucket}/${currentDrawCode}_${Date.now()}_${i}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, status: 'error' });
        continue;
      }
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      if (urlData && urlData.publicUrl) {
        newUrls.push(urlData.publicUrl);
      }
    }
    // Combine old and new URLs
    const allUrls = [...currentUrls, ...newUrls];
    // Update submission record with combined array of URLs
    await supabase.from('submissions').update({ [column]: allUrls }).eq('id', currentSubmissionId);
    setForm(f => ({ ...f, [column]: allUrls }));
    toast({ title: 'Files uploaded', status: 'success' });
    return allUrls;
  };

  // Fetch delivery templates from Supabase on mount
  useEffect(() => {
    const fetchDeliveryTemplates = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from('delivery_templates')
        .select('*')
        .eq('lab_id', id)
        .order('created_at', { ascending: false });
      if (!error && data) setDeliveryTemplates(data);
    };
    fetchDeliveryTemplates();
  }, [id]);

  // Save pickup address to Supabase and local state
  const handleSavePickupAddress = async () => {
    const newAddress = {
      lab_id: id,
      address_line1: form.addressLine1,
      city: form.city,
      state: form.state,
      zip: form.zip,
    };
    // Prevent duplicates in local state
    if (!deliveryTemplates.some(template => template.address_line1 === newAddress.address_line1 && template.city === newAddress.city && template.state === newAddress.state && template.zip === newAddress.zip)) {
      // Save to Supabase
      const { data, error } = await supabase.from('delivery_templates').insert([newAddress]).select('*').single();
      if (!error && data) {
        setDeliveryTemplates([data, ...deliveryTemplates]);
        setSaveConfirmation(true);
        setTimeout(() => setSaveConfirmation(false), 3000);
      } else if (error) {
        alert('Error saving address: ' + error.message);
      }
    } else {
      alert('This address is already saved.');
    }
  };

  // Fetch past FedEx label requests for this submission
  useEffect(() => {
    if (!submissionId) return;
    const fetchFedExRequests = async () => {
      const { data, error } = await supabase
        .from('fedex_label_requests')
        .select('*')
        .eq('submission_id', submissionId)
        .order('requested_at', { ascending: false });
      if (!error && data) setPastRequests(data);
    };
    fetchFedExRequests();
  }, [submissionId]);

  // Update handleFedExLabelRequest to accept an optional idOverride
  const handleFedExLabelRequest = async (idOverride) => {
    const fedexId = idOverride || submissionId;
    if (!fedexId || isNaN(fedexId) || fedexId <= 0 || !selectedAddress) return;
    try {
      // Insert into fedex_label_requests
      const { error: requestError } = await supabase
        .from('fedex_label_requests')
        .insert({
          submission_id: Number(fedexId),
          address: selectedAddress,
          status: 'pending',
          requested_at: new Date().toISOString(),
        });
      if (requestError) throw requestError;

      // Update need_fedex_label in submissions
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ need_fedex_label: true })
        .eq('id', fedexId);
      if (updateError) throw updateError;

      // Sync form state so auto-save doesn't overwrite
      setForm(f => ({ ...f, needFedexLabel: true }));

      // Refresh past requests
      const { data } = await supabase
        .from('fedex_label_requests')
        .select('*')
        .eq('submission_id', fedexId)
        .order('requested_at', { ascending: false });
      setPastRequests(data || []);
    } catch (error) {
      console.error('Error requesting FedEx label:', error);
      alert('Failed to request FedEx label. Please try again.');
    }
  };

  // Step content
  const renderStep = () => {
    if (isPatientMode && step > 1) {
      return null; // Only show the first two steps in patient mode
    }
    switch (step) {
      case 0:
        return (
          <VStack spacing={8} align="stretch">
            {/* Lab Info Branding (patient mode) */}
            {isPatientMode && labInfo && (
              <Box bg="blue.50" borderRadius="lg" p={4} mb={2} boxShadow="sm">
                <Flex align="center" mb={2} justify="space-between">
                  <HStack>
                    <Image src="/qls-logo.png" alt="Quality Laboratory Service Logo" maxH="50px" mr={2} />
                    <Text fontSize="xl" fontWeight="bold">
                      {labInfo.company_name || 'Mobile Lab'}
                    </Text>
                  </HStack>
                </Flex>
                <Text color="gray.600" fontSize="md">{labInfo.company_address}</Text>
                <Text color="gray.500" fontSize="sm">Contact: {labInfo.full_name} | {labInfo.email} | {labInfo.phone}</Text>
              </Box>
            )}
            {/* DropZone for Script Image at the very top */}
            <Box>
              <Text fontSize="xl" fontWeight="bold" mb={2}>Doctor's Script</Text>
              <DropZone
                label="Upload Doctor's Script"
                file={form.scriptImage}
                setFile={(files) => setForm((f) => ({ ...f, scriptImage: files }))}
                preview={scriptPreview}
                setPreview={setScriptPreview}
                mb={4}
                icon={FaStethoscope}
                handleUpload={async (files) => {
                  const urls = await handleImageUpload(files, 'script');
                  setForm(f => ({ ...f, scriptImage: urls }));
                }}
              />
              {/* Move Patient/Doctor/Lab Info here */}
              <Button
                onClick={() => setShowPatientDoctorLab((v) => !v)}
                leftIcon={<FaChevronRight style={{ transform: showPatientDoctorLab ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
                variant="outline"
                colorScheme="blue"
                mb={2}
                w="100%"
                justifyContent="flex-start"
              >
                {showPatientDoctorLab ? 'Hide' : 'Add/Update Doctor Info'}
              </Button>
              <Collapse in={showPatientDoctorLab} animateOpacity>
                <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                  <Grid templateColumns={'1fr'} gap={6}>
                    <GridItem>
                      <FormControl position="relative">
                        <FormLabel>Doctor Name</FormLabel>
                        <Input
                          value={form.doctorName}
                          onChange={e => {
                            setForm(f => ({ ...f, doctorName: e.target.value }));
                            setDoctorSearch(e.target.value);
                          }}
                          placeholder="Type to search or add doctor"
                          autoComplete="off"
                          name="doctorName"
                          id="doctorName"
                        />
                        {doctorLoading && <Text fontSize="sm" color="gray.500">Searching...</Text>}
                        {doctorOptions.length > 0 && doctorSearch && (
                          <Box
                            borderWidth={2}
                            borderColor="blue.400"
                            boxShadow="lg"
                            borderRadius="md"
                            bg="white"
                            mt={1}
                            maxH="260px"
                            minW="320px"
                            width="100%"
                            overflowY="auto"
                            zIndex={20}
                            position="absolute"
                            left={0}
                          >
                            <Box textAlign="right" px={2} py={1}>
                              <Button size="xs" variant="ghost" colorScheme="gray" onClick={() => { setDoctorOptions([]); setDoctorSearch(''); }}>✕</Button>
                            </Box>
                            {doctorOptions.map((doc) => (
                              <Box
                                key={doc.id}
                                px={4}
                                py={3}
                                _hover={{ bg: 'blue.50', cursor: 'pointer' }}
                                borderBottom="1px solid #e0e0e0"
                                fontSize="md"
                                onClick={() => {
                                  handleDoctorSelect(doc);
                                  setDoctorOptions([]);
                                  setDoctorSearch('');
                                }}
                              >
                                <Text fontWeight="bold">{doc.full_name} {doc.clinic_name ? `(${doc.clinic_name})` : ''}</Text>
                                <Text fontSize="sm" color="gray.600">{doc.address || 'No address'}</Text>
                                <Text fontSize="sm" color="gray.600">{doc.phone || 'No phone'} | {doc.email || 'No email'}</Text>
                              </Box>
                            ))}
                          </Box>
                        )}
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Doctor Address" id="doctorAddress" name="doctorAddress" value={form.doctorAddress} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Doctor Phone" id="doctorPhone" name="doctorPhone" type="tel" value={form.doctorPhone} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Doctor Fax" id="doctorFax" name="doctorFax" type="tel" value={form.doctorFax} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Doctor Email" id="doctorEmail" name="doctorEmail" type="email" value={form.doctorEmail} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Lab Brand</FormLabel>
                        <Select name="labId" value={form.labId} onChange={handleChange} placeholder="Select lab brand">
                          {labOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Test Type</FormLabel>
                        <Select 
                          name="testTypeId" 
                          value={form.testTypeId} 
                          onChange={handleChange} 
                          placeholder="Select test type"
                          isDisabled={!form.labId}
                        >
                          <option value="">Select test type</option>
                          {testTypes.map((testType) => (
                            <option key={testType.id} value={testType.id}>
                              {testType.name} - ${testType.cash_price} ({testType.tube_top_color} tube)
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Blood Collection Time" id="bloodCollectionTime" name="bloodCollectionTime" type="datetime-local" value={form.bloodCollectionTime} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Special Instructions</FormLabel>
                        <Input as="textarea" name="specialInstructions" value={form.specialInstructions || ''} onChange={handleChange} placeholder="Any special instructions..." />
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Box>
              </Collapse>
            </Box>
          </VStack>
        );
      case 1:
        return (
          <VStack spacing={8} align="stretch">
            {/* DropZone for Insurance Card at the top */}
            <Box mt={6} mb={4}>
              <Text fontSize="xl" fontWeight="bold" mb={2}>Insurance Card</Text>
              <DropZone
                label="Upload Insurance Card"
                file={form.insuranceCardImage}
                setFile={(files) => setForm((f) => ({ ...f, insuranceCardImage: files }))}
                preview={insurancePreview}
                setPreview={setInsurancePreview}
                icon={FaIdCard}
                handleUpload={async (files) => {
                  const urls = await handleImageUpload(files, 'insurance');
                  setForm(f => ({ ...f, insuranceCardImage: urls }));
                }}
              />
              <Button
                onClick={() => setShowInsuranceInfo((v) => !v)}
                leftIcon={<FaChevronRight style={{ transform: showInsuranceInfo ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
                variant="outline"
                colorScheme="blue"
                mt={4}
                mb={2}
                w="100%"
                justifyContent="flex-start"
              >
                {showInsuranceInfo ? 'Hide' : 'Add/Update Insurance Info'}
              </Button>
              <Collapse in={showInsuranceInfo} animateOpacity>
                <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                  <Grid templateColumns={'1fr'} gap={6}>
                    <GridItem>
                      <FloatingInput label="Insurance Provider" id="insuranceProvider" name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Policy Number" id="policyNumber" name="policyNumber" value={form.policyNumber} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Group Number" id="groupNumber" name="groupNumber" value={form.groupNumber} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Member ID" id="memberId" name="memberId" value={form.memberId} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Insurance Phone" id="insurancePhone" name="insurancePhone" type="tel" value={form.insurancePhone} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Insurance Email" id="insuranceEmail" name="insuranceEmail" type="email" value={form.insuranceEmail} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Insurance Address" id="insuranceAddress" name="insuranceAddress" value={form.insuranceAddress} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Insurance Fax" id="insuranceFax" name="insuranceFax" type="tel" value={form.insuranceFax} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Insurance Website" id="insuranceWebsite" name="insuranceWebsite" type="url" value={form.insuranceWebsite} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Insurance Notes" id="insuranceNotes" name="insuranceNotes" value={form.insuranceNotes} onChange={handleChange} />
                    </GridItem>
                  </Grid>
                </Box>
              </Collapse>
            </Box>
            <Box>
              <Text mb={4} fontSize="xl" fontWeight="bold" color="blue.400">
                Patient ID
              </Text>
              <DropZone
                label="Upload Patient ID"
                file={form.patientIdImage}
                setFile={(files) => setForm((f) => ({ ...f, patientIdImage: files }))}
                preview={patientIdPreview}
                setPreview={setPatientIdPreview}
                mb={4}
                icon={FaAddressCard}
                handleUpload={async (files) => {
                  const urls = await handleImageUpload(files, 'patient-id');
                  setForm(f => ({ ...f, patientIdImage: urls }));
                }}
              />
              <Button
                onClick={() => setShowPatientInfo((v) => !v)}
                leftIcon={<FaChevronRight style={{ transform: showPatientInfo ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
                variant="outline"
                colorScheme="blue"
                mb={2}
                w="100%"
                justifyContent="flex-start"
              >
                {showPatientInfo ? 'Hide' : 'Add/Update'} Patient Info
              </Button>
              <Collapse in={showPatientInfo} animateOpacity>
                <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                  <Grid templateColumns={'1fr'} gap={6}>
                    <GridItem>
                      <FloatingInput label="Patient Name" id="patientName" name="patientName" value={form.patientName} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Patient Address" id="patientAddress" name="patientAddress" value={form.patientAddress} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Patient Email" id="patientEmail" name="patientEmail" type="email" value={form.patientEmail} onChange={handleChange} />
                    </GridItem>
                    <GridItem>
                      <FloatingInput label="Patient Date of Birth" id="patientDOB" name="patientDOB" type="date" value={form.patientDOB} onChange={handleChange} />
                    </GridItem>
                  </Grid>
                </Box>
              </Collapse>
            </Box>
          </VStack>
        );
      case 2:
        return (
          <VStack spacing={8} align="stretch">
            <Box>
              <Text mb={2} fontSize="xl" fontWeight="bold" color="blue.700">
                Do you need a FedEx label for this blood draw?
              </Text>
              <HStack spacing={4} mb={4}>
                <Button
                  colorScheme={needFedexLabelChoice === true ? 'blue' : 'gray'}
                  variant={needFedexLabelChoice === true ? 'solid' : 'outline'}
                  onClick={() => setNeedFedexLabelChoice(true)}
                >
                  Yes, I need a label
                </Button>
                <Button
                  colorScheme={needFedexLabelChoice === false ? 'gray' : 'blue'}
                  variant={needFedexLabelChoice === false ? 'solid' : 'outline'}
                  onClick={() => setNeedFedexLabelChoice(false)}
                >
                  No, I don't need one (Skip)
                </Button>
              </HStack>
              {needFedexLabelChoice === false && (
                <Box p={4} bg="green.50" borderRadius="md" mt={2}>
                  <Text color="green.700" fontWeight="medium">You chose to skip requesting a FedEx label. You can always request one later if needed.</Text>
                </Box>
              )}
              {needFedexLabelChoice === true && (
                <Box mt={6}>
                  <Text mb={4} color="gray.600">
                    Please choose a SHIP FROM address from this list below or add a new one
                  </Text>
                  <Grid templateColumns={'1fr'} gap={6}>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Choose Previously Used Address</FormLabel>
                        <Select
                          name="deliveryTemplate"
                          value={selectedAddress}
                          onChange={e => setSelectedAddress(e.target.value)}
                          placeholder="Select delivery template"
                        >
                          {deliveryTemplates.map((template) => (
                            <option key={template.id} value={`${template.address_line1}, ${template.city}, ${template.state} ${template.zip}`}>
                              {template.address_line1}, {template.city}, {template.state} {template.zip}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </GridItem>
                    <GridItem>
                      <Text fontSize="md" fontWeight="medium" color="blue.400">Add New Address</Text>
                    </GridItem>
                    <GridItem>
                      <FloatingInput
                        label="Address Line 1"
                        id="addressLine1"
                        name="addressLine1"
                        value={form.addressLine1}
                        onChange={handleChange}
                        placeholder="Start typing to auto-fill"
                      />
                    </GridItem>
                    <GridItem>
                      <FloatingInput
                        label="City"
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                      />
                    </GridItem>
                    <GridItem>
                      <FloatingInput
                        label="State"
                        id="state"
                        name="state"
                        value={form.state}
                        onChange={handleChange}
                      />
                    </GridItem>
                    <GridItem>
                      <FloatingInput
                        label="Zip"
                        id="zip"
                        name="zip"
                        value={form.zip}
                        onChange={handleChange}
                      />
                    </GridItem>
                    <GridItem>
                      <Button colorScheme="blue" onClick={handleSavePickupAddress}>
                        Save Pickup Address
                      </Button>
                      {saveConfirmation && (
                        <Text color="green.500" mt={2}>Address saved successfully!</Text>
                      )}
                    </GridItem>
                    <GridItem>
                      <FormControl>
                        <FormLabel>Past Requests</FormLabel>
                        <Table variant="simple">
                          <Thead>
                            <Tr>
                              <Th>Date</Th>
                              <Th>Status</Th>
                              <Th>Label</Th>
                              <Th>Address</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {pastRequests.map((request) => (
                              <Tr key={request.id}>
                                <Td>{new Date(request.requested_at).toLocaleString()}</Td>
                                <Td>{request.status}</Td>
                                <Td>
                                  {request.label_url ? (
                                    <Button size="sm" colorScheme="blue" as="a" href={request.label_url} target="_blank">Download</Button>
                                  ) : (
                                    <Text color="gray.500" fontSize="sm">Label not uploaded yet. Please check back soon.</Text>
                                  )}
                                </Td>
                                <Td>{request.address}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </FormControl>
                    </GridItem>
                  </Grid>
                </Box>
              )}
            </Box>
          </VStack>
        );
      default:
        return null;
    }
  };

  // Progress bar
  const progress = ((step + 1) / steps.length) * 100;

  // Step navigation
  const handleNext = async (e) => {
    console.log('handleNext called, current step:', step);
    if (step < 2) {
      setStep((s) => {
        const nextStep = Math.min(2, s + 1);
        console.log('Advancing to step:', nextStep);
        return nextStep;
      });
    } else {
      console.log('Calling handleSubmit from handleNext');
      await handleSubmit(e);
    }
  };

  useEffect(() => {
    console.log('Step changed:', step);
  }, [step]);

  const renderStepNavigation = () => {
    return (
      <Flex justify="space-between" mt={8}>
        <Button
          leftIcon={<FaChevronLeft />}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          isDisabled={step === 0}
          variant="outline"
          colorScheme="blue"
          type="button"
        >
          Previous
        </Button>
        <Button
          rightIcon={<FaChevronRight />}
          onClick={step === 2 ? handleSubmit : handleNext}
          colorScheme="blue"
          type="button"
          disabled={step === 2 && needFedexLabelChoice === true && !selectedAddress}
        >
          {step === 2 ? 'Complete' : 'Next'}
        </Button>
      </Flex>
    );
  };

  // Prevent step from advancing past 1 in patient mode
  useEffect(() => {
    if (isPatientMode && step > 1) {
      setStep(1);
    }
  }, [isPatientMode, step]);

  // Force step to 0 on mount in patient mode
  useEffect(() => {
    if (isPatientMode) {
      setStep(0);
    }
  }, [isPatientMode]);

  // When in patient mode, update or create the draw with status 'new_request'
  useEffect(() => {
    const updateOrCreateDraw = async () => {
      if (isPatientMode && id && form.patientEmail) {
        const { data, error } = await supabase
          .from('upcoming_draws')
          .select('*')
          .eq('lab_id', id)
          .eq('patient_email', form.patientEmail)
          .single();
        if (data) {
          // Update status to 'new_request' if not already
          if (data.status !== 'new_request') {
            await supabase
              .from('upcoming_draws')
              .update({ status: 'new_request' })
              .eq('id', data.id);
          }
        } else {
          // Create new draw with status 'new_request'
          await supabase.from('upcoming_draws').insert([
            { lab_id: id, patient_email: form.patientEmail, status: 'new_request', created_at: new Date().toISOString() }
          ]);
        }
      }
    };
    updateOrCreateDraw();
    // eslint-disable-next-line
  }, [isPatientMode, id]);

  // Fetch all draws for this lab, grouped by status
  useEffect(() => {
    if (!isPatientMode && id) {
      const fetchDraws = async () => {
        const { data, error } = await supabase
          .from('upcoming_draws')
          .select('*')
          .eq('lab_id', id)
          .order('created_at', { ascending: false });
        if (!error) setUpcomingDraws(data || []);
      };
      fetchDraws();
    }
  }, [id, isPatientMode, showShareLink]);

  // Group draws by status
  const newRequests = upcomingDraws.filter(draw => draw.status === 'new_request');
  const upcoming = upcomingDraws.filter(draw => !draw.status || draw.status === 'upcoming');

  // On mount, load or create draft submission by submissionId in URL
  useEffect(() => {
    const loadOrCreateDraft = async () => {
      if (submissionIdFromUrl) {
        // Load the draft by submissionId
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('id', submissionIdFromUrl)
          .single();
        if (data && data.id && Number(data.id) > 0) {
          setSubmissionId(Number(data.id));
          setForm(f => ({ ...f, ...data }));
          isDraftCreated.current = true;
        }
      } else if (id) {
        // No submissionId, create a new draft
        const { data: newDraft, error: insertError } = await supabase.from('submissions').insert([
          {
            lab_id: id,
            status: 'in_progress',
            submitted_at: new Date().toISOString(),
          },
        ]).select('id').single();
        if (!insertError && newDraft && newDraft.id && Number(newDraft.id) > 0) {
          setSubmissionId(Number(newDraft.id));
          isDraftCreated.current = true;
          setSearchParams({ submissionId: newDraft.id });
        }
      }
    };
    loadOrCreateDraft();
    // eslint-disable-next-line
  }, [id, submissionIdFromUrl]);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (!debouncedDoctorSearch) {
        setDoctorOptions([]);
        return;
      }
      setDoctorLoading(true);
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .ilike('full_name', `%${debouncedDoctorSearch}%`)
        .limit(10);
      if (!error && data) {
        setDoctorOptions(data);
      } else {
        setDoctorOptions([]);
      }
      setDoctorLoading(false);
    };
    fetchDoctors();
  }, [debouncedDoctorSearch]);

  const handleDoctorSelect = (doctor) => {
    setForm((prev) => ({
      ...prev,
      doctorName: doctor.full_name,
      doctorAddress: doctor.address || '',
      doctorPhone: doctor.phone || '',
      doctorEmail: doctor.email || '',
    }));
  };

  return (
    <Box minH="100vh" bg="gray.50" color="gray.800" py={8}>
      <Container maxW="container.md">
        <VStack spacing={8} align="stretch">
          <Box as="header" w="100%" textAlign="center" mb={4}>
            <ChakraImage src="/qls-logo.png" alt="Quality Laboratory Service Logo" maxH="70px" mx="auto" mb={2} />
          </Box>
          {/* Dropzones */}
          <Box>
            <Text fontSize="xl" fontWeight="bold" mb={2}>Doctor's Script</Text>
            <DropZone
              label="Upload Doctor's Script"
              file={form.scriptImage}
              setFile={(files) => setForm((f) => ({ ...f, scriptImage: files }))}
              preview={scriptPreview}
              setPreview={setScriptPreview}
              mb={4}
              icon={FaStethoscope}
              handleUpload={async (files) => {
                const urls = await handleImageUpload(files, 'script');
                setForm(f => ({ ...f, scriptImage: urls }));
              }}
            />
            {/* Move Patient/Doctor/Lab Info here */}
            <Button
              onClick={() => setShowPatientDoctorLab((v) => !v)}
              leftIcon={<FaChevronRight style={{ transform: showPatientDoctorLab ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
              variant="outline"
              colorScheme="blue"
              mb={2}
              w="100%"
              justifyContent="flex-start"
            >
              {showPatientDoctorLab ? 'Hide' : 'Add/Update Doctor Info'}
            </Button>
            <Collapse in={showPatientDoctorLab} animateOpacity>
              <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                <Grid templateColumns={'1fr'} gap={6}>
                  <GridItem>
                    <FormControl position="relative">
                      <FormLabel>Doctor Name</FormLabel>
                      <Input
                        value={form.doctorName}
                        onChange={e => {
                          setForm(f => ({ ...f, doctorName: e.target.value }));
                          setDoctorSearch(e.target.value);
                        }}
                        placeholder="Type to search or add doctor"
                        autoComplete="off"
                        name="doctorName"
                        id="doctorName"
                      />
                      {doctorLoading && <Text fontSize="sm" color="gray.500">Searching...</Text>}
                      {doctorOptions.length > 0 && doctorSearch && (
                        <Box
                          borderWidth={2}
                          borderColor="blue.400"
                          boxShadow="lg"
                          borderRadius="md"
                          bg="white"
                          mt={1}
                          maxH="260px"
                          minW="320px"
                          width="100%"
                          overflowY="auto"
                          zIndex={20}
                          position="absolute"
                          left={0}
                        >
                          <Box textAlign="right" px={2} py={1}>
                            <Button size="xs" variant="ghost" colorScheme="gray" onClick={() => { setDoctorOptions([]); setDoctorSearch(''); }}>✕</Button>
                          </Box>
                          {doctorOptions.map((doc) => (
                            <Box
                              key={doc.id}
                              px={4}
                              py={3}
                              _hover={{ bg: 'blue.50', cursor: 'pointer' }}
                              borderBottom="1px solid #e0e0e0"
                              fontSize="md"
                              onClick={() => {
                                handleDoctorSelect(doc);
                                setDoctorOptions([]);
                                setDoctorSearch('');
                              }}
                            >
                              <Text fontWeight="bold">{doc.full_name} {doc.clinic_name ? `(${doc.clinic_name})` : ''}</Text>
                              <Text fontSize="sm" color="gray.600">{doc.address || 'No address'}</Text>
                              <Text fontSize="sm" color="gray.600">{doc.phone || 'No phone'} | {doc.email || 'No email'}</Text>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Doctor Address" id="doctorAddress" name="doctorAddress" value={form.doctorAddress} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Doctor Phone" id="doctorPhone" name="doctorPhone" type="tel" value={form.doctorPhone} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Doctor Fax" id="doctorFax" name="doctorFax" type="tel" value={form.doctorFax} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Doctor Email" id="doctorEmail" name="doctorEmail" type="email" value={form.doctorEmail} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Lab Brand</FormLabel>
                      <Select name="labId" value={form.labId} onChange={handleChange} placeholder="Select lab brand">
                        {labOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Test Type</FormLabel>
                      <Select 
                        name="testTypeId" 
                        value={form.testTypeId} 
                        onChange={handleChange} 
                        placeholder="Select test type"
                        isDisabled={!form.labId}
                      >
                        <option value="">Select test type</option>
                        {testTypes.map((testType) => (
                          <option key={testType.id} value={testType.id}>
                            {testType.name} - ${testType.cash_price} ({testType.tube_top_color} tube)
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Blood Collection Time" id="bloodCollectionTime" name="bloodCollectionTime" type="datetime-local" value={form.bloodCollectionTime} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Special Instructions</FormLabel>
                      <Input as="textarea" name="specialInstructions" value={form.specialInstructions || ''} onChange={handleChange} placeholder="Any special instructions..." />
                    </FormControl>
                  </GridItem>
                </Grid>
              </Box>
            </Collapse>
          </Box>
          <Box mt={6} mb={4}>
            <Text fontSize="xl" fontWeight="bold" mb={2}>Insurance Card</Text>
            <DropZone
              label="Upload Insurance Card"
              file={form.insuranceCardImage}
              setFile={(files) => setForm((f) => ({ ...f, insuranceCardImage: files }))}
              preview={insurancePreview}
              setPreview={setInsurancePreview}
              icon={FaIdCard}
              handleUpload={async (files) => {
                const urls = await handleImageUpload(files, 'insurance');
                setForm(f => ({ ...f, insuranceCardImage: urls }));
              }}
            />
            <Button
              onClick={() => setShowInsuranceInfo((v) => !v)}
              leftIcon={<FaChevronRight style={{ transform: showInsuranceInfo ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
              variant="outline"
              colorScheme="blue"
              mt={4}
              mb={2}
              w="100%"
              justifyContent="flex-start"
            >
              {showInsuranceInfo ? 'Hide' : 'Add/Update Insurance Info'}
            </Button>
            <Collapse in={showInsuranceInfo} animateOpacity>
              <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                <Grid templateColumns={'1fr'} gap={6}>
                  <GridItem>
                    <FloatingInput label="Insurance Provider" id="insuranceProvider" name="insuranceProvider" value={form.insuranceProvider} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Policy Number" id="policyNumber" name="policyNumber" value={form.policyNumber} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Group Number" id="groupNumber" name="groupNumber" value={form.groupNumber} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Member ID" id="memberId" name="memberId" value={form.memberId} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Insurance Phone" id="insurancePhone" name="insurancePhone" type="tel" value={form.insurancePhone} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Insurance Email" id="insuranceEmail" name="insuranceEmail" type="email" value={form.insuranceEmail} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Insurance Address" id="insuranceAddress" name="insuranceAddress" value={form.insuranceAddress} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Insurance Fax" id="insuranceFax" name="insuranceFax" type="tel" value={form.insuranceFax} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Insurance Website" id="insuranceWebsite" name="insuranceWebsite" type="url" value={form.insuranceWebsite} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Insurance Notes" id="insuranceNotes" name="insuranceNotes" value={form.insuranceNotes} onChange={handleChange} />
                  </GridItem>
                </Grid>
              </Box>
            </Collapse>
          </Box>
          <Box mt={6}>
            <Text mb={4} fontSize="xl" fontWeight="bold" color="blue.400">
              Patient ID
            </Text>
            <DropZone
              label="Upload Patient ID"
              file={form.patientIdImage}
              setFile={(files) => setForm((f) => ({ ...f, patientIdImage: files }))}
              preview={patientIdPreview}
              setPreview={setPatientIdPreview}
              mb={4}
              icon={FaAddressCard}
              handleUpload={async (files) => {
                const urls = await handleImageUpload(files, 'patient-id');
                setForm(f => ({ ...f, patientIdImage: urls }));
              }}
            />
            <Button
              onClick={() => setShowPatientInfo((v) => !v)}
              leftIcon={<FaChevronRight style={{ transform: showPatientInfo ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
              variant="outline"
              colorScheme="blue"
              mb={2}
              w="100%"
              justifyContent="flex-start"
            >
              {showPatientInfo ? 'Hide' : 'Add/Update'} Patient Info
            </Button>
            <Collapse in={showPatientInfo} animateOpacity>
              <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                <Grid templateColumns={'1fr'} gap={6}>
                  <GridItem>
                    <FloatingInput label="Patient Name" id="patientName" name="patientName" value={form.patientName} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Patient Address" id="patientAddress" name="patientAddress" value={form.patientAddress} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Patient Email" id="patientEmail" name="patientEmail" type="email" value={form.patientEmail} onChange={handleChange} />
                  </GridItem>
                  <GridItem>
                    <FloatingInput label="Patient Date of Birth" id="patientDOB" name="patientDOB" type="date" value={form.patientDOB} onChange={handleChange} />
                  </GridItem>
                </Grid>
              </Box>
            </Collapse>
          </Box>
          <Box mt={8}>
            <Text mb={2} fontSize="xl" fontWeight="bold" color="blue.700">
              Do you need a FedEx label for this blood draw?
            </Text>
            <HStack spacing={4} mb={4}>
              <Button
                colorScheme={needFedexLabelChoice === true ? 'blue' : 'gray'}
                variant={needFedexLabelChoice === true ? 'solid' : 'outline'}
                onClick={() => setNeedFedexLabelChoice(true)}
              >
                Yes, I need a label
              </Button>
              <Button
                colorScheme={needFedexLabelChoice === false ? 'gray' : 'blue'}
                variant={needFedexLabelChoice === false ? 'solid' : 'outline'}
                onClick={() => setNeedFedexLabelChoice(false)}
              >
                No, I don't need one (Skip)
              </Button>
            </HStack>
            {needFedexLabelChoice === false && (
              <Box p={4} bg="green.50" borderRadius="md" mt={2}>
                <Text color="green.700" fontWeight="medium">You chose to skip requesting a FedEx label. You can always request one later if needed.</Text>
              </Box>
            )}
            {needFedexLabelChoice === true && (
              <Box mt={6}>
                <Text mb={4} color="gray.600">
                  Please choose a SHIP FROM address from this list below or add a new one
                </Text>
                <Grid templateColumns={'1fr'} gap={6}>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Choose Previously Used Address</FormLabel>
                      <Select
                        name="deliveryTemplate"
                        value={selectedAddress}
                        onChange={e => setSelectedAddress(e.target.value)}
                        placeholder="Select delivery template"
                      >
                        {deliveryTemplates.map((template) => (
                          <option key={template.id} value={`${template.address_line1}, ${template.city}, ${template.state} ${template.zip}`}>
                            {template.address_line1}, {template.city}, {template.state} {template.zip}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem>
                    <Text fontSize="md" fontWeight="medium" color="blue.400">Add New Address</Text>
                  </GridItem>
                  <GridItem>
                    <FloatingInput
                      label="Address Line 1"
                      id="addressLine1"
                      name="addressLine1"
                      value={form.addressLine1}
                      onChange={handleChange}
                      placeholder="Start typing to auto-fill"
                    />
                  </GridItem>
                  <GridItem>
                    <FloatingInput
                      label="City"
                      id="city"
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                    />
                  </GridItem>
                  <GridItem>
                    <FloatingInput
                      label="State"
                      id="state"
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                    />
                  </GridItem>
                  <GridItem>
                    <FloatingInput
                      label="Zip"
                      id="zip"
                      name="zip"
                      value={form.zip}
                      onChange={handleChange}
                    />
                  </GridItem>
                  <GridItem>
                    <Button colorScheme="blue" onClick={handleSavePickupAddress}>
                      Save Pickup Address
                    </Button>
                    {saveConfirmation && (
                      <Text color="green.500" mt={2}>Address saved successfully!</Text>
                    )}
                  </GridItem>
                  <GridItem>
                    <FormControl>
                      <FormLabel>Past Requests</FormLabel>
                      <Table variant="simple">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Status</Th>
                            <Th>Label</Th>
                            <Th>Address</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {pastRequests.map((request) => (
                            <Tr key={request.id}>
                              <Td>{new Date(request.requested_at).toLocaleString()}</Td>
                              <Td>{request.status}</Td>
                              <Td>
                                {request.label_url ? (
                                  <Button size="sm" colorScheme="blue" as="a" href={request.label_url} target="_blank">Download</Button>
                                ) : (
                                  <Text color="gray.500" fontSize="sm">Label not uploaded yet. Please check back soon.</Text>
                                )}
                              </Td>
                              <Td>{request.address}</Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </FormControl>
                  </GridItem>
                </Grid>
              </Box>
            )}
          </Box>
          {/* Complete button */}
          <Button
            colorScheme="blue"
            size="lg"
            onClick={handleSubmit}
            isDisabled={!(form.scriptImage.length > 0 || form.insuranceCardImage.length > 0 || form.patientName || form.patientEmail)}
          >
            Complete
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}