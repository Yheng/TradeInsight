// Simple script to create test user via API endpoint
const axios = require('axios');

async function createTestUser() {
  console.log('🌱 Creating test user via API...');
  
  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User'
  };
  
  try {
    const response = await axios.post('http://localhost:3000/api/auth/register', testUser, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Test user created successfully!');
      console.log('📧 Email:', testUser.email);
      console.log('👤 Username:', testUser.username);
      console.log('🔑 Password:', testUser.password);
      console.log('🎫 Token:', response.data.data.token);
    } else {
      console.log('❌ Failed to create user:', response.data.error);
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('✅ Test user already exists');
      console.log('📧 Email:', testUser.email);
      console.log('👤 Username:', testUser.username);
      console.log('🔑 Password:', testUser.password);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ API server is not running. Please start the server first:');
      console.log('   npm run dev:api');
    } else {
      console.log('❌ Error creating user:', error.response?.data || error.message);
    }
  }
}

createTestUser().catch(console.error);