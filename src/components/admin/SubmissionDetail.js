import React, { useEffect, useState } from 'react';
import { Box, Heading, Text, VStack, HStack, Input, Button, Spinner, Divider, FormControl, FormLabel, Select, useToast } from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function SubmissionDetail() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubmission = async () => {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', id)
        .single();
      setSubmission(data);
      setForm(data || {});
      setLoading(false);
    };
    fetchSubmission();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${field}/${id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from(field).upload(filePath, file, { upsert: true });
    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, status: 'error' });
      return;
    }
    const { data: urlData } = supabase.storage.from(field).getPublicUrl(filePath);
    let column = '';
    if (field === 'lab-results') column = 'lab_results_url';
    else if (field === 'fedex-labels') column = 'fedex_label_url';
    else column = `${field}_url`;
    setForm(f => ({ ...f, [column]: urlData.publicUrl }));
    toast({ title: 'File uploaded', status: 'success' });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('submissions').update(form).eq('id', id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error saving', description: error.message, status: 'error' });
    } else {
      toast({ title: 'Saved', status: 'success' });
      navigate('/admin/submissions');
    }
  };

  if (loading) return <Spinner size="xl" mt={12} />;
  if (!submission) return <Text mt={12}>Submission not found.</Text>;

  return (
    <Box maxW="700px" mx="auto" mt={8} p={8} bg="white" borderRadius="xl" boxShadow="xl">
      <Heading size="lg" mb={4}>Edit Blood Draw Submission</Heading>
      <Divider mb={4} />
      <VStack align="start" spacing={4}>
        <FormControl>
          <FormLabel>Patient Name</FormLabel>
          <Input name="patient_name" value={form.patient_name || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Patient Email</FormLabel>
          <Input name="patient_email" value={form.patient_email || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Patient Address</FormLabel>
          <Input name="patient_address" value={form.patient_address || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Patient DOB</FormLabel>
          <Input name="patient_dob" value={form.patient_dob || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Doctor Name</FormLabel>
          <Input name="doctor_name" value={form.doctor_name || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Doctor Email</FormLabel>
          <Input name="doctor_email" value={form.doctor_email || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Doctor Phone</FormLabel>
          <Input name="doctor_phone" value={form.doctor_phone || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Doctor Fax</FormLabel>
          <Input name="doctor_fax" value={form.doctor_fax || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Doctor Address</FormLabel>
          <Input name="doctor_address" value={form.doctor_address || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Lab Brand</FormLabel>
          <Input name="lab_brand" value={form.lab_brand || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Blood Collection Time</FormLabel>
          <Input name="blood_collection_time" value={form.blood_collection_time || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Insurance Company</FormLabel>
          <Input name="insurance_company" value={form.insurance_company || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Insurance Policy Number</FormLabel>
          <Input name="insurance_policy_number" value={form.insurance_policy_number || ''} onChange={handleChange} />
        </FormControl>
        <FormControl>
          <FormLabel>Status</FormLabel>
          <Select name="status" value={form.status || ''} onChange={handleChange}>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="in_progress">In Progress</option>
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>FedEx Label</FormLabel>
          {form.fedex_label_url ? (
            <Button as="a" href={form.fedex_label_url} target="_blank" colorScheme="blue" mb={2}>View FedEx Label</Button>
          ) : null}
          <Input type="file" accept="application/pdf,image/*" onChange={e => handleFileUpload('fedex-labels', e.target.files[0])} />
        </FormControl>
        <FormControl>
          <FormLabel>Lab Results</FormLabel>
          {form.lab_results_url ? (
            <Button as="a" href={form.lab_results_url} target="_blank" colorScheme="green" mb={2}>View Lab Results</Button>
          ) : null}
          <Input type="file" accept="application/pdf,image/*" onChange={e => handleFileUpload('lab-results', e.target.files[0])} />
        </FormControl>
      </VStack>
      <HStack mt={8} spacing={4}>
        <Button colorScheme="blue" onClick={handleSave} isLoading={saving}>Save</Button>
        <Button variant="outline" onClick={() => navigate('/admin/submissions')}>Back</Button>
      </HStack>
    </Box>
  );
} 