/**
 * Script untuk generate password hash menggunakan bcrypt
 * Jalankan: node generate-password-hash.js
 */

const bcrypt = require('bcrypt');

const password = 'password123';
const saltRounds = 10;

async function generateHash() {
  try {
    console.log('🔐 Generating password hash...\n');
    console.log('Password:', password);
    console.log('Salt Rounds:', saltRounds);
    console.log('-----------------------------------\n');
    
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Hash berhasil di-generate!\n');
    console.log('Hash:', hash);
    console.log('\n-----------------------------------');
    console.log('📋 Copy hash di atas untuk digunakan di SQL file');
    console.log('-----------------------------------\n');
    
    // Test verify
    const isValid = await bcrypt.compare(password, hash);
    console.log('🧪 Test Verification:', isValid ? '✅ Valid' : '❌ Invalid');
    
    // Generate SQL update statement
    console.log('\n📝 SQL Update Statement:');
    console.log('-----------------------------------');
    console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@weddingphotography.com';`);
    console.log('-----------------------------------\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Generate multiple hashes untuk semua user
async function generateAllHashes() {
  console.log('🔐 Generating password hashes untuk semua user...\n');
  
  const users = [
    { email: 'admin@weddingphotography.com', name: 'Admin' },
    { email: 'photographer1@weddingphotography.com', name: 'Photographer' },
    { email: 'videographer1@weddingphotography.com', name: 'Videographer' },
    { email: 'editor@weddingphotography.com', name: 'Editor' },
    { email: 'finance@weddingphotography.com', name: 'Finance' }
  ];
  
  console.log('Password untuk semua user:', password);
  console.log('-----------------------------------\n');
  
  for (const user of users) {
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`${user.name}:`);
    console.log(`Email: ${user.email}`);
    console.log(`Hash: ${hash}\n`);
  }
  
  console.log('-----------------------------------');
  console.log('✅ Selesai! Copy hash di atas ke mock-data.sql');
  console.log('-----------------------------------\n');
}

// Jalankan
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--all')) {
    generateAllHashes();
  } else {
    generateHash();
  }
}

module.exports = { generateHash, generateAllHashes };
