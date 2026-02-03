exports.handler = async (event, context) => {
    try {
        console.log('Function started');
        
        const { httpMethod, body } = event;
        
        if (httpMethod === 'POST') {
            const data = JSON.parse(body);
            console.log('Energy data received:', data);
            
            // Mock response for now - real Google Sheets integration needs proper setup
            console.log('Mock response - Google Sheets integration not fully configured');
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Veriler başarıyla işlendi (mock mode)',
                    spreadsheetId: 'mock-spreadsheet-id',
                    sheetName: data.sheetName,
                    rowsAdded: data.data.length,
                    note: 'Gerçek Google Sheets entegrasyonu için environment variables kontrol edin'
                })
            };
        }
        
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Not found' })
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: error.message,
                details: 'Function execution failed'
            })
        };
    }
};
