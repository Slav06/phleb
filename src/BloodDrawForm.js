import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaStethoscope, FaVial, FaShieldAlt, FaTruck, FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaTimes, FaShareAlt } from 'react-icons/fa';
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
  labBrand: '',
  bloodCollectionTime: '',
  scriptImage: null,
  insuranceCardImage: null,
  insuranceCompany: '',
  insurancePolicyNumber: '',
  needFedexLabel: false,
  fedexShipFrom: '',
  statTest: false,
  specialInstructions: '',
};

const labOptions = [
  { value: '', label: 'Select lab brand' },
  { value: 'Quest', label: 'Quest' },
  { value: 'LabCorp', label: 'LabCorp' },
  { value: 'Unbranded', label: 'Unbranded' },
];

const steps = [
  { label: 'Patient Info', icon: FaUser },
  { label: 'Insurance', icon: FaShieldAlt },
  { label: 'Delivery', icon: FaTruck },
];

// DropZone component for drag-and-drop file upload with glassmorphism, animation, and remove button
const DropZone = ({ label, file, setFile, preview, setPreview, mb }) => {
  const inputRef = React.useRef();
  const [dragActive, setDragActive] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBorderColor = useColorModeValue('blue.400', 'blue.300');

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setPreview(URL.createObjectURL(e.dataTransfer.files[0]));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
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
        _hover={{
          borderColor: 'blue.400',
          transform: 'scale(1.02)',
        }}
        transition="all 0.3s"
        cursor="pointer"
        position="relative"
        mb={mb}
      >
        <VStack spacing={4}>
          <Icon as={FaCloudUploadAlt} boxSize={12} color="blue.400" />
          <Text color="gray.500">Click or drag & drop to upload</Text>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          {preview && (
            <Box position="relative" mt={4}>
              <Image
                src={preview}
                alt="Preview"
                borderRadius="xl"
                maxH="160px"
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
                onClick={handleRemove}
                aria-label="Remove image"
              />
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
    lab_brand: form.labBrand || '',
    blood_collection_time: form.bloodCollectionTime || '',
    script_image: form.scriptImage || '',
    insurance_card_image: form.insuranceCardImage || '',
    insurance_company: form.insuranceCompany || '',
    insurance_policy_number: form.insurancePolicyNumber || '',
    need_fedex_label: form.needFedexLabel || false,
    fedex_ship_from: form.fedexShipFrom || '',
    stat_test: form.statTest || false,
    special_instructions: form.specialInstructions || '',
    phlebotomist_name: labInfo?.company_name || labInfo?.full_name || '',
    phlebotomist_email: labInfo?.email || '',
    phlebotomist_id: labId,
  };
}

export default function BloodDrawForm({ phlebotomistId, isPatientMode }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [scriptPreview, setScriptPreview] = useState(null);
  const [insurancePreview, setInsurancePreview] = useState(null);
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

  useEffect(() => {
    if (id) {
      fetchLabInfo();
    }
    // eslint-disable-next-line
  }, [id]);

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
      const dbData = { ...mapFormToDb(form, labInfo, id), status: 'pending', submitted_at: new Date().toISOString() };
      if (submissionId && submissionId > 0) {
        const { error } = await supabase.from('submissions').update(dbData).eq('id', submissionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('submissions').insert([dbData]).select('id').single();
        if (error) throw error;
        if (data && data.id) {
          newSubmissionId = Number(data.id);
          setSubmissionId(newSubmissionId);
        }
      }
      // Now, if user requested a FedEx label, do it with the new ID
      if (needFedexLabelChoice === true && selectedAddress && newSubmissionId) {
        await handleFedExLabelRequest(newSubmissionId);
      }
      setMessage({ type: 'success', text: 'Form submitted successfully!' });
      setForm(initialState);
      setScriptPreview(null);
      setInsurancePreview(null);
      setStep(0);
      setSubmissionId(null);
      isDraftCreated.current = false;
      setTimeout(() => {
        navigate(`/lab/${id}/summary/${newSubmissionId}`);
      }, 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (!file) return;
    // Ensure a draft exists before uploading
    let currentSubmissionId = submissionId;
    if (!currentSubmissionId) {
      // Create a draft
      const { data: draft, error: draftError } = await supabase.from('submissions').insert([
        { lab_id: id, status: 'in_progress', submitted_at: new Date().toISOString() }
      ]).select('id').single();
      if (draftError || !draft || !draft.id) {
        toast({ title: 'Draft creation failed', description: draftError?.message || 'Unknown error', status: 'error' });
        return;
      }
      setSubmissionId(Number(draft.id));
      setSearchParams({ submissionId: draft.id });
      currentSubmissionId = draft.id;
    }
    let bucket = '';
    let column = '';
    if (type === 'script') {
      bucket = 'scripts';
      column = 'script_url';
    } else if (type === 'insurance') {
      bucket = 'insurance-cards';
      column = 'insurance_card_url';
    } else {
      return;
    }
    const fileExt = file.name.split('.').pop();
    const filePath = `${bucket}/${currentSubmissionId}.${fileExt}`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error' });
      return;
    }
    // Get public URL
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    if (urlData && urlData.publicUrl) {
      // Update submission record
      const { error: updateError } = await supabase.from('submissions').update({ [column]: urlData.publicUrl }).eq('id', currentSubmissionId);
      if (updateError) {
        toast({ title: 'Error saving file URL', description: updateError.message, status: 'error' });
        return;
      }
      setForm(f => ({ ...f, [column]: urlData.publicUrl }));
      toast({ title: 'File uploaded', status: 'success' });
    }
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
                setFile={(file) => {
                  setForm((f) => ({ ...f, scriptImage: file }));
                  handleImageUpload(file, 'script');
                }}
                preview={scriptPreview}
                setPreview={setScriptPreview}
                mb={4}
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
                {showPatientDoctorLab ? 'Hide' : 'Add/Update'} Patient, Doctor, and Lab Info
              </Button>
              <Collapse in={showPatientDoctorLab} animateOpacity>
                <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                  {/* Patient, Doctor, Lab fields */}
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
                    <GridItem>
                      <FloatingInput label="Doctor Name" id="doctorName" name="doctorName" value={form.doctorName} onChange={handleChange} />
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
                        <Select name="labBrand" value={form.labBrand} onChange={handleChange} placeholder="Select lab brand">
                          {labOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
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
            <Box mt={6}>
              <Text fontSize="xl" fontWeight="bold" mb={2}>Insurance Card</Text>
              <DropZone
                label="Upload Insurance Card"
                file={form.insuranceCardImage}
                setFile={(file) => {
                  setForm((f) => ({ ...f, insuranceCardImage: file }));
                  handleImageUpload(file, 'insurance');
                }}
                preview={insurancePreview}
                setPreview={setInsurancePreview}
              />
            </Box>
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Insurance Information
              </Text>
              <Text mb={4} color="gray.300">
                Please provide your insurance information below. All fields are optional.
              </Text>
              <Grid templateColumns={'1fr'} gap={6}>
                <GridItem>
                  <FloatingInput
                    label="Insurance Provider"
                    id="insuranceProvider"
                    name="insuranceProvider"
                    value={form.insuranceProvider}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Policy Number"
                    id="policyNumber"
                    name="policyNumber"
                    value={form.policyNumber}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Group Number"
                    id="groupNumber"
                    name="groupNumber"
                    value={form.groupNumber}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Member ID"
                    id="memberId"
                    name="memberId"
                    value={form.memberId}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Insurance Phone"
                    id="insurancePhone"
                    name="insurancePhone"
                    type="tel"
                    value={form.insurancePhone}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Insurance Email"
                    id="insuranceEmail"
                    name="insuranceEmail"
                    type="email"
                    value={form.insuranceEmail}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Insurance Address"
                    id="insuranceAddress"
                    name="insuranceAddress"
                    value={form.insuranceAddress}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Insurance Fax"
                    id="insuranceFax"
                    name="insuranceFax"
                    type="tel"
                    value={form.insuranceFax}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Insurance Website"
                    id="insuranceWebsite"
                    name="insuranceWebsite"
                    type="url"
                    value={form.insuranceWebsite}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Insurance Notes"
                    id="insuranceNotes"
                    name="insuranceNotes"
                    value={form.insuranceNotes}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
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
              setFile={(file) => {
                setForm((f) => ({ ...f, scriptImage: file }));
                handleImageUpload(file, 'script');
              }}
              preview={scriptPreview}
              setPreview={setScriptPreview}
              mb={4}
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
              {showPatientDoctorLab ? 'Hide' : 'Add/Update'} Patient, Doctor, and Lab Info
            </Button>
            <Collapse in={showPatientDoctorLab} animateOpacity>
              <Box p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                {/* Patient, Doctor, Lab fields */}
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
                  <GridItem>
                    <FloatingInput label="Doctor Name" id="doctorName" name="doctorName" value={form.doctorName} onChange={handleChange} />
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
                      <Select name="labBrand" value={form.labBrand} onChange={handleChange} placeholder="Select lab brand">
                        {labOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
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
          <Box mt={6}>
            <Text fontSize="xl" fontWeight="bold" mb={2}>Insurance Card</Text>
            <DropZone
              label="Upload Insurance Card"
              file={form.insuranceCardImage}
              setFile={(file) => {
                setForm((f) => ({ ...f, insuranceCardImage: file }));
                handleImageUpload(file, 'insurance');
              }}
              preview={insurancePreview}
              setPreview={setInsurancePreview}
            />
          </Box>
          <Box>
            <Button
              onClick={() => setShowInsuranceInfo((v) => !v)}
              leftIcon={<FaChevronRight style={{ transform: showInsuranceInfo ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />}
              variant="outline"
              colorScheme="blue"
              mb={2}
              w="100%"
              justifyContent="flex-start"
            >
              {showInsuranceInfo ? 'Hide' : 'Add/Update'} Insurance Info
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
            isDisabled={!(form.scriptImage || form.insuranceCardImage || form.patientName || form.patientEmail)}
          >
            Complete
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}