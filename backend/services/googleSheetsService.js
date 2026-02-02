const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');
const config = require('../config/config');

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.spreadsheetId = config.google.spreadsheetId;
    this.initializeAuth();
  }

  async initializeAuth() {
    try {
      const auth = new GoogleAuth({
        credentials: {
          client_email: config.google.serviceAccount.email,
          private_key: config.google.serviceAccount.privateKey
        },
        scopes: config.google.scopes
      });

      this.auth = auth;
      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('Google Sheets authentication initialized');
    } catch (error) {
      console.error('Error initializing Google Sheets auth:', error);
      throw error;
    }
  }

  async ensureSheetExists(sheetName) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const sheetExists = response.data.sheets.some(
        sheet => sheet.properties.title === sheetName
      );

      if (!sheetExists) {
        await this.createSheet(sheetName);
      }
    } catch (error) {
      console.error(`Error ensuring sheet ${sheetName} exists:`, error);
      throw error;
    }
  }

  async createSheet(sheetName) {
    try {
      const requests = [
        {
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 20
              }
            }
          }
        }
      ];

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: { requests }
      });

      await this.addHeaders(sheetName);
      console.log(`Sheet ${sheetName} created successfully`);
    } catch (error) {
      console.error(`Error creating sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async addHeaders(sheetName) {
    const headers = this.getSheetHeaders(sheetName);
    
    try {
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headers.length - 1)}1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers]
        }
      });
    } catch (error) {
      console.error(`Error adding headers to ${sheetName}:`, error);
      throw error;
    }
  }

  getSheetHeaders(sheetName) {
    const headersMap = {
      'Production': ['Tarih', 'Vardiya', 'Uretim_MWh', 'Verimlilik_Yuzde', 'Durum'],
      'Users': ['ID', 'Ad', 'Email', 'Sifre_Hash', 'Rol', 'Aktif'],
      'Maintenance': ['ID', 'Tarih', 'Aciklama', 'Durum'],
      'Motors': ['Motor_ID', 'Tarih', 'Calisma_Saatleri', 'Uretim_MWh', 'Vardiya']
    };

    return headersMap[sheetName] || [];
  }

  async readData(range) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: range
      });

      return response.data.values || [];
    } catch (error) {
      console.error(`Error reading data from ${range}:`, error);
      throw error;
    }
  }

  async writeData(range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error writing data to ${range}:`, error);
      throw error;
    }
  }

  async appendData(range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: values
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Error appending data to ${range}:`, error);
      throw error;
    }
  }

  async getProductionData() {
    try {
      await this.ensureSheetExists(config.sheets.productionSheetName);
      const data = await this.readData(config.sheets.ranges.production);
      
      return this.parseProductionData(data);
    } catch (error) {
      console.error('Error getting production data:', error);
      throw error;
    }
  }

  async addProductionData(productionData) {
    try {
      await this.ensureSheetExists(config.sheets.productionSheetName);
      
      const values = [
        [
          productionData.tarih,
          productionData.vardiya,
          productionData.uretimMWh,
          productionData.verimlilikYuzde,
          productionData.durum
        ]
      ];

      return await this.appendData(config.sheets.ranges.production, values);
    } catch (error) {
      console.error('Error adding production data:', error);
      throw error;
    }
  }

  async getUsers() {
    try {
      await this.ensureSheetExists(config.sheets.usersSheetName);
      const data = await this.readData(config.sheets.ranges.users);
      
      return this.parseUserData(data);
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  async getMotorsData() {
    try {
      await this.ensureSheetExists(config.sheets.motorsSheetName);
      const data = await this.readData(config.sheets.ranges.motors);
      
      return this.parseMotorsData(data);
    } catch (error) {
      console.error('Error getting motors data:', error);
      throw error;
    }
  }

  async addMotorData(motorData) {
    try {
      await this.ensureSheetExists(config.sheets.motorsSheetName);
      
      const values = [
        [
          motorData.motorId,
          motorData.tarih,
          motorData.calismaSaatleri,
          motorData.uretimMWh,
          motorData.vardiya
        ]
      ];

      return await this.appendData(config.sheets.ranges.motors, values);
    } catch (error) {
      console.error('Error adding motor data:', error);
      throw error;
    }
  }

  parseMotorsData(data) {
    if (!data || data.length <= 1) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => ({
      motorId: row[0] || '',
      tarih: row[1] || '',
      calismaSaatleri: parseFloat(row[2]) || 0,
      uretimMWh: parseFloat(row[3]) || 0,
      vardiya: row[4] || ''
    }));
  }

  parseProductionData(data) {
    if (!data || data.length <= 1) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => ({
      tarih: row[0] || '',
      vardiya: row[1] || '',
      uretimMWh: parseFloat(row[2]) || 0,
      verimlilikYuzde: parseFloat(row[3]) || 0,
      durum: row[4] || 'active'
    }));
  }

  parseUserData(data) {
    if (!data || data.length <= 1) return [];
    
    const headers = data[0];
    const rows = data.slice(1);
    
    return rows.map(row => ({
      id: row[0] || '',
      ad: row[1] || '',
      email: row[2] || '',
      sifreHash: row[3] || '',
      rol: row[4] || 'Viewer',
      aktif: row[5] === 'true' || row[5] === true
    }));
  }

  async addUser(userData) {
    try {
      await this.ensureSheetExists('Users');
      
      const row = [
        userData.id || Date.now().toString(),
        userData.ad || '',
        userData.email || '',
        userData.sifreHash || '',
        userData.rol || 'Viewer',
        userData.aktif ? 'true' : 'false'
      ];
      
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Users!A:F',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [row]
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  }
}

module.exports = new GoogleSheetsService();
