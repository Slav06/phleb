import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Image,
  Badge,
  Button,
  useToast,
  Input,
  InputGroup,
  InputLeftElement,
} from '@chakra-ui/react';
import { SearchIcon, StarIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const PhlebotomistList = () => {
  const [phlebotomists, setPhlebotomists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPhlebotomists();
  }, []);

  const fetchPhlebotomists = async () => {
    try {
      const { data, error } = await supabase
        .from('phlebotomist_profiles')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .order('rating', { ascending: false });

      if (error) throw error;
      setPhlebotomists(data);
    } catch (error) {
      toast({
        title: 'Error fetching phlebotomists',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPhlebotomists = phlebotomists.filter(phleb =>
    phleb.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePhlebotomistClick = (phlebotomistId) => {
    navigate(`/phlebotomist/${phlebotomistId}`);
  };

  return (
    <Box p={4}>
      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search phlebotomists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </InputGroup>

      <VStack spacing={4} align="stretch">
        {filteredPhlebotomists.map((phleb) => (
          <Box
            key={phleb.id}
            p={4}
            borderWidth="1px"
            borderRadius="lg"
            cursor="pointer"
            onClick={() => handlePhlebotomistClick(phleb.id)}
            _hover={{ shadow: 'md' }}
          >
            <HStack spacing={4}>
              <Image
                src={phleb.profiles.avatar_url || 'https://via.placeholder.com/50'}
                alt={phleb.profiles.full_name}
                boxSize="50px"
                borderRadius="full"
              />
              <VStack align="start" flex={1}>
                <Text fontWeight="bold">{phleb.profiles.full_name}</Text>
                <HStack>
                  <StarIcon color="yellow.400" />
                  <Text>{phleb.rating.toFixed(1)}</Text>
                  <Badge colorScheme="green">${phleb.hourly_rate}/hr</Badge>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  {phleb.service_radius_miles} miles radius
                </Text>
              </VStack>
              <Button colorScheme="blue" size="sm">
                View Profile
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>
    </Box>
  );
};

export default PhlebotomistList; 