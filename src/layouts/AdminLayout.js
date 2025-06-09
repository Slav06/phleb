import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import Navigation from '../components/shared/Navigation';

function AdminLayout() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Navigation userType="admin" />
      <Container maxW="container.xl" py={8}>
        <Outlet />
      </Container>
    </Box>
  );
}

export default AdminLayout; 