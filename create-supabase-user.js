const { createClient } = require('@supabase/supabase-js');

// Read from environment variables for security
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Get email and password from command line arguments
const [,, email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node create-supabase-user.js <email> <password>');
  process.exit(1);
}

async function createUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Skip confirmation email
  });

  if (error) {
    console.error('Error creating user:', error.message);
    process.exit(1);
  } else {
    console.log('User created:', data.user);
    process.exit(0);
  }
}

createUser(email, password); 