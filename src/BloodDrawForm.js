import React, { useState, useEffect } from 'react';
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
} from '@chakra-ui/react';
import { Image as ChakraImage } from '@chakra-ui/react';
import { supabase } from './supabaseClient';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import { analyzeImage } from './aiService'; // Import the AI service

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
const DropZone = ({ label, file, setFile, preview, setPreview }) => {
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save to Supabase
      const { error } = await supabase.from('submissions').insert([
        {
          ...form,
          submitted_at: new Date().toISOString(),
        },
      ]);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Form submitted successfully!' });
      setForm(initialState);
      setScriptPreview(null);
      setInsurancePreview(null);
      setStep(0);
    } catch (err) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file, type) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result.split(',')[1];
        const analysis = await analyzeImage(base64Image, type);
        if (analysis) {
          setForm((f) => ({ ...f, ...analysis }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePickupAddress = () => {
    const newAddress = `${form.addressLine1}, ${form.city}, ${form.state} ${form.zip}`;
    if (!deliveryTemplates.some(template => template.name === newAddress)) {
      setDeliveryTemplates([...deliveryTemplates, { id: Date.now(), name: newAddress }]);
      setSaveConfirmation(true);
      setTimeout(() => setSaveConfirmation(false), 3000);
    } else {
      alert('This address is already saved.');
    }
  };

  const handleRequestFedExLabel = () => {
    const newRequest = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      labelUrl: 'https://example.com/fedex-label.pdf', // Replace with actual label URL
    };
    setPastRequests([...pastRequests, newRequest]);
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
            <DropZone
              label="Doctor's Script"
              file={form.scriptImage}
              setFile={(file) => {
                setForm((f) => ({ ...f, scriptImage: file }));
                handleImageUpload(file, 'script');
              }}
              preview={scriptPreview}
              setPreview={setScriptPreview}
            />
            {/* Patient, Doctor, Lab fields all in one step */}
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Patient, Doctor, and Lab Information
              </Text>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                {/* Patient Fields */}
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
                {/* Doctor Fields */}
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
                {/* Lab & Collection Fields */}
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
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel>Special Instructions</FormLabel>
                    <Input as="textarea" name="specialInstructions" value={form.specialInstructions || ''} onChange={handleChange} placeholder="Any special instructions..." />
                  </FormControl>
                </GridItem>
              </Grid>
            </Box>
          </VStack>
        );
      case 1:
        return (
          <VStack spacing={8} align="stretch">
            {/* DropZone for Insurance Card at the top */}
            <DropZone
              label="Insurance Card"
              file={form.insuranceCardImage}
              setFile={(file) => {
                setForm((f) => ({ ...f, insuranceCardImage: file }));
                handleImageUpload(file, 'insurance');
              }}
              preview={insurancePreview}
              setPreview={setInsurancePreview}
            />
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Insurance Information
              </Text>
              <Text mb={4} color="gray.300">
                Please provide your insurance information below. All fields are optional.
              </Text>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
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
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Delivery Information
              </Text>
              <Text mb={4} color="gray.300">
                Please provide the delivery information below. All fields are optional.
              </Text>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel>Choose Previously Used Address</FormLabel>
                    <Select name="deliveryTemplate" value={form.deliveryTemplate} onChange={handleChange} placeholder="Select delivery template">
                      {deliveryTemplates.map((template) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>
                <GridItem colSpan={2}>
                  <Text fontSize="md" fontWeight="medium" color="blue.400">Add New Address</Text>
                </GridItem>
                <GridItem colSpan={2}>
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
                <GridItem colSpan={2}>
                  <Button colorScheme="blue" onClick={handleSavePickupAddress}>
                    Save Pickup Address
                  </Button>
                  {saveConfirmation && (
                    <Text color="green.500" mt={2}>Address saved successfully!</Text>
                  )}
                </GridItem>
                <GridItem colSpan={2}>
                  <Button colorScheme="blue" onClick={handleRequestFedExLabel}>
                    Request New FedEx Label
                  </Button>
                </GridItem>
                <GridItem colSpan={2}>
                  <FormControl>
                    <FormLabel>Past Requests</FormLabel>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Request ID</Th>
                          <Th>Date</Th>
                          <Th>Status</Th>
                          <Th>Label</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pastRequests.map((request) => (
                          <Tr key={request.id}>
                            <Td>{request.id}</Td>
                            <Td>{request.date}</Td>
                            <Td>{request.status}</Td>
                            <Td>
                              <Button size="sm" colorScheme="blue" as="a" href={request.labelUrl} target="_blank">Download</Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </FormControl>
                </GridItem>
              </Grid>
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
  const renderStepNavigation = () => {
    return (
      <Flex justify="space-between" mt={8}>
        <Button
          leftIcon={<FaChevronLeft />}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          isDisabled={step === 0}
          variant="outline"
          colorScheme="blue"
        >
          Previous
        </Button>
        <Button
          rightIcon={<FaChevronRight />}
          onClick={() => setStep((s) => Math.min(2, s + 1))}
          isDisabled={step === 2}
          colorScheme="blue"
        >
          Next
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

  return (
    <Box minH="100vh" bg="gray.50" color="gray.800" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box as="header" w="100%" textAlign="center" mb={4}>
            <ChakraImage src="/qls-logo.png" alt="Quality Laboratory Service Logo" maxH="70px" mx="auto" mb={2} />
          </Box>
          {!isPatientMode && (
            <Box mb={4} p={4} bg="gray.100" borderRadius="md" boxShadow="sm">
              <Text fontWeight="bold" mb={2}>Generate Patient Form Link</Text>
              <HStack>
                <Input
                  placeholder="Enter patient email"
                  value={patientEmailForShare}
                  onChange={e => setPatientEmailForShare(e.target.value)}
                  size="md"
                  width="auto"
                />
                <IconButton
                  icon={<FaShareAlt />}
                  colorScheme="blue"
                  aria-label="Share patient form"
                  isDisabled={!patientEmailForShare}
                  onClick={async () => {
                    setShowShareLink(true);
                    const link = `${window.location.origin}/lab/${id}/patient/${encodeURIComponent(patientEmailForShare)}`;
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                    // Save to Supabase
                    const { error } = await supabase.from('upcoming_draws').insert([
                      { lab_id: id, patient_email: patientEmailForShare, status: 'upcoming', created_at: new Date().toISOString() }
                    ]);
                    if (error) toast({ title: 'Error saving upcoming draw', description: error.message, status: 'error' });
                  }}
                />
              </HStack>
              {showShareLink && patientEmailForShare && (
                <Box mt={2}>
                  <Text fontSize="sm">Share this link with the patient:</Text>
                  <HStack>
                    <Input
                      value={`${window.location.origin}/lab/${id}/patient/${encodeURIComponent(patientEmailForShare)}`}
                      isReadOnly
                      size="sm"
                    />
                    <Button size="sm" onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/lab/${id}/patient/${encodeURIComponent(patientEmailForShare)}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1500);
                    }}>{copied ? "Copied!" : "Copy"}</Button>
                  </HStack>
                </Box>
              )}
            </Box>
          )}
          {/* Patient Draws Section - grouped by status */}
          {!isPatientMode && (
            <>
              {newRequests.length > 0 && (
                <Box mb={2} p={4} bg="yellow.50" borderRadius="md" boxShadow="sm">
                  <Text fontWeight="bold" mb={2}>New Requests</Text>
                  <VStack align="start" spacing={2}>
                    {newRequests.map(draw => (
                      <HStack key={draw.id}>
                        <Text>{draw.patient_email}</Text>
                        <Button as="a" href={`/lab/${id}/patient/${encodeURIComponent(draw.patient_email)}`} size="sm" colorScheme="blue" target="_blank">Open Form</Button>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
              {upcoming.length > 0 && (
                <Box mb={4} p={4} bg="blue.50" borderRadius="md" boxShadow="sm">
                  <Text fontWeight="bold" mb={2}>Upcoming</Text>
                  <VStack align="start" spacing={2}>
                    {upcoming.map(draw => (
                      <HStack key={draw.id}>
                        <Text>{draw.patient_email}</Text>
                        <Button as="a" href={`/lab/${id}/patient/${encodeURIComponent(draw.patient_email)}`} size="sm" colorScheme="blue" target="_blank">Open Form</Button>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </>
          )}
          {/* The rest of the form/page content always visible below */}
          <HStack spacing={4} mb={8} justify="center">
            {steps.map((step, index) => {
              if (isPatientMode && step.label === 'Delivery') return null;
              return (
                <Box key={step.label} textAlign="center">
                  <Icon as={step.icon} color={index <= step ? "blue.400" : "gray.600"} boxSize={6} />
                  <Text mt={2} color={index <= step ? "blue.400" : "gray.500"}>{step.label}</Text>
                </Box>
              );
            })}
          </HStack>
          <Box
            bg="gray.800"
            p={8}
            borderRadius="xl"
            boxShadow="xl"
            borderWidth="1px"
            borderColor="gray.700"
          >
            <form onSubmit={handleSubmit}>
              {renderStep()}
              {renderStepNavigation()}
            </form>
          </Box>
          {message && (
            <Box
              mt={4}
              p={4}
              borderRadius="md"
              bg={message.type === 'success' ? 'green.100' : 'red.100'}
              color={message.type === 'success' ? 'green.700' : 'red.700'}
            >
              {message.text}
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}