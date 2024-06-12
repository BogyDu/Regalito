document.getElementById('availability-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const dates = document.getElementById('dates').value;

    const response = await fetch('http://localhost:5000/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, dates }),
    });

    if (response.ok) {
        alert('Data submitted successfully!');
        document.getElementById('availability-form').reset();
    } else {
        alert('Failed to submit data.');
    }
});