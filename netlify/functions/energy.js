const { GoogleAuth } = require('google-auth-library');

// Google Sheets API Configuration
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || 'your-spreadsheet-id';

async function getGoogleSheetsClient() {
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

exports.handler = async (event, context) => {
    try {
        const { httpMethod, body } = event;
        
        if (httpMethod === 'POST') {
            const data = JSON.parse(body);
            console.log('Energy data received:', data);
            
            // Google Sheets'e kaydet
            const sheets = await getGoogleSheetsClient();
            
            // Ay ve yılı al
            const date = new Date(data.data[0].date);
            const monthNames = ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 
                               'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'];
            const monthName = monthNames[date.getMonth()];
            const year = date.getFullYear();
            const sheetName = `${monthName} ${year}`;
            
            // Verileri hazırla
            const values = data.data.map(item => [
                item.date,
                item.time,
                item.vardiya,
                item.aktif || '',
                item.reaktif || '',
                item.aydemAktif || '',
                item.aydemReaktif || ''
            ]);
            
            // Google Sheets'e yaz
            console.log('Attempting to write to Google Sheets...');
            console.log('Spreadsheet ID:', SPREADSHEET_ID);
            console.log('Sheet Name:', sheetName);
            console.log('Values to write:', values);
            
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${sheetName}!A:G`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: values
                }
            });
            
            console.log('Google Sheets response:', response.data);
            console.log('Rows added:', response.data.updates?.updatedRows || 0);
            
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Veriler Google Sheets\'e başarıyla kaydedildi',
                    spreadsheetId: SPREADSHEET_ID,
                    sheetName: sheetName,
                    rowsAdded: values.length
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
                details: 'Google Sheets API hatası'
            })
        };
    }
};
