import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

function LandingPage() {
  const bgColor = useColorModeValue('gray.50', 'gray.800');
  const cardBg = useColorModeValue('white', 'gray.700');

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="container.xl" py={20}>
        <VStack spacing={12} align="center">
          <Heading textAlign="center" size="2xl">
            Welcome to Phlebotomy Services
          </Heading>
          
          <Text textAlign="center" fontSize="xl" color="gray.600">
            Choose your portal to get started
          </Text>

          <HStack spacing={8} wrap="wrap" justify="center">
            <Box
              p={8}
              bg={cardBg}
              borderRadius="lg"
              boxShadow="lg"
              maxW="sm"
              textAlign="center"
            >
              <VStack spacing={4}>
                <Heading size="md">Patient Portal</Heading>
                <Text color="gray.600">
                  Find a mobile lab and schedule your blood draw
                </Text>
                <Button
                  as={RouterLink}
                  to="/"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                >
                  Enter as Patient
                </Button>
              </VStack>
            </Box>

            <Box
              p={8}
              bg={cardBg}
              borderRadius="lg"
              boxShadow="lg"
              maxW="sm"
              textAlign="center"
            >
              <VStack spacing={4}>
                <Heading size="md">Mobile Lab Portal</Heading>
                <Text color="gray.600">
                  Manage appointments and working hours
                </Text>
                <Button
                  as={RouterLink}
                  to="/lab"
                  colorScheme="green"
                  size="lg"
                  width="full"
                >
                  Enter as Mobile Lab
                </Button>
              </VStack>
            </Box>

            <Box
              p={8}
              bg={cardBg}
              borderRadius="lg"
              boxShadow="lg"
              maxW="sm"
              textAlign="center"
            >
              <VStack spacing={4}>
                <Heading size="md">Admin Portal</Heading>
                <Text color="gray.600">
                  Manage mobile labs and view submissions
                </Text>
                <Button
                  as={RouterLink}
                  to="/admin"
                  colorScheme="purple"
                  size="lg"
                  width="full"
                >
                  Enter as Admin
                </Button>
              </VStack>
            </Box>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}

export default LandingPage; 