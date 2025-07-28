const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, 'database.db');

async function seedTestUser() {
  console.log('🌱 Seeding test user...');
  
  const db = new sqlite3.Database(dbPath);
  
  const testUser = {
    id: uuidv4(),
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    role: 'user'
  };
  
  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ? OR username = ?', 
      [testUser.email, testUser.username], 
      (err, row) => {
        if (err) {
          console.error('Error checking existing user:', err);
          return;
        }
        
        if (row) {
          console.log('✅ Test user already exists');
          console.log('📧 Email:', testUser.email);
          console.log('🔑 Password:', testUser.password);
          db.close();
          return;
        }
        
        // Insert test user
        db.run(`INSERT INTO users 
          (id, email, username, password_hash, first_name, last_name, role, is_email_verified, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            testUser.id,
            testUser.email,
            testUser.username,
            hashedPassword,
            testUser.firstName,
            testUser.lastName,
            testUser.role,
            1, // email verified
            new Date().toISOString(),
            new Date().toISOString()
          ],
          function(err) {
            if (err) {
              console.error('❌ Error creating test user:', err);
            } else {
              console.log('✅ Test user created successfully!');
              console.log('📧 Email:', testUser.email);
              console.log('👤 Username:', testUser.username);
              console.log('🔑 Password:', testUser.password);
              console.log('');
              console.log('You can now use these credentials to log in to the application.');
            }
            db.close();
          }
        );
      }
    );
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    db.close();
  }
}

// Run the seeder
seedTestUser().catch(console.error);