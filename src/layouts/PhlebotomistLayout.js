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
          .select('agreement_signed, send_agreement')
          .eq('id', id)
          .single();

        console.log('PhlebotomistLayout fetched:', { data, error, pathname: location.pathname });

        if (error) {
          console.error('Error fetching agreement status:', error);
          // If there's an error, don't block access - let the component handle it
          setLoading(false);
          return;
        }

        // If agreement is required and not signed and not on /agreement, redirect to agreement page
        const needsAgreement = !(
          data.send_agreement === 'no' ||
          data.send_agreement === false ||
          data.send_agreement === 0 ||
          data.send_agreement === null
        );
        if (needsAgreement) {
          if (data.agreement_signed && location.pathname.endsWith('/agreement')) {
            console.log('Agreement signed, redirecting to dashboard');
            navigate(`/lab/${id}`, { replace: true });
            return;
          }
          if (!data.agreement_signed && !location.pathname.endsWith('/agreement')) {
            console.log('Agreement not signed, redirecting to agreement page');
            navigate(`/lab/${id}/agreement`, { replace: true });
            return;
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error in checkAccess:', err);
        setError('Access denied');
        setLoading(false);
      }
    };

    // Add a small delay to ensure database updates have propagated
    const timeoutId = setTimeout(checkAccess, 100);
    
    return () => clearTimeout(timeoutId);
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