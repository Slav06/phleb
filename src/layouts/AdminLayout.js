import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navigation from '../components/shared/Navigation';

function AdminLayout() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navigation userType="admin" />
      <Box w="100vw" maxW="100vw" px={0} py={0}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout; 