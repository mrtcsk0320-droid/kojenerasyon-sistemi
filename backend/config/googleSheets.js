const { GoogleAuth } = require('google-auth-library');

async function GoogleSheetsAPI() {
    try {
        const auth = new GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                project_id: process.env.GOOGLE_PROJECT_ID
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const authClient = await auth.getClient();
        const { google } = require('googleapis');
        
        return google.sheets({ version: 'v4', auth: authClient });
    } catch (error) {
        console.error('Google Sheets API initialization error:', error);
        throw error;
    }
}

module.exports = { GoogleSheetsAPI };
