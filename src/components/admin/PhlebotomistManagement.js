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
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon } from '@chakra-ui/icons';
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
    hourly_rate: 0,
    service_radius_miles: 10,
    bio: '',
    rating: 5,
  });

  useEffect(() => {
    fetchPhlebotomists();
  }, []);

  const fetchPhlebotomists = async () => {
    try {
      const { data, error } = await supabase
        .from('phlebotomist_profiles')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          )
        `);

      if (error) throw error;
      setPhlebotomists(data);
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

  const handleSubmit = async () => {
    try {
      if (selectedPhlebotomist) {
        // Update existing phlebotomist
        const { error } = await supabase
          .from('phlebotomist_profiles')
          .update({
            hourly_rate: formData.hourly_rate,
            service_radius_miles: formData.service_radius_miles,
            bio: formData.bio,
            rating: formData.rating,
          })
          .eq('id', selectedPhlebotomist.id);

        if (error) throw error;

        toast({
          title: 'Phlebotomist updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Create new phlebotomist
        const { data: { user }, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: Math.random().toString(36).slice(-8), // Generate random password
        });

        if (authError) throw authError;

        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone,
              role: 'phlebotomist',
            },
          ]);

        if (profileError) throw profileError;

        const { error: phlebError } = await supabase
          .from('phlebotomist_profiles')
          .insert([
            {
              id: user.id,
              hourly_rate: formData.hourly_rate,
              service_radius_miles: formData.service_radius_miles,
              bio: formData.bio,
              rating: formData.rating,
            },
          ]);

        if (phlebError) throw phlebError;

        toast({
          title: 'Phlebotomist created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }

      onClose();
      fetchPhlebotomists();
    } catch (error) {
      toast({
        title: 'Error saving phlebotomist',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (phlebotomist) => {
    setSelectedPhlebotomist(phlebotomist);
    setFormData({
      full_name: phlebotomist.profiles.full_name,
      email: phlebotomist.profiles.email,
      phone: phlebotomist.profiles.phone,
      hourly_rate: phlebotomist.hourly_rate,
      service_radius_miles: phlebotomist.service_radius_miles,
      bio: phlebotomist.bio,
      rating: phlebotomist.rating,
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
    <Box p={4}>
      <Button colorScheme="blue" mb={4} onClick={() => {
        setSelectedPhlebotomist(null);
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          hourly_rate: 0,
          service_radius_miles: 10,
          bio: '',
          rating: 5,
        });
        onOpen();
      }}>
        Add New Phlebotomist
      </Button>

      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>Hourly Rate</Th>
            <Th>Service Radius</Th>
            <Th>Rating</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {phlebotomists.map((phleb) => (
            <Tr key={phleb.id}>
              <Td>{phleb.profiles.full_name}</Td>
              <Td>{phleb.profiles.email}</Td>
              <Td>{phleb.profiles.phone}</Td>
              <Td>${phleb.hourly_rate}/hr</Td>
              <Td>{phleb.service_radius_miles} miles</Td>
              <Td>{phleb.rating}</Td>
              <Td>
                <IconButton
                  icon={<EditIcon />}
                  mr={2}
                  onClick={() => handleEdit(phleb)}
                  aria-label="Edit phlebotomist"
                />
                <IconButton
                  icon={<DeleteIcon />}
                  colorScheme="red"
                  onClick={() => handleDelete(phleb.id)}
                  aria-label="Delete phlebotomist"
                />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedPhlebotomist ? 'Edit Phlebotomist' : 'Add New Phlebotomist'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
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
                <FormLabel>Hourly Rate ($)</FormLabel>
                <NumberInput
                  value={formData.hourly_rate}
                  onChange={(value) => handleNumberChange('hourly_rate', value)}
                  min={0}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Service Radius (miles)</FormLabel>
                <NumberInput
                  value={formData.service_radius_miles}
                  onChange={(value) => handleNumberChange('service_radius_miles', value)}
                  min={1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Input
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Rating</FormLabel>
                <NumberInput
                  value={formData.rating}
                  onChange={(value) => handleNumberChange('rating', value)}
                  min={0}
                  max={5}
                  step={0.1}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleSubmit}>
              {selectedPhlebotomist ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default PhlebotomistManagement; 