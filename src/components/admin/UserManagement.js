import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useDisclosure,
  HStack,
} from '@chakra-ui/react';
import { supabase } from '../../supabaseClient';
import { useOutletContext, Navigate } from 'react-router-dom';

function UserManagement() {
  const { adminUser } = useOutletContext();
  const [users, setUsers] = useState([]);
  const [newSecretCode, setNewSecretCode] = useState('');
  const [newName, setNewName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetCode, setResetCode] = useState('');
  const [newRole, setNewRole] = useState('regular');
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching users',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Only allow master admins (after all hooks)
  if (!adminUser || adminUser.role !== 'master') {
    return <Navigate to="/admin" replace />;
  }

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .insert([{ 
          name: newName,
          secret_code: newSecretCode,
          role: newRole
        }])
        .select();
      if (error) throw error;
      if (data && data.length > 0) {
        setUsers(prevUsers => [data[0], ...prevUsers]);
        setNewSecretCode('');
        setNewName('');
        setNewRole('regular');
        onClose();
        toast({
          title: 'User added successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Error adding user',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', userId);
      if (error) throw error;
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error deleting user',
        description: error.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openResetModal = (userId) => {
    setResetUserId(userId);
    setResetCode('');
    setResetModalOpen(true);
  };

  const closeResetModal = () => {
    setResetModalOpen(false);
    setResetUserId(null);
    setResetCode('');
  };

  const handleResetSecretCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Resetting code for user id:', resetUserId, 'to:', resetCode);
    
    if (!resetCode.trim()) {
      toast({
        title: 'Error',
        description: 'Secret code cannot be empty',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setIsLoading(false);
      return;
    }

    try {
      // First check if the user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', resetUserId)
        .single();

      if (fetchError) throw fetchError;
      if (!existingUser) {
        throw new Error('User not found');
      }

      // Then update the secret code
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          secret_code: resetCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', resetUserId);

      if (updateError) throw updateError;

      toast({
        title: 'Secret code reset successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      closeResetModal();
      fetchUsers();
    } catch (error) {
      console.error('Error resetting secret code:', error);
      toast({
        title: 'Error resetting secret code',
        description: error.message || 'An unexpected error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Button colorScheme="blue" mb={4} onClick={onOpen}>
        Add New User
      </Button>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Created At</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>{user.name || 'N/A'}</Td>
              <Td>{user.role === 'master' ? 'Master' : 'Regular'}</Td>
              <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
              <Td>
                <HStack spacing={2}>
                  {adminUser.role === 'master' && (
                    <Button
                      colorScheme="yellow"
                      size="sm"
                      onClick={() => openResetModal(user.id)}
                    >
                      Reset Secret Code
                    </Button>
                  )}
                  <Button
                    colorScheme="red"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Delete
                  </Button>
                </HStack>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleAddUser}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={newName}
                    placeholder="Enter name"
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Secret Code</FormLabel>
                  <Input
                    value={newSecretCode}
                    onChange={(e) => setNewSecretCode(e.target.value)}
                    placeholder="Enter secret code"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Type</FormLabel>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    style={{ width: '100%', padding: 8, fontSize: 16 }}
                  >
                    <option value="regular">Regular</option>
                    <option value="master">Master</option>
                  </select>
                  <Box fontSize="sm" color="gray.600" mt={2}>
                    <b>Master:</b> Can manage users and reset secret codes.<br />
                    <b>Regular:</b> Cannot manage users or reset secret codes.
                  </Box>
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="blue"
                  width="full"
                  isLoading={isLoading}
                >
                  Add User
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
      <Modal isOpen={resetModalOpen} onClose={closeResetModal}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Reset Secret Code</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <form onSubmit={handleResetSecretCode}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>New Secret Code</FormLabel>
                  <Input
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="Enter new secret code"
                  />
                </FormControl>
                <Button
                  type="submit"
                  colorScheme="yellow"
                  width="full"
                  isLoading={isLoading}
                >
                  Reset Secret Code
                </Button>
              </VStack>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}

export default UserManagement; 