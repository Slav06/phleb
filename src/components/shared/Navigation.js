import React from 'react';
import {
  Box,
  Flex,
  Button,
  Stack,
  useColorModeValue,
  useDisclosure,
  IconButton,
  HStack,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useLocation } from 'react-router-dom';

function Navigation({ userType = 'patient', labId }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  const bgColor = useColorModeValue('white', 'gray.900');
  const hoverBg = useColorModeValue('gray.200', 'gray.700');

  // Dynamic links for phlebotomist
  const phlebotomistLinks = labId
    ? [
        { name: 'Dashboard', path: `/lab/${labId}` },
        { name: 'Working Hours', path: `/lab/${labId}/working-hours` },
        { name: 'New Blood Draw', path: `/lab/${labId}/new-blood-draw` },
      ]
    : [
        { name: 'Dashboard', path: '/lab' },
        { name: 'Working Hours', path: '/lab/working-hours' },
        { name: 'New Blood Draw', path: '/lab/new-blood-draw' },
      ];

  const Links = {
    patient: [
      { name: 'Home', path: '/patient' },
      { name: 'Find Phlebotomist', path: '/patient' },
    ],
    phlebotomist: phlebotomistLinks,
    admin: [
      { name: 'Dashboard', path: '/admin' },
      { name: 'Mobile Labs', path: '/admin/phlebotomists' },
      { name: 'Submissions', path: '/admin/submissions' },
    ],
  };

  return (
    <Box bg={bgColor} px={4} boxShadow="sm">
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <IconButton
          size={'md'}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={'Open Menu'}
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems={'center'}>
          <Box>
            <ChakraLink as={RouterLink} to="/" fontWeight="bold" fontSize="lg">
              <img src="/logo.png" alt="At Home Blood Draw Logo" style={{ height: 40, width: 'auto', display: 'block' }} />
            </ChakraLink>
          </Box>
          <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            {Links[userType].map((link) => (
              <ChakraLink
                key={link.name}
                as={RouterLink}
                to={link.path}
                px={2}
                py={1}
                rounded={'md'}
                _hover={{
                  textDecoration: 'none',
                  bg: hoverBg,
                }}
                bg={location.pathname === link.path ? 'blue.500' : 'transparent'}
                color={location.pathname === link.path ? 'white' : 'inherit'}
              >
                {link.name}
              </ChakraLink>
            ))}
          </HStack>
        </HStack>
        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            <Button
              as={RouterLink}
              to="/"
              variant={'ghost'}
              colorScheme="blue"
              size="sm"
            >
              Back to Home
            </Button>
          </Stack>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}>
            {Links[userType].map((link) => (
              <ChakraLink
                key={link.name}
                as={RouterLink}
                to={link.path}
                px={2}
                py={1}
                rounded={'md'}
                _hover={{
                  textDecoration: 'none',
                  bg: hoverBg,
                }}
                bg={location.pathname === link.path ? 'blue.500' : 'transparent'}
                color={location.pathname === link.path ? 'white' : 'inherit'}
              >
                {link.name}
              </ChakraLink>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
}

export default Navigation; 