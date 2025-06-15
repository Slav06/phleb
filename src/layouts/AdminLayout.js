import React from 'react';
import {
  Box,
  Flex,
  Link,
  HStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate, Outlet } from 'react-router-dom';

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
            <Link as={RouterLink} to="/admin" color="white" _hover={{ textDecoration: 'none', color: 'blue.200' }}>
              Dashboard
            </Link>
            {adminUser.role === 'master' && (
              <Link as={RouterLink} to="/admin/users" color="white" _hover={{ textDecoration: 'none', color: 'blue.200' }}>
                User Management
              </Link>
            )}
            <Link as={RouterLink} to="/admin/phlebotomists" color="white" _hover={{ textDecoration: 'none', color: 'blue.200' }}>
              Phlebotomists
            </Link>
            <Link as={RouterLink} to="/admin/submissions" color="white" _hover={{ textDecoration: 'none', color: 'blue.200' }}>
              Submissions
            </Link>
          </HStack>
          <Button colorScheme="red" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
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