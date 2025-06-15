import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

function AdminLogin() {
  const [secretCode, setSecretCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('secret_code', secretCode);
      if (error) {
        setError('Database error: ' + error.message);
      } else if (data.length === 1) {
        localStorage.setItem('adminUser', JSON.stringify(data[0]));
        navigate('/admin');
      } else {
        setError('Invalid or duplicate secret code. Please contact admin.');
      }
    } catch (err) {
      setError('Unexpected error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 8 }}>
      <input
        type="password"
        value={secretCode}
        onChange={(e) => setSecretCode(e.target.value)}
        placeholder="Password"
        autoComplete="off"
        style={{ padding: 8, fontSize: 16 }}
        required
      />
      <button type="submit" disabled={isLoading} style={{ padding: 8, fontSize: 16 }}>
        {isLoading ? '...' : '→'}
      </button>
    </form>
  );
}

export default AdminLogin; 