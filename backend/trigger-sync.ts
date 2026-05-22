async function sync() {
    const id = '77195c8e-17f9-4b2d-9d65-c4acd560846b';
    try {
        const res = await fetch(`http://localhost:5000/api/projects/${id}/sync-finance`, { method: 'POST' });
        const data = await res.json();
        console.log('Sync response:', JSON.stringify(data, null, 2));
        console.log(`\namount_paid updated to: ${data.amountPaid}`);
        console.log(`payment_status updated to: ${data.paymentStatus}`);
    } catch (e: any) {
        console.error('Sync failed:', e.message);
    }
}

sync();
