import React from 'react';
import { Box, Container } from '@chakra-ui/react';
import { Outlet, useParams } from 'react-router-dom';

function PhlebotomistLayout() {
  const { id } = useParams();
  return (
    <Box minH="100vh" bg="gray.50">
      {/* Navigation removed for mobile lab portal */}
      <Container maxW="container.xl" py={8}>
        <Outlet context={{ labId: id }} />
      </Container>
    </Box>
  );
}

export default PhlebotomistLayout; 