async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_holder_name: "Test Name",
        bank_name: "BCA",
        card_type: "DEBIT",
        last_four_digits: "1234",
        balance: 1000
      })
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (err) {
    console.error(err);
  }
}
test();
