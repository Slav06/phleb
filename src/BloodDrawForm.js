import React, { useState } from 'react';
import { FaUser, FaStethoscope, FaVial, FaShieldAlt, FaTruck, FaChevronLeft, FaChevronRight, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';
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
} from '@chakra-ui/react';
import { Image as ChakraImage } from '@chakra-ui/react';
import { supabase } from './supabaseClient';

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
};

const labOptions = [
  { value: '', label: 'Select lab brand' },
  { value: 'Quest', label: 'Quest' },
  { value: 'LabCorp', label: 'LabCorp' },
  { value: 'Unbranded', label: 'Unbranded' },
];

const steps = [
  { label: 'Patient Info', icon: FaUser },
  { label: 'Doctor Info', icon: FaStethoscope },
  { label: 'Lab & Collection', icon: FaVial },
  { label: 'Insurance', icon: FaShieldAlt },
  { label: 'Other', icon: FaTruck },
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

export default function BloodDrawForm({ phlebotomistId }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [scriptPreview, setScriptPreview] = useState(null);
  const [insurancePreview, setInsurancePreview] = useState(null);
  const [step, setStep] = useState(0);
  const toast = useToast();

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

  // Step content
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <VStack spacing={8} align="stretch">
            {/* DropZone for Script Image */}
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Please upload a clear image of the doctor's script. This should include:
              </Text>
              <Text mb={4} color="gray.300">
                • Patient's full name<br />
                • Doctor's name and contact information<br />
                • Test orders and any special instructions<br />
                • Date of the script
              </Text>
              <DropZone
                label="Doctor's Script"
                file={form.scriptImage}
                setFile={(file) => setForm((f) => ({ ...f, scriptImage: file }))}
                preview={scriptPreview}
                setPreview={setScriptPreview}
              />
            </Box>

            {/* Patient Information Fields */}
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Patient Information
              </Text>
              <Text mb={4} color="gray.300">
                Please fill in any missing information from the script below. All fields are optional.
              </Text>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <GridItem>
                  <FloatingInput
                    label="Patient Name"
                    id="patientName"
                    name="patientName"
                    value={form.patientName}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Patient Address"
                    id="patientAddress"
                    name="patientAddress"
                    value={form.patientAddress}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Patient Email"
                    id="patientEmail"
                    name="patientEmail"
                    type="email"
                    value={form.patientEmail}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Patient Date of Birth"
                    id="patientDOB"
                    name="patientDOB"
                    type="date"
                    value={form.patientDOB}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
            </Box>
          </VStack>
        );
      case 1:
        return (
          <VStack spacing={8} align="stretch">
            {/* DropZone for Insurance Card */}
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Please upload a clear image of the patient's insurance card. This should include:
              </Text>
              <Text mb={4} color="gray.300">
                • Insurance company name<br />
                • Policy number<br />
                • Group number (if available)<br />
                • Member ID
              </Text>
              <DropZone
                label="Insurance Card"
                file={form.insuranceCardImage}
                setFile={(file) => setForm((f) => ({ ...f, insuranceCardImage: file }))}
                preview={insurancePreview}
                setPreview={setInsurancePreview}
              />
            </Box>

            {/* Doctor Information Fields */}
            <Box>
              <Text mb={4} fontSize="lg" fontWeight="medium" color="blue.400">
                Doctor Information
              </Text>
              <Text mb={4} color="gray.300">
                Please fill in any missing information from the script below. All fields are optional.
              </Text>
              <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
                <GridItem>
                  <FloatingInput
                    label="Doctor Name"
                    id="doctorName"
                    name="doctorName"
                    value={form.doctorName}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Doctor Address"
                    id="doctorAddress"
                    name="doctorAddress"
                    value={form.doctorAddress}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Doctor Phone"
                    id="doctorPhone"
                    name="doctorPhone"
                    type="tel"
                    value={form.doctorPhone}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Doctor Fax"
                    id="doctorFax"
                    name="doctorFax"
                    type="tel"
                    value={form.doctorFax}
                    onChange={handleChange}
                  />
                </GridItem>
                <GridItem>
                  <FloatingInput
                    label="Doctor Email"
                    id="doctorEmail"
                    name="doctorEmail"
                    type="email"
                    value={form.doctorEmail}
                    onChange={handleChange}
                  />
                </GridItem>
              </Grid>
            </Box>
          </VStack>
        );
      case 2:
        return (
          <Box>
            <HStack spacing={2} mb={4}>
              <Icon as={FaVial} color="blue.500" />
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                Lab & Collection Information
              </Text>
            </HStack>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <GridItem>
                <FormControl>
                  <FormLabel>Lab Brand</FormLabel>
                  <Select
                    name="labBrand"
                    value={form.labBrand}
                    onChange={handleChange}
                    placeholder="Select lab brand"
                  >
                    {labOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </GridItem>
              <GridItem>
                <FloatingInput
                  label="Blood Collection Time"
                  id="bloodCollectionTime"
                  name="bloodCollectionTime"
                  type="datetime-local"
                  value={form.bloodCollectionTime}
                  onChange={handleChange}
                />
              </GridItem>
            </Grid>
          </Box>
        );
      case 3:
        return (
          <Box>
            <HStack spacing={2} mb={4}>
              <Icon as={FaShieldAlt} color="blue.500" />
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                Insurance Information
              </Text>
            </HStack>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <GridItem>
                <FloatingInput
                  label="Insurance Company"
                  id="insuranceCompany"
                  name="insuranceCompany"
                  value={form.insuranceCompany}
                  onChange={handleChange}
                />
              </GridItem>
              <GridItem>
                <FloatingInput
                  label="Insurance Policy Number"
                  id="insurancePolicyNumber"
                  name="insurancePolicyNumber"
                  value={form.insurancePolicyNumber}
                  onChange={handleChange}
                />
              </GridItem>
            </Grid>
          </Box>
        );
      case 4:
        return (
          <Box>
            <HStack spacing={2} mb={4}>
              <Icon as={FaTruck} color="blue.500" />
              <Text fontSize="xl" fontWeight="bold" color="blue.600">
                Additional Information
              </Text>
            </HStack>
            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
              <GridItem>
                <FormControl>
                  <Checkbox
                    name="needFedexLabel"
                    isChecked={form.needFedexLabel}
                    onChange={(e) => setForm((f) => ({ ...f, needFedexLabel: e.target.checked }))}
                  >
                    Need FedEx Label
                  </Checkbox>
                </FormControl>
              </GridItem>
              <GridItem>
                {form.needFedexLabel && (
                  <FloatingInput
                    label="FedEx Ship From Address"
                    id="fedexShipFrom"
                    name="fedexShipFrom"
                    value={form.fedexShipFrom}
                    onChange={handleChange}
                  />
                )}
              </GridItem>
              <GridItem>
                <FormControl>
                  <Checkbox
                    name="statTest"
                    isChecked={form.statTest}
                    onChange={(e) => setForm((f) => ({ ...f, statTest: e.target.checked }))}
                  >
                    STAT Test
                  </Checkbox>
                </FormControl>
              </GridItem>
            </Grid>
          </Box>
        );
      default:
        return null;
    }
  };

  // Progress bar
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Box minH="100vh" bg="gray.50" color="gray.800" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* QLS Logo at the top */}
          <Box as="header" w="100%" textAlign="center" mb={4}>
            <ChakraImage src="/qls-logo.png" alt="Quality Laboratory Service Logo" maxH="70px" mx="auto" mb={2} />
          </Box>
          {/* Progress Steps */}
          <HStack spacing={4} mb={8} justify="center">
            {steps.map((step, index) => (
              <Box key={step.label} textAlign="center">
                <Icon as={step.icon} color={index <= step ? "blue.400" : "gray.600"} boxSize={6} />
                <Text mt={2} color={index <= step ? "blue.400" : "gray.500"}>{step.label}</Text>
              </Box>
            ))}
          </HStack>

          {/* Form Content */}
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

              {/* Navigation Buttons */}
              <HStack justify="space-between" mt={8}>
                <Button
                  leftIcon={<FaChevronLeft />}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  isDisabled={step === 0}
                  colorScheme="blue"
                  variant="outline"
                  _hover={{ bg: 'blue.900' }}
                >
                  Previous
                </Button>
                {step < steps.length - 1 ? (
                  <Button
                    rightIcon={<FaChevronRight />}
                    onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
                    colorScheme="blue"
                    _hover={{ bg: 'blue.600' }}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={loading}
                    loadingText="Submitting..."
                  >
                    Submit
                  </Button>
                )}
              </HStack>
            </form>
          </Box>

          {/* Message Toast */}
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

// Tailwind input style helper
// Add this to your index.css or App.css:
// .input { @apply w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400; } 