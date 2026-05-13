const baseUrl = 'http://localhost:3000';

async function testInternalApis() {
  try {
    console.log('Testing /api/internal/users...');
    const usersRes = await fetch(`${baseUrl}/api/internal/users`, {
      headers: { 'Cookie': 'next-auth.session-token=...' } // Need session
    });
    console.log('Users status:', usersRes.status);
    
    console.log('Testing /api/internal/chats...');
    const chatsRes = await fetch(`${baseUrl}/api/internal/chats`);
    console.log('Chats status:', chatsRes.status);
    if (chatsRes.ok) {
      const chats = await chatsRes.json();
      console.log('Chats found:', chats.length);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}
// testInternalApis();
