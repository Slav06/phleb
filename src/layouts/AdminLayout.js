import React from 'react';
import {
  Box,
  Flex,
  Link,
  HStack,
  Button,
  useToast,
  IconButton,
  Spacer,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, Outlet } from 'react-router-dom';
import { FaHome, FaUsers, FaVials, FaFileMedical, FaUserMd } from 'react-icons/fa';

function AdminLayout() {
  const navigate = useNavigate();
  const toast = useToast();
  const adminUser = JSON.parse(localStorage.getItem('adminUser'));

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
    toast({
      title: 'Logged out successfully',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Top Navigation Bar - only show if logged in */}
      {adminUser && (
        <Flex as="nav" align="center" justify="space-between" wrap="wrap" p={4} bg="gray.800" color="white">
          <HStack spacing={8} align="center">
            <IconButton
              as={RouterLink}
              to="/admin"
              icon={<FaHome />}
              aria-label="Dashboard"
              variant="ghost"
              color="white"
              fontSize="2xl"
              _hover={{ color: 'blue.200', bg: 'gray.700' }}
            />
            <IconButton
              as={RouterLink}
              to="/admin/phlebotomists"
              icon={<FaVials />}
              aria-label="Mobile Labs"
              variant="ghost"
              color="white"
              fontSize="2xl"
              _hover={{ color: 'blue.200', bg: 'gray.700' }}
              title="Mobile Labs"
            />
            <IconButton
              as={RouterLink}
              to="/admin/submissions"
              icon={<FaFileMedical />}
              aria-label="Blood Files"
              variant="ghost"
              color="white"
              fontSize="2xl"
              _hover={{ color: 'blue.200', bg: 'gray.700' }}
              title="Blood Files"
            />
            <IconButton
              as={RouterLink}
              to="/admin/doctors"
              icon={<FaUserMd />}
              aria-label="Doctors"
              variant="ghost"
              color="white"
              fontSize="2xl"
              _hover={{ color: 'blue.200', bg: 'gray.700' }}
              title="Doctors"
            />
          </HStack>
          <Flex align="center">
            {adminUser.role === 'master' && (
              <IconButton
                as={RouterLink}
                to="/admin/users"
                icon={<FaUsers />}
                aria-label="User Management"
                variant="ghost"
                color="white"
                fontSize="2xl"
                _hover={{ color: 'blue.200', bg: 'gray.700' }}
                title="User Management"
                mr={4}
              />
            )}
            <Button colorScheme="red" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </Flex>
        </Flex>
      )}
      {/* Main Content */}
      <Box maxW="100vw" p={8}>
        <Outlet context={{ adminUser }} />
      </Box>
    </Box>
  );
}

export default AdminLayout; 