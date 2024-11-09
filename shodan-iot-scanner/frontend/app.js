function searchShodan() {
    const query = document.getElementById('query').value;
    fetch(`https://nombre-de-backend-en-railway.app/search?query=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '';
            data.forEach(device => {
                const deviceInfo = `
                    <div>
                        <p><strong>IP:</strong> ${device.ip_str}</p>
                        <p><strong>Puerto:</strong> ${device.port}</p>
                        <p><strong>Organización:</strong> ${device.org || 'Desconocido'}</p>
                        <p><strong>Ubicación:</strong> ${device.location.city || 'N/A'}, ${device.location.country_name || 'N/A'}</p>
                    </div>
                    <hr />
                `;
                resultsDiv.innerHTML += deviceInfo;
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
