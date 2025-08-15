import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('DIMO attestation proxy request received');
    
    const { payload, jwt } = req.body;
    
    if (!payload || !jwt) {
      return res.status(400).json({ error: 'Missing payload or JWT' });
    }
    
    console.log('Forwarding request to attest.dimo.zone');
    console.log('JWT (first 50 chars):', jwt.substring(0, 10) + '...' + jwt.substring(jwt.length - 4));
    console.log('Payload keys:', Object.keys(payload));
    
    // Forward the request to DIMO
    const dimoResponse = await fetch('https://attest.dimo.zone/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await dimoResponse.text();
    
    console.log('DIMO response status:', dimoResponse.status);
    
    // Return the response from DIMO
    res.status(dimoResponse.status).send(responseText);
    
  } catch (error) {
    console.error('Error in DIMO attestation proxy:', error);
    res.status(500).json({ error: 'Proxy error: ' + (error instanceof Error ? error.message : 'Unknown error') });
  }
}
