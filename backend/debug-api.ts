async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: '2026-05-05',
        description: 'TEST pembayaran',
        amount: 100000,
        type: 'Pemasukan',
        projectId: '77195c8e-17f9-4b2d-9d65-c4acd560846b',
        category: 'Pelunasan Acara Pernikahan',
        method: 'Transfer Bank',
        cardId: 'a378c45a-badc-4097-ab48-124f60a1ee9e',
        clientId: '5e53ec21-3f8a-4247-95cb-82313af3a266',
      })
    });
    
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (e: any) {
    console.error('Error:', e.message);
  }
}

test();
