import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  useDisclosure,
  VStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useToast,
  Text,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Heading,
  Badge,
  Select,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import jsPDF from 'jspdf';

const PhlebotomistManagement = () => {
  const [phlebotomists, setPhlebotomists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhlebotomist, setSelectedPhlebotomist] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { adminUser } = useOutletContext();
  const [labs, setLabs] = useState([]);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_address: '',
    min_draw_fee: '',
    max_draw_fee: '',
    lab_draw_fee: '',
    service_areas: [{ zip_code: '', radius: 10 }],
    send_agreement: 'yes',
    lab_id: '',
  });

  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchPhlebotomists();
    fetchLabs();
  }, []);

  useEffect(() => {
    if (phlebotomists.length > 0 && labs.length > 0) {
      const qualityLab = labs.find(l => l.name.toLowerCase().includes('quality laboratory'));
      if (qualityLab) {
        phlebotomists.forEach(async (phleb) => {
          if (!phleb.lab_id || !labs.some(l => l.id === phleb.lab_id)) {
            await supabase
              .from('phlebotomist_profiles')
              .update({ lab_id: qualityLab.id })
              .eq('id', phleb.id);
          }
        });
        fetchPhlebotomists();
      }
    }
  }, [phlebotomists, labs]);

  const fetchPhlebotomists = async () => {
    try {
      const { data, error } = await supabase
        .from('phlebotomist_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhlebotomists(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching phlebotomists',
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
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('id, name')
        .order('name', { ascending: true });
      if (error) throw error;
      setLabs(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching labs',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Check if the email exists in profiles
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email)
        .single();

      let userId;
      let actionType;
      if (existingUser) {
        // Update the profiles table
        userId = existingUser.id;
        await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            role: 'phlebotomist',
          })
          .eq('id', userId);
        // Update or insert the phlebotomist profile
        const { data: phlebProfile } = await supabase
          .from('phlebotomist_profiles')
          .select('id')
          .eq('id', userId)
          .single();
        if (phlebProfile) {
          // Update existing phlebotomist profile
          await supabase
            .from('phlebotomist_profiles')
            .update({
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone,
              company_name: formData.company_name,
              company_address: formData.company_address,
              min_draw_fee: parseFloat(formData.min_draw_fee),
              max_draw_fee: parseFloat(formData.max_draw_fee),
              lab_draw_fee: typeof formData.lab_draw_fee === 'number' ? formData.lab_draw_fee : 0,
              service_areas: formData.service_areas,
              lab_id: formData.lab_id,
            })
            .eq('id', userId);
          actionType = 'Updated Mobile Lab';
        } else {
          // Insert new phlebotomist profile
          await supabase
            .from('phlebotomist_profiles')
            .insert([
              {
                id: userId,
                full_name: formData.full_name,
                email: formData.email,
                phone: formData.phone,
                company_name: formData.company_name,
                company_address: formData.company_address,
                min_draw_fee: parseFloat(formData.min_draw_fee),
                max_draw_fee: parseFloat(formData.max_draw_fee),
                lab_draw_fee: typeof formData.lab_draw_fee === 'number' ? formData.lab_draw_fee : 0,
                service_areas: formData.service_areas,
                lab_id: formData.lab_id,
              },
            ]);
          actionType = 'Added Mobile Lab';
        }
      } else {
        // 3. Create the user profile
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-8), // Generate random password
        });
        if (userError) throw userError;
        userId = userData.user.id;
        // Insert into profiles table
        await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              full_name: formData.full_name,
              email: formData.email,
              role: 'phlebotomist',
            },
          ]);
        // Create the phlebotomist profile
        await supabase
          .from('phlebotomist_profiles')
          .insert([
            {
              id: userId,
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone,
              company_name: formData.company_name,
              company_address: formData.company_address,
              min_draw_fee: parseFloat(formData.min_draw_fee),
              max_draw_fee: parseFloat(formData.max_draw_fee),
              lab_draw_fee: typeof formData.lab_draw_fee === 'number' ? formData.lab_draw_fee : 0,
              service_areas: formData.service_areas,
              lab_id: formData.lab_id,
            },
          ]);
        actionType = 'Added Mobile Lab';
      }

      // Log to admin_activity_log
      if (adminUser && adminUser.name) {
        await supabase.from('admin_activity_log').insert([
          {
            action: actionType,
            username: adminUser.name,
            details: formData.company_name || formData.full_name || formData.email,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      toast({
        title: 'Success',
        description: 'Mobile Lab added or updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
      fetchPhlebotomists();
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      company_name: '',
      company_address: '',
      min_draw_fee: '',
      max_draw_fee: '',
      lab_draw_fee: '',
      service_areas: [{ zip_code: '', radius: 10 }],
      send_agreement: 'yes',
      lab_id: '',
    });
  };

  const addServiceArea = () => {
    setFormData({
      ...formData,
      service_areas: [...formData.service_areas, { zip_code: '', radius: 10 }],
    });
  };

  const removeServiceArea = (index) => {
    setFormData({
      ...formData,
      service_areas: formData.service_areas.filter((_, i) => i !== index),
    });
  };

  const updateServiceArea = (index, field, value) => {
    const newServiceAreas = [...formData.service_areas];
    newServiceAreas[index] = { ...newServiceAreas[index], [field]: value };
    setFormData({ ...formData, service_areas: newServiceAreas });
  };

  const handleEdit = (phlebotomist) => {
    setSelectedPhlebotomist(phlebotomist);
    setFormData({
      full_name: phlebotomist.full_name,
      email: phlebotomist.email,
      phone: phlebotomist.phone,
      company_name: phlebotomist.company_name,
      company_address: phlebotomist.company_address,
      min_draw_fee: phlebotomist.min_draw_fee,
      max_draw_fee: phlebotomist.max_draw_fee,
      lab_draw_fee: phlebotomist.lab_draw_fee,
      service_areas: phlebotomist.service_areas,
      send_agreement: phlebotomist.send_agreement,
      lab_id: phlebotomist.lab_id || '',
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this phlebotomist?')) {
      try {
        const { error } = await supabase
          .from('phlebotomist_profiles')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Phlebotomist deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        fetchPhlebotomists();
      } catch (error) {
        toast({
          title: 'Error deleting phlebotomist',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const downloadAgreement = async (phlebotomist) => {
    try {
      // Create a new PDF document
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('MOBILE PHLEBOTOMY CONTRACTOR AGREEMENT', 20, 20);
      
      // Add company info
      doc.setFontSize(12);
      doc.text(`Company: ${phlebotomist.company_name}`, 20, 40);
      doc.text(`Signed by: ${phlebotomist.agreement_printed_name}`, 20, 50);
      doc.text(`Date: ${new Date(phlebotomist.agreement_signed_at).toLocaleDateString()}`, 20, 60);
      
      // Add agreement text
      doc.setFontSize(10);
      const agreementText = [
        'This MOBILE PHLEBOTOMY CONTRACTOR AGREEMENT ("Agreement") is made effective on the date signed above between QUALITY LABORATORY, a New Jersey limited liability company ("Contractor") and the above-named company ("Company").',
        '',
        '1. Qualifications & Services: Contractor employs phlebotomists who are in good standing, experienced, qualified, licensed, certified, and approved to draw blood and collect other specimens without restriction or limitation in the state in which Company is performing services. The Company hereby retains Contractor\'s services to draw and collect patient specimens as needed by the Company. Contractor shall be compensated at a rate of $' + phlebotomist.min_draw_fee + ' to $' + phlebotomist.max_draw_fee + ' per blood draw, as agreed upon during the onboarding process.',
        '',
        '2. Instructions & Supplies: The Company shall advise Contractor of the patient\'s location, who is in need of phlebotomy services, the specimens required, and the time period in which such specimens are needed by the Company. Contractor shall, within a reasonable time period, collect the patient specimens from such patients and shall prepare and maintain all appropriate documentation related to the collection and delivery of such specimens. The Company shall provide Contractor with all necessary supplies to collect and process the specimens.',
        '',
        '3. Indemnification: Each party shall defend, indemnify, keep, save and hold harmless, the other, its directors, officers, employees, agents and independent contractors, from any and all suits, damages, liabilities, losses or expenses, including reasonable attorney\'s fees ("Claims"), which arise from the acts and omissions of the other party. The terms and provisions regarding indemnification shall survive the termination of this Agreement.',
        '',
        '4. Governing Law: This Agreement shall be governed by the laws of the State of New Jersey.',
        '',
        '5. Modification: This Agreement shall not be modified, amended, or supplemented except as specified herein or by written instrument executed by both parties.'
      ];
      
      doc.text(agreementText, 20, 80);
      
      // Add signature if available
      if (phlebotomist.agreement_signature) {
        const img = new Image();
        img.src = phlebotomist.agreement_signature;
        doc.addImage(img, 'PNG', 20, 200, 50, 20);
      }
      
      // Save the PDF
      doc.save(`agreement_${phlebotomist.company_name.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: 'Success',
        description: 'Agreement downloaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error downloading agreement:', error);
      toast({
        title: 'Error',
        description: 'Failed to download agreement',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box w="100vw" maxW="100vw" px={0} py={2} overflowX="auto" bg="white">
      <Heading mb={2} size="md" textAlign="left">Mobile Labs</Heading>
      <Button colorScheme="blue" mb={4} onClick={onOpen}>
        Add New Mobile Lab
      </Button>

      {/* Desktop Table */}
      <Box display={{ base: 'none', md: 'block' }}>
        <Table variant="unstyled" size="sm" width="100%" style={{ tableLayout: 'auto', borderCollapse: 'collapse' }}>
          <Thead>
            <Tr bg="blue.700">
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Name</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Company</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Email</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Phone</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Patient Fee Range</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Lab Fee</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Service Areas</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Agreement</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Portal Link</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Lab</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {phlebotomists.map((phlebotomist, idx) => (
              <Tr key={phlebotomist.id}
                bg={idx % 2 === 0 ? 'white' : 'gray.100'}
                _hover={{ bg: 'blue.50' }}
              >
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{phlebotomist.full_name}</Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{phlebotomist.company_name}</Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{phlebotomist.email}</Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">{phlebotomist.phone}</Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">${phlebotomist.min_draw_fee} - ${phlebotomist.max_draw_fee}</Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">${phlebotomist.lab_draw_fee || '0.00'}</Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  {phlebotomist.service_areas?.map((area, index) => (
                    <Text key={index}>
                      {area.zip_code} ({area.radius} miles)
                    </Text>
                  ))}
                </Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  {phlebotomist.agreement_signed ? (
                    <VStack spacing={2}>
                      <Badge colorScheme="green">Signed</Badge>
                      <Text fontSize="sm">{new Date(phlebotomist.agreement_signed_at).toLocaleDateString()}</Text>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={() => downloadAgreement(phlebotomist)}
                      >
                        Download
                      </Button>
                    </VStack>
                  ) : (
                    <Badge colorScheme="red">Not Signed</Badge>
                  )}
                </Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  <Button
                    size="sm"
                    leftIcon={copiedId === phlebotomist.id ? <CheckIcon /> : <CopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/lab/${phlebotomist.id}`);
                      setCopiedId(phlebotomist.id);
                      setTimeout(() => setCopiedId(null), 1500);
                      toast({
                        title: 'Link copied!',
                        description: 'Portal link copied to clipboard',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                      });
                    }}
                  >
                    {copiedId === phlebotomist.id ? 'Copied!' : 'Copy Link'}
                  </Button>
                </Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  {(() => {
                    const lab = labs.find(l => l.id === phlebotomist.lab_id);
                    if (!phlebotomist.lab_id) return <Badge colorScheme="red">Missing</Badge>;
                    return lab ? lab.name : <Badge colorScheme="yellow">Unknown</Badge>;
                  })()}
                </Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  <HStack spacing={2} justify="center">
                    <IconButton
                      icon={<EditIcon />}
                      onClick={() => handleEdit(phlebotomist)}
                      aria-label="Edit mobile lab"
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Mobile View */}
      <Box display={{ base: 'block', md: 'none' }}>
        <VStack spacing={4} align="stretch">
          {phlebotomists.map((phlebotomist) => (
            <Box key={phlebotomist.id} p={4} borderWidth="1px" borderRadius="md" bg="white" boxShadow="sm">
              <VStack align="start" spacing={2}>
                <Text fontWeight="bold" fontSize="lg">{phlebotomist.full_name}</Text>
                <Text>{phlebotomist.company_name}</Text>
                <Text>{phlebotomist.email}</Text>
                <Text>{phlebotomist.phone}</Text>
                <Text>Patient Fee Range: ${phlebotomist.min_draw_fee} - ${phlebotomist.max_draw_fee}</Text>
                <Text>Lab Fee: ${phlebotomist.lab_draw_fee || '0.00'}</Text>
                <Box>
                  <Text fontWeight="bold">Service Areas:</Text>
                  {phlebotomist.service_areas?.map((area, index) => (
                    <Text key={index}>
                      {area.zip_code} ({area.radius} miles)
                    </Text>
                  ))}
                </Box>
                <Text>Agreement: {phlebotomist.agreement_signed ? 'Signed' : 'Not Signed'}</Text>
                <Text>Signed Date: {new Date(phlebotomist.agreement_signed_at).toLocaleDateString()}</Text>
                <HStack>
                  <Button
                    size="sm"
                    leftIcon={copiedId === phlebotomist.id ? <CheckIcon /> : <CopyIcon />}
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/lab/${phlebotomist.id}`);
                      setCopiedId(phlebotomist.id);
                      setTimeout(() => setCopiedId(null), 1500);
                      toast({
                        title: 'Link copied!',
                        description: 'Portal link copied to clipboard',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                      });
                    }}
                  >
                    {copiedId === phlebotomist.id ? 'Copied!' : 'Copy Link'}
                  </Button>
                </HStack>
                <HStack>
                  <IconButton
                    icon={<EditIcon />}
                    onClick={() => handleEdit(phlebotomist)}
                    aria-label="Edit mobile lab"
                  />
                </HStack>
              </VStack>
            </Box>
          ))}
        </VStack>
      </Box>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPhlebotomist ? 'Edit Mobile Lab' : 'Add New Mobile Lab'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} pb={4}>
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company Address</FormLabel>
                  <Input
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Lab</FormLabel>
                  <Select
                    name="lab_id"
                    value={formData.lab_id}
                    onChange={handleInputChange}
                    placeholder="Select a lab"
                  >
                    {labs.map((lab) => (
                      <option key={lab.id} value={lab.id}>{lab.name}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Draw Fee Range (Patient Fee)</FormLabel>
                  <HStack>
                    <NumberInput min={0} precision={2}>
                      <NumberInputField
                        placeholder="Min Fee"
                        name="min_draw_fee"
                        value={formData.min_draw_fee}
                        onChange={(value) => handleNumberChange('min_draw_fee', value)}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text>to</Text>
                    <NumberInput min={0} precision={2}>
                      <NumberInputField
                        placeholder="Max Fee"
                        name="max_draw_fee"
                        value={formData.max_draw_fee}
                        onChange={(value) => handleNumberChange('max_draw_fee', value)}
                      />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </HStack>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Lab Draw Fee (Lab to Mobile Lab Fee)</FormLabel>
                  <NumberInput
                    min={0}
                    precision={2}
                    value={formData.lab_draw_fee}
                    onChange={(valueString, valueNumber) => handleNumberChange('lab_draw_fee', valueNumber)}
                  >
                    <NumberInputField
                      placeholder="Lab Draw Fee"
                      name="lab_draw_fee"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Service Areas</FormLabel>
                  <VStack spacing={2} align="stretch">
                    {formData.service_areas.map((area, index) => (
                      <HStack key={index}>
                        <Input
                          placeholder="Zip Code"
                          name="zip_code"
                          value={area.zip_code}
                          onChange={(e) => updateServiceArea(index, 'zip_code', e.target.value)}
                        />
                        <NumberInput
                          min={1}
                          max={100}
                          value={area.radius}
                          onChange={(value) => updateServiceArea(index, 'radius', parseInt(value))}
                        >
                          <NumberInputField placeholder="Radius" />
                          <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                          </NumberInputStepper>
                        </NumberInput>
                        <Text>miles</Text>
                        {index > 0 && (
                          <IconButton
                            icon={<DeleteIcon />}
                            onClick={() => removeServiceArea(index)}
                            aria-label="Remove service area"
                          />
                        )}
                      </HStack>
                    ))}
                    <Button
                      leftIcon={<AddIcon />}
                      onClick={addServiceArea}
                      size="sm"
                      variant="outline"
                    >
                      Add Service Area
                    </Button>
                  </VStack>
                </FormControl>

                <Box
                  borderWidth={2}
                  borderColor="blue.400"
                  bg="blue.50"
                  borderRadius="lg"
                  p={4}
                  my={4}
                  textAlign="center"
                >
                  <FormControl isRequired>
                    <FormLabel fontSize="lg" fontWeight="bold" color="blue.700">
                      Should this phlebotomist receive the onboarding agreement?
                    </FormLabel>
                    <Select
                      name="send_agreement"
                      value={formData.send_agreement}
                      onChange={handleInputChange}
                      size="lg"
                      fontWeight="bold"
                      color={formData.send_agreement === 'yes' ? 'green.600' : 'red.600'}
                      bg="white"
                      borderColor="blue.300"
                      required
                    >
                      <option value="yes">Yes (send onboarding agreement)</option>
                      <option value="no">No (skip onboarding agreement)</option>
                    </Select>
                  </FormControl>
                </Box>

                <Button
                  type="submit"
                  colorScheme="blue"
                  isLoading={loading}
                  width="full"
                >
                  {selectedPhlebotomist ? 'Update' : 'Create'}
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PhlebotomistManagement; 