exports.handler = async (event, context) => {
    try {
        console.log('Function started');
        
        const { httpMethod, body } = event;
        
        if (httpMethod === 'POST') {
            const data = JSON.parse(body);
            console.log('Energy data received:', data);
            
            // GitHub Actions'ı tetikle
            const githubToken = process.env.GITHUB_TOKEN;
            if (!githubToken) {
                throw new Error('GitHub token not configured');
            }
            
            const response = await fetch('https://api.github.com/repos/kojenerasyon-admin/kojenerasyon-sistemi/dispatches', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    event_type: 'save-energy-data',
                    client_payload: { data: data }
                })
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('GitHub response:', result);
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Veriler GitHub Actions ile Google Sheets\'e gönderildi',
                    githubWorkflowId: result.id,
                    sheetName: data.sheetName,
                    rowsAdded: data.data.length
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
                details: 'GitHub Actions hatası'
            })
        };
    }
};
