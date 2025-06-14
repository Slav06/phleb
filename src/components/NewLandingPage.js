import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';

function NewLandingPage() {
  const bgGradient = useColorModeValue(
    'linear(to-br, blue.50, purple.50)',
    'linear(to-br, blue.900, purple.900)'
  );
  const textColor = useColorModeValue('gray.700', 'white');

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      position="relative"
      overflow="hidden"
    >
      {/* Decorative circles */}
      <Box
        position="absolute"
        top="-10%"
        right="-10%"
        w="500px"
        h="500px"
        borderRadius="full"
        bg="blue.200"
        opacity="0.1"
      />
      <Box
        position="absolute"
        bottom="-10%"
        left="-10%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="purple.200"
        opacity="0.1"
      />

      <Container maxW="container.xl" py={20} position="relative">
        <VStack spacing={12} align="center" textAlign="center">
          <Heading
            size="2xl"
            bgGradient="linear(to-r, blue.500, purple.500)"
            bgClip="text"
            fontWeight="extrabold"
            letterSpacing="tight"
          >
            Welcome to Modern Phlebotomy
          </Heading>

          <Text
            fontSize="2xl"
            color={textColor}
            maxW="2xl"
            lineHeight="tall"
          >
            Experience the future of blood collection services. 
            Professional, convenient, and at your doorstep.
          </Text>

          <Box
            w="full"
            maxW="4xl"
            borderRadius="2xl"
            overflow="hidden"
            boxShadow="2xl"
            position="relative"
          >
            <Image
              src="/hero-image.jpg"
              alt="Modern phlebotomy service"
              fallbackSrc="https://via.placeholder.com/800x400?text=Modern+Phlebotomy+Service"
              w="full"
              h="auto"
            />
          </Box>

          <VStack spacing={6} maxW="2xl">
            <Heading size="lg" color={textColor}>
              Why Choose Us?
            </Heading>
            <Text fontSize="lg" color={textColor}>
              • Professional mobile phlebotomy services
              <br />
              • Convenient at-home blood collection
              <br />
              • Certified and experienced phlebotomists
              <br />
              • Fast and reliable service
              <br />
              • Secure and confidential handling
            </Text>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}

export default NewLandingPage; 