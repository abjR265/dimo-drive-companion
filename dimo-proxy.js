import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 3003;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// DIMO attestation proxy endpoint
app.post('/api/dimo-attestation', async (req, res) => {
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
    // Sanitize sensitive data in response
    const sanitizedResponse = responseText.length > 100 ? 
      responseText.substring(0, 50) + '...' + responseText.substring(responseText.length - 20) : 
      responseText;
    console.log('DIMO response:', sanitizedResponse);
    
    // Return the response from DIMO
    res.status(dimoResponse.status).send(responseText);
    
  } catch (error) {
    console.error('Error in DIMO attestation proxy:', error);
    res.status(500).json({ error: 'Proxy error: ' + error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'DIMO proxy server is running' });
});

app.listen(PORT, () => {
  console.log(`DIMO proxy server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log('Available endpoints:');
  console.log('  POST /api/dimo-attestation - Proxy DIMO attestation requests');
  console.log('  GET  /health - Health check');
});
