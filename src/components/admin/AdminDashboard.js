import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../../supabaseClient';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPhlebotomists: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    completedSubmissions: 0,
  });

  const toast = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch total phlebotomists
      const { count: phlebotomistCount } = await supabase
        .from('phlebotomist_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total submissions
      const { count: submissionCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true });

      // Fetch pending submissions
      const { count: pendingCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch completed submissions
      const { count: completedCount } = await supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      setStats({
        totalPhlebotomists: phlebotomistCount || 0,
        totalSubmissions: submissionCount || 0,
        pendingSubmissions: pendingCount || 0,
        completedSubmissions: completedCount || 0,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch dashboard statistics',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      <Heading mb={6}>Admin Dashboard</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
        <Stat
          px={4}
          py={5}
          bg="white"
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Total Phlebotomists</StatLabel>
          <StatNumber>{stats.totalPhlebotomists}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            23.36%
          </StatHelpText>
        </Stat>

        <Stat
          px={4}
          py={5}
          bg="white"
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Total Submissions</StatLabel>
          <StatNumber>{stats.totalSubmissions}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            9.05%
          </StatHelpText>
        </Stat>

        <Stat
          px={4}
          py={5}
          bg="white"
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Pending Submissions</StatLabel>
          <StatNumber>{stats.pendingSubmissions}</StatNumber>
          <StatHelpText>
            <StatArrow type="decrease" />
            9.05%
          </StatHelpText>
        </Stat>

        <Stat
          px={4}
          py={5}
          bg="white"
          shadow="base"
          rounded="lg"
        >
          <StatLabel>Completed Submissions</StatLabel>
          <StatNumber>{stats.completedSubmissions}</StatNumber>
          <StatHelpText>
            <StatArrow type="increase" />
            14.05%
          </StatHelpText>
        </Stat>
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        <GridItem>
          <Box bg="white" p={6} rounded="lg" shadow="base">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Quick Actions</Heading>
              <Button colorScheme="blue" onClick={() => window.location.href = '/admin/phlebotomists'}>
                Manage Mobile Labs
              </Button>
              <Button colorScheme="green" onClick={() => window.location.href = '/admin/submissions'}>
                View Submissions
              </Button>
            </VStack>
          </Box>
        </GridItem>

        <GridItem>
          <Box bg="white" p={6} rounded="lg" shadow="base">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Recent Activity</Heading>
              <Text>No recent activity to display</Text>
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}

export default AdminDashboard; 