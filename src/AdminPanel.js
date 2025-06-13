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
                          <Td>{s.patient_name}</Td>
                          <Td>{s.patient_address}</Td>
                          <Td>{s.patient_email}</Td>
                          <Td>{s.patient_dob}</Td>
                          <Td>{s.doctor_name}</Td>
                          <Td>{s.doctor_address}</Td>
                          <Td>{s.doctor_phone}</Td>
                          <Td>{s.doctor_fax}</Td>
                          <Td>{s.doctor_email}</Td>
                          <Td>{s.lab_brand}</Td>
                          <Td>{s.blood_collection_time}</Td>
                          <Td>{s.insurance_company}</Td>
                          <Td>{s.insurance_policy_number}</Td>
                          <Td>{s.need_fedex_label ? 'Yes' : 'No'}</Td>
                          <Td>{s.fedex_ship_from}</Td>
                          <Td>{s.stat_test ? 'Yes' : 'No'}</Td>
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