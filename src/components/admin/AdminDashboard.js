import React from 'react';
import { Box, Heading, Text, keyframes } from '@chakra-ui/react';
import { useOutletContext } from 'react-router-dom';

const bounce = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
`;

function AdminDashboard() {
  const { adminUser } = useOutletContext();

  return (
    <Box textAlign="center" mt={20}>
      <Heading as="h1" size="4xl" mb={8} color="blue.600">
        Welcome
      </Heading>
      {adminUser && (
        <Text
          fontSize="6xl"
          fontWeight="bold"
          color="purple.500"
          as="span"
          display="inline-block"
          animation={`${bounce} 1.2s infinite`}
        >
          {adminUser.name}
        </Text>
      )}
    </Box>
  );
}

export default AdminDashboard; 