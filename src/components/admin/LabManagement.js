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
  HStack,
  Heading,
  Badge,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Textarea,
  Select,
  Flex,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';

const LabManagement = () => {
  const [labs, setLabs] = useState([]);
  const [testTypes, setTestTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLab, setSelectedLab] = useState(null);
  const [selectedTestType, setSelectedTestType] = useState(null);
  const { isOpen: isLabModalOpen, onOpen: onLabModalOpen, onClose: onLabModalClose } = useDisclosure();
  const { isOpen: isTestModalOpen, onOpen: onTestModalOpen, onClose: onTestModalClose } = useDisclosure();
  const { isOpen: isTestTypesModalOpen, onOpen: onTestTypesModalOpen, onClose: onTestTypesModalClose } = useDisclosure();
  const toast = useToast();
  const { adminUser } = useOutletContext();

  const [labFormData, setLabFormData] = useState({
    name: '',
    address: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    is_active: true,
  });

  const [testTypeFormData, setTestTypeFormData] = useState({
    name: '',
    description: '',
    cash_price: '',
    tube_top_color: '',
    is_active: true,
  });

  const tubeTopColors = [
    'Red', 'Purple', 'Blue', 'Green', 'Yellow', 'Gold', 'Orange', 'Pink', 'Gray', 'White'
  ];

  useEffect(() => {
    fetchLabs();
    fetchTestTypes();
  }, []);

  const fetchLabs = async () => {
    try {
      const { data, error } = await supabase
        .from('labs')
        .select('*')
        .order('created_at', { ascending: false });

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
    } finally {
      setLoading(false);
    }
  };

  const fetchTestTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('test_types')
        .select(`
          *,
          labs (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestTypes(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching test types',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleLabInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLabFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTestTypeInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTestTypeFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleTestTypeNumberChange = (name, value) => {
    setTestTypeFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let actionType;
      if (selectedLab) {
        await supabase
          .from('labs')
          .update(labFormData)
          .eq('id', selectedLab.id);
        actionType = 'Updated Lab';
      } else {
        await supabase
          .from('labs')
          .insert([labFormData]);
        actionType = 'Added Lab';
      }

      if (adminUser && adminUser.name) {
        await supabase.from('admin_activity_log').insert([
          {
            action: actionType,
            username: adminUser.name,
            details: labFormData.name,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      toast({
        title: 'Success',
        description: 'Lab saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onLabModalClose();
      fetchLabs();
    } catch (error) {
      toast({
        title: 'Error saving lab',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestTypeSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const testTypeData = {
        ...testTypeFormData,
        lab_id: selectedLab.id,
        cash_price: parseFloat(testTypeFormData.cash_price),
      };

      let actionType;
      if (selectedTestType) {
        await supabase
          .from('test_types')
          .update(testTypeData)
          .eq('id', selectedTestType.id);
        actionType = 'Updated Test Type';
      } else {
        await supabase
          .from('test_types')
          .insert([testTypeData]);
        actionType = 'Added Test Type';
      }

      if (adminUser && adminUser.name) {
        await supabase.from('admin_activity_log').insert([
          {
            action: actionType,
            username: adminUser.name,
            details: `${testTypeData.name} for ${selectedLab.name}`,
            created_at: new Date().toISOString(),
          },
        ]);
      }

      toast({
        title: 'Success',
        description: 'Test type saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onTestModalClose();
      fetchTestTypes();
    } catch (error) {
      toast({
        title: 'Error saving test type',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditLab = (lab) => {
    setSelectedLab(lab);
    setLabFormData({
      name: lab.name,
      address: lab.address || '',
      logo_url: lab.logo_url || '',
      contact_email: lab.contact_email || '',
      contact_phone: lab.contact_phone || '',
      is_active: lab.is_active,
    });
    onLabModalOpen();
  };

  const handleEditTestType = (testType) => {
    setSelectedTestType(testType);
    setTestTypeFormData({
      name: testType.name,
      description: testType.description || '',
      cash_price: testType.cash_price.toString(),
      tube_top_color: testType.tube_top_color || '',
      is_active: testType.is_active,
    });
    onTestModalOpen();
  };

  const handleViewTestTypes = (lab) => {
    setSelectedLab(lab);
    onTestTypesModalOpen();
  };

  const handleDeleteLab = async (id) => {
    if (window.confirm('Are you sure you want to delete this lab? This will also delete all associated test types.')) {
      try {
        const { error } = await supabase
          .from('labs')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Lab deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        fetchLabs();
        fetchTestTypes();
      } catch (error) {
        toast({
          title: 'Error deleting lab',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const handleDeleteTestType = async (id) => {
    if (window.confirm('Are you sure you want to delete this test type?')) {
      try {
        const { error } = await supabase
          .from('test_types')
          .delete()
          .eq('id', id);

        if (error) throw error;

        toast({
          title: 'Test type deleted successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });

        fetchTestTypes();
      } catch (error) {
        toast({
          title: 'Error deleting test type',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    }
  };

  const resetLabForm = () => {
    setSelectedLab(null);
    setLabFormData({
      name: '',
      address: '',
      logo_url: '',
      contact_email: '',
      contact_phone: '',
      is_active: true,
    });
  };

  const resetTestTypeForm = () => {
    setSelectedTestType(null);
    setTestTypeFormData({
      name: '',
      description: '',
      cash_price: '',
      tube_top_color: '',
      is_active: true,
    });
  };

  const labTestTypes = testTypes.filter(test => test.lab_id === selectedLab?.id);

  return (
    <Box p={6}>
      <Tabs>
        <TabList>
          <Tab>Labs</Tab>
          <Tab>All Test Types</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="lg">Lab Partnerships</Heading>
              <Button colorScheme="blue" onClick={() => { resetLabForm(); onLabModalOpen(); }}>
                Add New Lab
              </Button>
            </Flex>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Logo</Th>
                  <Th>Name</Th>
                  <Th>Address</Th>
                  <Th>Contact</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {labs.map((lab) => (
                  <Tr key={lab.id}>
                    <Td>
                      {lab.logo_url && (
                        <Image src={lab.logo_url} alt={`${lab.name} logo`} boxSize="50px" objectFit="contain" />
                      )}
                    </Td>
                    <Td fontWeight="bold">{lab.name}</Td>
                    <Td>{lab.address}</Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm">{lab.contact_email}</Text>
                        <Text fontSize="sm">{lab.contact_phone}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme={lab.is_active ? 'green' : 'red'}>
                        {lab.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <HStack spacing={2}>
                        <IconButton
                          icon={<ViewIcon />}
                          size="sm"
                          onClick={() => handleViewTestTypes(lab)}
                          aria-label="View test types"
                        />
                        <IconButton
                          icon={<EditIcon />}
                          size="sm"
                          onClick={() => handleEditLab(lab)}
                          aria-label="Edit lab"
                        />
                        <IconButton
                          icon={<DeleteIcon />}
                          size="sm"
                          colorScheme="red"
                          onClick={() => handleDeleteLab(lab.id)}
                          aria-label="Delete lab"
                        />
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>

          <TabPanel>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="lg">All Test Types</Heading>
            </Flex>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Test Name</Th>
                  <Th>Lab</Th>
                  <Th>Description</Th>
                  <Th>Cash Price</Th>
                  <Th>Tube Color</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {testTypes.map((testType) => (
                  <Tr key={testType.id}>
                    <Td fontWeight="bold">{testType.name}</Td>
                    <Td>{testType.labs?.name}</Td>
                    <Td>{testType.description}</Td>
                    <Td>${testType.cash_price}</Td>
                    <Td>
                      <Badge colorScheme="blue">{testType.tube_top_color}</Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={testType.is_active ? 'green' : 'red'}>
                        {testType.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td>
                      <IconButton
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditTestType(testType)}
                        aria-label="Edit test type"
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Lab Modal */}
      <Modal isOpen={isLabModalOpen} onClose={onLabModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedLab ? 'Edit Lab' : 'Add New Lab'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleLabSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Lab Name</FormLabel>
                  <Input
                    name="name"
                    value={labFormData.name}
                    onChange={handleLabInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Address</FormLabel>
                  <Input
                    name="address"
                    value={labFormData.address}
                    onChange={handleLabInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Logo URL</FormLabel>
                  <Input
                    name="logo_url"
                    value={labFormData.logo_url}
                    onChange={handleLabInputChange}
                    placeholder="/path/to/logo.png"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Contact Email</FormLabel>
                  <Input
                    name="contact_email"
                    type="email"
                    value={labFormData.contact_email}
                    onChange={handleLabInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Contact Phone</FormLabel>
                  <Input
                    name="contact_phone"
                    value={labFormData.contact_phone}
                    onChange={handleLabInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="is_active"
                    value={labFormData.is_active}
                    onChange={handleLabInputChange}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </Select>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onLabModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleLabSubmit} isLoading={loading}>
              {selectedLab ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Test Type Modal */}
      <Modal isOpen={isTestModalOpen} onClose={onTestModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedTestType ? 'Edit Test Type' : 'Add New Test Type'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <form onSubmit={handleTestTypeSubmit}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Test Name</FormLabel>
                  <Input
                    name="name"
                    value={testTypeFormData.name}
                    onChange={handleTestTypeInputChange}
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    name="description"
                    value={testTypeFormData.description}
                    onChange={handleTestTypeInputChange}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Cash Price</FormLabel>
                  <NumberInput
                    min={0}
                    precision={2}
                    value={testTypeFormData.cash_price}
                    onChange={(valueString, valueNumber) => handleTestTypeNumberChange('cash_price', valueNumber)}
                  >
                    <NumberInputField
                      placeholder="0.00"
                    />
                    <NumberInputStepper>
                      <NumberIncrementStepper />
                      <NumberDecrementStepper />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel>Tube Top Color</FormLabel>
                  <Select
                    name="tube_top_color"
                    value={testTypeFormData.tube_top_color}
                    onChange={handleTestTypeInputChange}
                    placeholder="Select tube color"
                  >
                    {tubeTopColors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    name="is_active"
                    value={testTypeFormData.is_active}
                    onChange={handleTestTypeInputChange}
                  >
                    <option value={true}>Active</option>
                    <option value={false}>Inactive</option>
                  </Select>
                </FormControl>
              </VStack>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onTestModalClose}>
              Cancel
            </Button>
            <Button colorScheme="blue" onClick={handleTestTypeSubmit} isLoading={loading}>
              {selectedTestType ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Test Types View Modal */}
      <Modal isOpen={isTestTypesModalOpen} onClose={onTestTypesModalClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Test Types for {selectedLab?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Text fontWeight="bold">Test Types ({labTestTypes.length})</Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={() => { resetTestTypeForm(); onTestModalOpen(); onTestTypesModalClose(); }}
                >
                  Add Test Type
                </Button>
              </Flex>

              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Test Name</Th>
                    <Th>Description</Th>
                    <Th>Cash Price</Th>
                    <Th>Tube Color</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {labTestTypes.map((testType) => (
                    <Tr key={testType.id}>
                      <Td fontWeight="bold">{testType.name}</Td>
                      <Td>{testType.description}</Td>
                      <Td>${testType.cash_price}</Td>
                      <Td>
                        <Badge colorScheme="blue">{testType.tube_top_color}</Badge>
                      </Td>
                      <Td>
                        <HStack spacing={1}>
                          <IconButton
                            icon={<EditIcon />}
                            size="xs"
                            onClick={() => { handleEditTestType(testType); onTestTypesModalClose(); onTestModalOpen(); }}
                            aria-label="Edit test type"
                          />
                          <IconButton
                            icon={<DeleteIcon />}
                            size="xs"
                            colorScheme="red"
                            onClick={() => handleDeleteTestType(testType.id)}
                            aria-label="Delete test type"
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onTestTypesModalClose}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LabManagement; 