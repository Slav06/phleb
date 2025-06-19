import React, { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, Button, HStack, VStack, Image, SimpleGrid, Link, Badge, useBreakpointValue, IconButton, Drawer, DrawerOverlay, DrawerContent, DrawerHeader, DrawerBody, useDisclosure
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { supabase } from '../supabaseClient';

// Heroicons SVGs
const ComputerIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>
);
const CarIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><rect x="3" y="11" width="18" height="6" rx="2"/><path d="M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>
);
const StarIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><polygon points="12 2 15 8.5 22 9.3 17 14.1 18.2 21 12 17.8 5.8 21 7 14.1 2 9.3 9 8.5 12 2"/></svg>
);
const LockIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><rect x="5" y="11" width="14" height="8" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const CalendarIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 9h18"/></svg>
);
const HomeIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><path d="M3 10l9-7 9 7v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3H9v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z"/></svg>
);
const ChartIcon = (
  <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#2563EB" strokeWidth="2"><path d="M3 17v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const LAB_LOGOS = [
  { name: 'Quest Diagnostics', url: '/quest-logo.svg' },
  { name: 'LabCorp', url: '/labcorp-logo.svg' },
];

const BENEFITS = [
  { icon: ComputerIcon, title: 'Easy Booking', desc: 'Book your blood draw online in minutes—no phone calls or waiting rooms.' },
  { icon: CarIcon, title: 'Fast Routing', desc: 'We route the nearest mobile phlebotomist to your location for the fastest service.' },
  { icon: StarIcon, title: 'Trusted Reviews', desc: 'See all mobile lab reviews before you book—choose the best for your needs.' },
  { icon: LockIcon, title: 'Secure & Private', desc: 'Your health data is encrypted and protected. We value your privacy.' },
];

const HOW_IT_WORKS = [
  { icon: CalendarIcon, title: 'Book', desc: 'Schedule your blood draw online for a time that works for you.' },
  { icon: HomeIcon, title: 'Get Visited', desc: 'A certified phlebotomist comes to your home or office—no travel needed.' },
  { icon: ChartIcon, title: 'Get Results', desc: 'Your results are sent directly to you and your doctor securely.' },
];

export default function NewLandingPage() {
  const [labs, setLabs] = useState([]);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showComingSoon, setShowComingSoon] = useState({ book: false, join: false });

  useEffect(() => {
    // Fetch labs from database
    supabase.from('labs').select('id, name, logo_url').then(({ data }) => {
      if (data) setLabs(data);
    });
  }, []);

  return (
    <Box minH="100vh" bgGradient="linear(to-b, #f7fafc, #e3eafc 80%)" color="#2B2D42" fontFamily="'Inter', 'Nunito', 'Segoe UI', Arial, sans-serif">
      {/* Sticky Header */}
      <Flex as="header" align="center" justify="space-between" px={{ base: 4, md: 12 }} py={3} bg="white" boxShadow="sm" position="sticky" top={0} zIndex={10}>
        <HStack spacing={3} align="center">
          <Image src="/logo.png" alt="At Home Blood Draw Logo" maxW="320px" w="100%" />
        </HStack>
        {isMobile ? (
          <>
            <IconButton icon={<HamburgerIcon />} variant="ghost" onClick={onOpen} aria-label="Open menu" fontSize="2xl" />
            <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerHeader display="flex" alignItems="center" justifyContent="space-between">
                  <Box>Menu</Box>
                  <IconButton icon={<CloseIcon />} onClick={onClose} aria-label="Close menu" />
                </DrawerHeader>
                <DrawerBody>
                  <VStack spacing={4} align="stretch" mt={4}>
                    <Button as={RouterLink} to="/phlebotomist/login" colorScheme="blue" variant="ghost" size="lg">Mobile Lab Login</Button>
                    <Button as={RouterLink} to="/doctor/login" colorScheme="blue" variant="ghost" size="lg">Physician Login</Button>
                    <Button as={RouterLink} to="/patient/login" colorScheme="blue" variant="solid" size="lg">Patient Login</Button>
                  </VStack>
                </DrawerBody>
              </DrawerContent>
            </Drawer>
          </>
        ) : (
          <HStack spacing={4}>
            <Button as={RouterLink} to="/phlebotomist/login" colorScheme="blue" variant="ghost">Mobile Lab Login</Button>
            <Button as={RouterLink} to="/doctor/login" colorScheme="blue" variant="ghost">Physician Login</Button>
            <Button as={RouterLink} to="/patient/login" colorScheme="blue" variant="solid">Patient Login</Button>
          </HStack>
        )}
      </Flex>

      {/* Hero Section */}
      <Flex direction="column" align="center" justify="center" px={4} py={10} bgGradient="linear(to-b, #e3eafc 60%, #fff 100%)">
        <Box mb={6}>
          <Image src="/hero-illustration.svg" alt="Phlebotomist at home illustration" maxH="200px" mx="auto" borderRadius="xl" boxShadow="md" />
        </Box>
        <Heading as="h1" size="2xl" mb={3} color="#2B6CB0" textAlign="center" fontWeight="extrabold">Blood Draws at Your Doorstep</Heading>
        <Text fontSize="lg" mb={6} color="#2B2D42" textAlign="center">Easy, convenient, and fast mobile lab services—trusted by top labs and patients.</Text>
        <HStack spacing={4} justify="center">
          <Box>
            <Button colorScheme="red" size="lg" px={8} py={6} fontSize="xl" onClick={() => setShowComingSoon(s => ({ ...s, book: true }))}>Book Now</Button>
            {showComingSoon.book && <Text color="red.500" fontWeight="bold" mt={2} fontSize="md">Coming Soon</Text>}
          </Box>
          <Box>
            <Button colorScheme="blue" variant="outline" size="lg" px={8} py={6} fontSize="xl" onClick={() => setShowComingSoon(s => ({ ...s, join: true }))}>Join as Mobile Lab</Button>
            {showComingSoon.join && <Text color="blue.600" fontWeight="bold" mt={2} fontSize="md">Coming Soon</Text>}
          </Box>
        </HStack>
      </Flex>

      {/* Benefits Section */}
      <Box px={2} py={8} maxW="900px" mx="auto">
        <Heading as="h2" size="lg" mb={6} color="#2B6CB0" textAlign="center">Why Choose At Home Blood Draw?</Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 2, lg: 4 }} spacing={6}>
          {BENEFITS.map(benefit => (
            <VStack key={benefit.title} bg="white" borderRadius="2xl" boxShadow="lg" p={6} align="center" spacing={4}>
              <Box>{benefit.icon}</Box>
              <Text fontWeight="bold" fontSize="xl" color="#2B6CB0">{benefit.title}</Text>
              <Text fontSize="md" textAlign="center" color="gray.600">{benefit.desc}</Text>
            </VStack>
          ))}
        </SimpleGrid>
      </Box>

      {/* Labs We Work With */}
      <Box px={2} py={8} bg="#f1f5f9">
        <Heading as="h2" size="lg" mb={6} color="#2B6CB0" textAlign="center">Trusted by Leading Labs</Heading>
        <Flex overflowX="auto" gap={6} py={2} justify="center" align="center" wrap="nowrap">
          {LAB_LOGOS.map(lab => (
            <VStack key={lab.name} spacing={2} align="center" minW="120px">
              <Box bg="white" borderRadius="full" boxShadow="md" p={3} display="flex" alignItems="center" justifyContent="center">
                <Image src={lab.url} alt={lab.name} h="48px" w="48px" objectFit="contain" />
              </Box>
              <Text fontWeight="bold" color="#2B2D42" fontSize="sm">{lab.name}</Text>
            </VStack>
          ))}
          {labs.map(lab => (
            <VStack key={lab.id} spacing={2} align="center" minW="120px">
              <Box bg="white" borderRadius="full" boxShadow="md" p={3} display="flex" alignItems="center" justifyContent="center">
                <Image src={lab.logo_url || '/qls-logo.png'} alt={lab.name} h="48px" w="48px" objectFit="contain" />
              </Box>
              <Text fontWeight="bold" color="#2B2D42" fontSize="sm">{lab.name}</Text>
            </VStack>
          ))}
        </Flex>
      </Box>

      {/* How It Works */}
      <Box px={2} py={8} maxW="900px" mx="auto">
        <Heading as="h2" size="lg" mb={6} color="#2B6CB0" textAlign="center">How It Works</Heading>
        <VStack spacing={6} align="stretch">
          {HOW_IT_WORKS.map((step, idx) => (
            <Flex key={step.title} align="center" gap={4} bg="white" borderRadius="2xl" boxShadow="md" p={5}>
              <Box bgGradient="linear(to-br, #2B6CB0, #3182ce)" color="white" borderRadius="full" w="48px" h="48px" display="flex" alignItems="center" justifyContent="center" fontSize="2xl" fontWeight="bold">{step.icon}</Box>
              <Box>
                <Text fontWeight="bold" fontSize="lg" color="#2B6CB0">{step.title}</Text>
                <Text fontSize="md" color="gray.600">{step.desc}</Text>
              </Box>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Footer */}
      <Box as="footer" py={8} px={4} bg="#2B6CB0" color="white" textAlign="center">
        <VStack spacing={2}>
          <Text fontSize="md">&copy; {new Date().getFullYear()} AtHomeBloodDraw.com &mdash; All rights reserved.</Text>
          <Text fontSize="sm">Contact: support@athomeblooddraw.com</Text>
          <HStack spacing={4} justify="center" mt={2}>
            <Link href="mailto:support@athomeblooddraw.com" isExternal color="white"><i className="fas fa-envelope"></i> Email</Link>
            <Link href="https://twitter.com/" isExternal color="white"><i className="fab fa-twitter"></i> Twitter</Link>
            <Link href="https://facebook.com/" isExternal color="white"><i className="fab fa-facebook"></i> Facebook</Link>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
} 