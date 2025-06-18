import React, { useState, useEffect } from 'react';
import {
  Box, Button, FormControl, FormLabel, Input, Table, Thead, Tbody, Tr, Th, Td, IconButton, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, ModalFooter, useDisclosure, VStack, HStack
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    npi_number: '',
    clinic_name: '',
    address: '',
    hours: {
      Monday: { start: '', end: '' },
      Tuesday: { start: '', end: '' },
      Wednesday: { start: '', end: '' },
      Thursday: { start: '', end: '' },
      Friday: { start: '', end: '' },
      Saturday: { start: '', end: '' },
      Sunday: { start: '', end: '' },
    },
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching doctors', description: error.message, status: 'error' });
    } else {
      setDoctors(data || []);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (selectedDoctor) {
        // Update
        const { error } = await supabase
          .from('doctors')
          .update({
            ...formData,
            hours: formData.hours,
          })
          .eq('id', selectedDoctor.id);
        if (error) throw error;
        toast({ title: 'Doctor updated', status: 'success' });
      } else {
        // Add
        const { error } = await supabase
          .from('doctors')
          .insert([{ ...formData, hours: formData.hours }]);
        if (error) throw error;
        toast({ title: 'Doctor added', status: 'success' });
      }
      fetchDoctors();
      onClose();
      setFormData({ full_name: '', email: '', phone: '', npi_number: '', clinic_name: '', address: '', hours: {
        Monday: { start: '', end: '' },
        Tuesday: { start: '', end: '' },
        Wednesday: { start: '', end: '' },
        Thursday: { start: '', end: '' },
        Friday: { start: '', end: '' },
        Saturday: { start: '', end: '' },
        Sunday: { start: '', end: '' },
      } });
      setSelectedDoctor(null);
    } catch (error) {
      toast({ title: 'Error', description: error.message, status: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      full_name: doctor.full_name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      npi_number: doctor.npi_number || '',
      clinic_name: doctor.clinic_name || '',
      address: doctor.address || '',
      hours: doctor.hours || {
        Monday: { start: '', end: '' },
        Tuesday: { start: '', end: '' },
        Wednesday: { start: '', end: '' },
        Thursday: { start: '', end: '' },
        Friday: { start: '', end: '' },
        Saturday: { start: '', end: '' },
        Sunday: { start: '', end: '' },
      },
    });
    onOpen();
  };

  const handleDelete = async (id) => {
    setLoading(true);
    const { error } = await supabase.from('doctors').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting doctor', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Doctor deleted', status: 'success' });
      fetchDoctors();
    }
    setLoading(false);
  };

  return (
    <Box p={6}>
      <HStack justify="space-between" mb={4}>
        <Box as="h2" fontSize="2xl" fontWeight="bold">Doctors</Box>
        <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={() => { setSelectedDoctor(null); setFormData({ full_name: '', email: '', phone: '', npi_number: '', clinic_name: '', address: '', hours: {
          Monday: { start: '', end: '' },
          Tuesday: { start: '', end: '' },
          Wednesday: { start: '', end: '' },
          Thursday: { start: '', end: '' },
          Friday: { start: '', end: '' },
          Saturday: { start: '', end: '' },
          Sunday: { start: '', end: '' },
        } }); onOpen(); }}>Add Doctor</Button>
      </HStack>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Email</Th>
            <Th>Phone</Th>
            <Th>NPI</Th>
            <Th>Clinic</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {doctors.map((doctor) => (
            <Tr key={doctor.id}>
              <Td>{doctor.full_name}</Td>
              <Td>{doctor.email}</Td>
              <Td>{doctor.phone}</Td>
              <Td>{doctor.npi_number}</Td>
              <Td>{doctor.clinic_name}</Td>
              <Td>
                <IconButton icon={<EditIcon />} onClick={() => handleEdit(doctor)} aria-label="Edit" mr={2} />
                <IconButton icon={<DeleteIcon />} colorScheme="red" onClick={() => handleDelete(doctor.id)} aria-label="Delete" />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{selectedDoctor ? 'Edit Doctor' : 'Add Doctor'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Full Name</FormLabel>
                  <Input name="full_name" value={formData.full_name} onChange={handleInputChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input name="email" value={formData.email} onChange={handleInputChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>Phone</FormLabel>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>NPI Number</FormLabel>
                  <Input name="npi_number" value={formData.npi_number} onChange={handleInputChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>Clinic Name</FormLabel>
                  <Input name="clinic_name" value={formData.clinic_name} onChange={handleInputChange} />
                </FormControl>
                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Input name="address" value={formData.address} onChange={handleInputChange} />
                </FormControl>
                <Box w="100%" borderWidth={1} borderRadius="md" p={3} mt={2} mb={2}>
                  <FormLabel>Working Hours</FormLabel>
                  {Object.keys(formData.hours).map((day) => (
                    <HStack key={day} mb={1}>
                      <Box minW="80px">{day}</Box>
                      <Input
                        type="time"
                        value={formData.hours[day].start}
                        onChange={(e) => handleHoursChange(day, 'start', e.target.value)}
                        size="sm"
                        placeholder="Start"
                      />
                      <Box>-</Box>
                      <Input
                        type="time"
                        value={formData.hours[day].end}
                        onChange={(e) => handleHoursChange(day, 'end', e.target.value)}
                        size="sm"
                        placeholder="End"
                      />
                    </HStack>
                  ))}
                </Box>
                <ModalFooter px={0}>
                  <Button colorScheme="blue" mr={3} type="submit" isLoading={loading}>
                    {selectedDoctor ? 'Update' : 'Add'}
                  </Button>
                  <Button onClick={onClose}>Cancel</Button>
                </ModalFooter>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default DoctorManagement; 