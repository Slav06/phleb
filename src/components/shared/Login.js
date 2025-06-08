import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('patient');
  const toast = useToast();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (error) throw error;

        // Create profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                full_name: fullName,
                role: role,
              },
            ]);

          if (profileError) throw profileError;

          // If phlebotomist, create phlebotomist profile
          if (role === 'phlebotomist') {
            const { error: phlebError } = await supabase
              .from('phlebotomist_profiles')
              .insert([
                {
                  id: data.user.id,
                  rating: 5.0,
                  hourly_rate: 50.00,
                },
              ]);

            if (phlebError) throw phlebError;
          }
        }

        toast({
          title: 'Account created successfully',
          description: 'Please check your email for verification.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        navigate('/');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} bg="white" borderRadius="lg" boxShadow="lg">
      <VStack spacing={6}>
        <Heading size="lg">
          {isSignUp ? 'Create Account' : 'Sign In'}
        </Heading>

        <Tabs isFitted variant="enclosed" width="100%">
          <TabList mb="1em">
            <Tab onClick={() => setIsSignUp(false)}>Sign In</Tab>
            <Tab onClick={() => setIsSignUp(true)}>Sign Up</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <form onSubmit={handleAuth}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={loading}
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </TabPanel>

            <TabPanel>
              <form onSubmit={handleAuth}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Role</FormLabel>
                    <Tabs
                      onChange={(index) => setRole(index === 0 ? 'patient' : 'phlebotomist')}
                      defaultIndex={0}
                    >
                      <TabList>
                        <Tab>Patient</Tab>
                        <Tab>Phlebotomist</Tab>
                      </TabList>
                    </Tabs>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    width="100%"
                    isLoading={loading}
                  >
                    Create Account
                  </Button>
                </VStack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default Login; 