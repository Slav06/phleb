import React from 'react';
import { Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, StatArrow, Button, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { useOutletContext, useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const { adminUser } = useOutletContext();
  const navigate = useNavigate();
  // Placeholder stats
  const stats = [
    {
      label: 'Total Phlebotomists',
      value: 26,
      change: 23.36,
      isIncrease: true,
    },
    {
      label: 'Total Submissions',
      value: 1,
      change: 9.05,
      isIncrease: true,
    },
    {
      label: 'Pending Submissions',
      value: 0,
      change: 9.05,
      isIncrease: false,
    },
    {
      label: 'Completed Submissions',
      value: 1,
      change: 14.05,
      isIncrease: true,
    },
  ];
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardShadow = useColorModeValue('md', 'dark-lg');

  return (
    <Box px={{ base: 2, md: 8 }} py={8} bg={useColorModeValue('gray.50', 'gray.900')} minH="100vh">
      <Heading as="h1" size="2xl" mb={8} fontWeight="bold">
        Welcome{adminUser && adminUser.name ? `, ${adminUser.name}` : ''}
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={6} mb={8}>
        {stats.map((stat, idx) => (
          <Box key={stat.label} bg={cardBg} boxShadow={cardShadow} borderRadius="lg" p={6}>
            <Stat>
              <StatLabel fontSize="lg">{stat.label}</StatLabel>
              <StatNumber fontSize="3xl">{stat.value}</StatNumber>
              <StatHelpText>
                <StatArrow type={stat.isIncrease ? 'increase' : 'decrease'} />
                {stat.change}%
              </StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <Box bg={cardBg} boxShadow={cardShadow} borderRadius="lg" p={6}>
          <Heading as="h2" size="lg" mb={4}>Quick Actions</Heading>
          <VStack spacing={4}>
            <Button colorScheme="blue" w="100%" size="lg" onClick={() => navigate('/admin/phlebotomists')}>
              Manage Mobile Labs
            </Button>
            <Button colorScheme="green" w="100%" size="lg" onClick={() => navigate('/admin/submissions')}>
              View Submissions
            </Button>
          </VStack>
        </Box>
        <Box bg={cardBg} boxShadow={cardShadow} borderRadius="lg" p={6}>
          <Heading as="h2" size="lg" mb={4}>Recent Activity</Heading>
          <Text color="gray.500">No recent activity to display</Text>
        </Box>
      </SimpleGrid>
    </Box>
  );
}

export default AdminDashboard; 