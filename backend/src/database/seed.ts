import { getDatabase } from './connection';

export async function seedTestData(): Promise<void> {
  const db = await getDatabase();
  
  // Create a test user for development/testing
  const testUserId = 'temp-user-id';
  const testUserEmail = 'test@example.com';
  
  try {
    // Check if test user already exists
    const existingUser = await db.get(
      'SELECT id FROM users WHERE id = ?',
      [testUserId]
    );
    
    if (!existingUser) {
      await db.run(`
        INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        testUserId,
        testUserEmail,
        'test-password-hash', // In real app, this would be properly hashed
        'Test User',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user already exists');
    }
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}