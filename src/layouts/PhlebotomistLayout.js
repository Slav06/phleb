import React, { useEffect, useState } from 'react';
import { Box, Container, Spinner } from '@chakra-ui/react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function PhlebotomistLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Check if the lab exists and get agreement status
        const { data, error } = await supabase
          .from('phlebotomist_profiles')
          .select('agreement_signed')
          .eq('id', id)
          .single();

        console.log('PhlebotomistLayout fetched:', { data, error, pathname: location.pathname });

        if (error) throw error;

        // If agreement is signed and user is on /agreement, redirect to dashboard
        if (data.agreement_signed && location.pathname.endsWith('/agreement')) {
          navigate(`/lab/${id}`);
          return;
        }
        // If agreement not signed and not on /agreement, redirect to agreement page
        if (!data.agreement_signed && !location.pathname.endsWith('/agreement')) {
          navigate(`/lab/${id}/agreement`, { replace: true });
          return;
        }

        setLoading(false);
      } catch (err) {
        setError('Access denied');
        setLoading(false);
      }
    };

    checkAccess();
  }, [id, navigate, location.pathname]);

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Box textAlign="center" color="red.500">
          {error}
        </Box>
      </Box>
    );
  }

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