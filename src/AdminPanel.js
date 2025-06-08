import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
} from '@chakra-ui/react';
import { supabase } from './supabaseClient';
import PhlebotomistManagement from './components/admin/PhlebotomistManagement';

export default function AdminPanel() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.50" color="gray.800" py={8}>
      <Container maxW="container.xl">
        <Heading mb={8} textAlign="center">Admin Panel</Heading>
        
        <Tabs>
          <TabList>
            <Tab>Submissions</Tab>
            <Tab>Phlebotomists</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              {loading ? (
                <Box textAlign="center" py={8}>
                  <Spinner size="xl" />
                </Box>
              ) : (
                <Box overflowX="auto">
                  <Table variant="striped" colorScheme="gray">
                    <Thead>
                      <Tr>
                        <Th>Submitted At</Th>
                        <Th>Patient Name</Th>
                        <Th>Patient Address</Th>
                        <Th>Patient Email</Th>
                        <Th>Patient DOB</Th>
                        <Th>Doctor Name</Th>
                        <Th>Doctor Address</Th>
                        <Th>Doctor Phone</Th>
                        <Th>Doctor Fax</Th>
                        <Th>Doctor Email</Th>
                        <Th>Lab Brand</Th>
                        <Th>Blood Collection Time</Th>
                        <Th>Insurance Company</Th>
                        <Th>Insurance Policy Number</Th>
                        <Th>Need FedEx Label</Th>
                        <Th>FedEx Ship From</Th>
                        <Th>STAT Test</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {submissions.map((s) => (
                        <Tr key={s.id || s.submitted_at}>
                          <Td>{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : ''}</Td>
                          <Td>{s.patientName}</Td>
                          <Td>{s.patientAddress}</Td>
                          <Td>{s.patientEmail}</Td>
                          <Td>{s.patientDOB}</Td>
                          <Td>{s.doctorName}</Td>
                          <Td>{s.doctorAddress}</Td>
                          <Td>{s.doctorPhone}</Td>
                          <Td>{s.doctorFax}</Td>
                          <Td>{s.doctorEmail}</Td>
                          <Td>{s.labBrand}</Td>
                          <Td>{s.bloodCollectionTime}</Td>
                          <Td>{s.insuranceCompany}</Td>
                          <Td>{s.insurancePolicyNumber}</Td>
                          <Td>{s.needFedexLabel ? 'Yes' : 'No'}</Td>
                          <Td>{s.fedexShipFrom}</Td>
                          <Td>{s.statTest ? 'Yes' : 'No'}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              )}
            </TabPanel>

            <TabPanel>
              <PhlebotomistManagement />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Box>
  );
} 