import { useState } from 'react';

export default function TestStoracha() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testDelegation = async () => {
    setLoading(true);
    setResult('Testing...');

    try {
      const response = await fetch('/api/storacha/delegation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: 'did:key:z6MkrZ1r5d7z6B5m3k7D8q9w3x2y1a' }),
      });

      const contentType = response.headers.get('content-type');
      const text = await response.text();

      setResult(`
Status: ${response.status}
Content-Type: ${contentType}
Response (first 500 chars):
${text.substring(0, 500)}
      `);

      if (contentType?.includes('application/json')) {
        const json = JSON.parse(text);
        console.log('JSON Response:', json);
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Storacha API Test</h1>
      
      <button 
        onClick={testDelegation}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Delegation API'}
      </button>

      <pre style={{ 
        background: '#f4f4f4', 
        padding: '1rem', 
        borderRadius: '4px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word'
      }}>
        {result || 'Click the button to test the API'}
      </pre>

      <hr style={{ margin: '2rem 0' }} />

      <h2>Environment Check</h2>
      <ul>
        <li>STORACHA_KEY exists: {process.env.STORACHA_KEY ? '✅ Yes' : '❌ No'}</li>
        <li>STORACHA_PROOF exists: {process.env.STORACHA_PROOF ? '✅ Yes' : '❌ No'}</li>
      </ul>
    </div>
  );
}
