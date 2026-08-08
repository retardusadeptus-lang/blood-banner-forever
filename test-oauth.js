const clientId = '4880ec3f26d14a979d6eb1ae92f9ee95';
const clientSecret = 'VzHREjokwAaR6RszAtDm13PYUh1Q8zuC';

(async () => {
  console.log('Testing token endpoint with provided credentials...\n');
  
  for (const region of ['eu', 'us', 'tw', 'kr']) {
    const url = `https://${region}.battle.net/oauth/token`;
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'test-code',
      redirect_uri: 'http://localhost:3000/api/auth/bnet/callback'
    });
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });
      
      const text = await response.text();
      console.log(`[${region}] Status: ${response.status}`);
      console.log(`[${region}] Response: ${text}\n`);
    } catch (error) {
      console.log(`[${region}] Error: ${error.message}\n`);
    }
  }
})();
