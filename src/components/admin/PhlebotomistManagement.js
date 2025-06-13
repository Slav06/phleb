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
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon, CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';

const PhlebotomistManagement = () => {
  const [phlebotomists, setPhlebotomists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhlebotomist, setSelectedPhlebotomist] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_address: '',
    min_draw_fee: '',
    max_draw_fee: '',
    service_areas: [{ zip_code: '', radius: 10 }],
  });

  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchPhlebotomists();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
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
      if (existingUser) {
        // 2. Update the phlebotomist profile
        userId = existingUser.id;
        const { error: updateError } = await supabase
          .from('phlebotomist_profiles')
          .update({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            company_name: formData.company_name,
            company_address: formData.company_address,
            min_draw_fee: parseFloat(formData.min_draw_fee),
            max_draw_fee: parseFloat(formData.max_draw_fee),
            service_areas: formData.service_areas,
          })
          .eq('id', userId);
        if (updateError) throw updateError;
      } else {
        // 3. Create the user profile
        const { data: userData, error: userError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-8), // Generate random password
        });
        if (userError) throw userError;
        userId = userData.user.id;
        // Insert into profiles table
        const { error: profileInsertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              full_name: formData.full_name,
              email: formData.email,
              role: 'phlebotomist',
            },
          ]);
        if (profileInsertError) throw profileInsertError;
        // Create the phlebotomist profile
        const { error: phlebProfileError } = await supabase
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
              service_areas: formData.service_areas,
            },
          ]);
        if (phlebProfileError) throw phlebProfileError;
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
      service_areas: [{ zip_code: '', radius: 10 }],
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
      service_areas: phlebotomist.service_areas,
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
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Draw Fee Range</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Service Areas</Th>
              <Th fontSize="2xl" fontWeight="bold" py={2} px={2} border="1px solid #e0e0e0" color="white" textAlign="center" whiteSpace="nowrap" overflow="hidden" textOverflow="ellipsis">Portal Link</Th>
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
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  {phlebotomist.service_areas?.map((area, index) => (
                    <Text key={index}>
                      {area.zip_code} ({area.radius} miles)
                    </Text>
                  ))}
                </Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  <HStack justify="center">
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
                </Td>
                <Td fontSize="xl" fontWeight="bold" py={1} px={2} border="1px solid #e0e0e0" textAlign="center">
                  <HStack justify="center">
                    <IconButton
                      icon={<EditIcon />}
                      mr={2}
                      onClick={() => handleEdit(phlebotomist)}
                      aria-label="Edit mobile lab"
                    />
                    <IconButton
                      icon={<DeleteIcon />}
                      colorScheme="red"
                      onClick={() => handleDelete(phlebotomist.id)}
                      aria-label="Delete mobile lab"
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
                <Text>Draw Fee: ${phlebotomist.min_draw_fee} - ${phlebotomist.max_draw_fee}</Text>
                <Box>
                  <Text fontWeight="bold">Service Areas:</Text>
                  {phlebotomist.service_areas?.map((area, index) => (
                    <Text key={index}>
                      {area.zip_code} ({area.radius} miles)
                    </Text>
                  ))}
                </Box>
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
                  <IconButton
                    icon={<DeleteIcon />}
                    colorScheme="red"
                    onClick={() => handleDelete(phlebotomist.id)}
                    aria-label="Delete mobile lab"
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
                    isDisabled={!!selectedPhlebotomist}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    isDisabled={!!selectedPhlebotomist}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Phone</FormLabel>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    isDisabled={!!selectedPhlebotomist}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company Name</FormLabel>
                  <Input
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    isDisabled={!!selectedPhlebotomist}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Company Address</FormLabel>
                  <Input
                    name="company_address"
                    value={formData.company_address}
                    onChange={handleInputChange}
                    isDisabled={!!selectedPhlebotomist}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Draw Fee Range</FormLabel>
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