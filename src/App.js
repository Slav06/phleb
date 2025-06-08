import React from 'react';
import { ChakraProvider, CSSReset, Box } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

// Components
import Navigation from './components/shared/Navigation';
import BloodDrawForm from './BloodDrawForm';
import AdminPanel from './AdminPanel';
import PhlebotomistList from './components/patient/PhlebotomistList';
import PhlebotomistProfile from './components/patient/PhlebotomistProfile';
import PhlebotomistDashboard from './components/phlebotomist/PhlebotomistDashboard';
import ChatThread from './components/chat/ChatThread';

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  return (
    <ChakraProvider>
      <CSSReset />
      <Router>
        <Box minH="100vh" bg="gray.50">
          <Navigation />
          <Box p={4}>
            <Routes>
              <Route path="/" element={<BloodDrawForm />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/phlebotomists" element={<PhlebotomistList />} />
              <Route path="/phlebotomist/:id" element={<PhlebotomistProfile />} />
              <Route path="/dashboard" element={<PhlebotomistDashboard />} />
              <Route path="/chat/:threadId" element={<ChatThread />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ChakraProvider>
  );
}

export default App;
