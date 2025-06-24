import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Type definitions
interface ClientInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  company: string;
  uniqueKey: string;
}

interface PropertyData {
  id: number;
  type: 'property';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  details: {
    col_C: string;
    col_D: string;
    col_E: string;
  };
  [key: string]: any;
}

interface InquiryData {
  id: number;
  type: 'inquiry';
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  details: {
    col_C: string;
    col_D: string;
    col_E: string;
  };
  [key: string]: any;
}

interface SheetData {
  properties: PropertyData[];
  inquiries: InquiryData[];
  clients: ClientInfo[];
}

// Google Sheets configuration from environment variables
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID || '1sFpsOWC2QDSQdszSoxmqT_9KOMWiiIOw3tJJCAtUCLM';
const SHEET_NAME = 'Sheet1';

// Initialize Google Sheets API with Service Account
export async function getGoogleSheetsClient() {
  try {
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Missing Google service account credentials');
    }

    const auth = new JWT({
      email: serviceAccountEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw error;
  }
}

// Fetch data from Google Sheets using Service Account
export async function fetchSheetData(): Promise<SheetData> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`, // Get all columns
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { properties: [], inquiries: [], clients: [] };
    }

    // Parse the data
    const headers = rows[0];
    const data = rows.slice(1);

    console.log('Headers:', headers); // Debug log

    const properties: PropertyData[] = [];
    const inquiries: InquiryData[] = [];
    const clientsMap = new Map<string, ClientInfo>();

    data.forEach((row, index) => {
      // Skip empty rows
      if (!row || row.length === 0) return;

      const rowData: Record<string, any> = {};
      headers.forEach((header, i) => {
        rowData[header] = row[i] || '';
      });

      // Extract client information
      const clientName = row[0] || ''; // Column A
      const clientEmail = row[5] || ''; // Column F
      const clientPhone = row[6] || ''; // Column G
      const clientCity = row[10] || ''; // Column K
      const clientCompany = row[7] || ''; //column H 
      // Create unique key for client (combination of name and email)
      const clientKey = `${clientName}_${clientEmail}`.toLowerCase();

      // Extract property/inquiry details from columns C, D, E
      const details = {
        col_C: row[2] || '', // Column C
        col_D: row[3] || '', // Column D
        col_E: row[4] || '', // Column E
      };

      // Check column B for requirement type
      const requirementType = row[1] || ''; // Column B

      // Check if it's "findTenant" -> Properties
      if (requirementType.toLowerCase().includes('findtenant') || 
          requirementType.toLowerCase().includes('find tenant') ||
          requirementType.toLowerCase().includes('finding tenant')) {
        properties.push({
          id: properties.length + 1,
          ...rowData,
          type: 'property',
          clientName,
          clientEmail,
          clientPhone,
          details,
          requirementType
        });
      }
      
      // Check if it's "findSpace" -> Inquiries
      if (requirementType.toLowerCase().includes('findspace') || 
          requirementType.toLowerCase().includes('find space') ||
          requirementType.toLowerCase().includes('finding space')) {
        inquiries.push({
          id: inquiries.length + 1,
          ...rowData,
          type: 'inquiry',
          clientName,
          clientEmail,
          clientPhone,
          details,
          requirementType
        });
      }

      // Add unique clients
      if (clientEmail && clientName && !clientsMap.has(clientKey)) {
        clientsMap.set(clientKey, {
          id: clientsMap.size + 1,
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
	  city: clientCity,
	  company: clientCompany,
          uniqueKey: clientKey
        });
      }
    });

    console.log(`Found ${properties.length} properties, ${inquiries.length} inquiries, ${clientsMap.size} clients`);

    return {
      properties,
      inquiries,
      clients: Array.from(clientsMap.values()),
    };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    // Return empty data instead of throwing
    return { properties: [], inquiries: [], clients: [] };
  }
}

// For development/testing with local Excel file
export async function parseExcelFile(): Promise<SheetData> {
  if (typeof window === 'undefined') {
    // Server-side parsing
    const XLSX = require('xlsx');
    const fs = require('fs');
    const path = require('path');
    
    try {
      const filePath = path.join(process.cwd(), 'enoshinfra.xlsx');
      const file = fs.readFileSync(filePath);
      const workbook = XLSX.read(file, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!data || data.length === 0) {
        return { properties: [], inquiries: [], clients: [] };
      }

      // Process as array data similar to Google Sheets
      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];

      console.log('Excel Headers:', headers);

      const properties: PropertyData[] = [];
      const inquiries: InquiryData[] = [];
      const clientsMap = new Map<string, ClientInfo>();

      rows.forEach((row, index) => {
        // Skip empty rows
        if (!row || row.length === 0) return;

        const rowData: Record<string, any> = {};
        headers.forEach((header, i) => {
          rowData[header] = row[i] || '';
        });

        // Extract client information
        const clientName = row[0] || ''; // Column A
        const clientEmail = row[6] || ''; // Column G
        const clientPhone = row[10] || ''; // Column K
        
        // Create unique key for client
        const clientKey = `${clientName}_${clientEmail}`.toLowerCase();

        // Extract property/inquiry details from columns C, D, E
        const details = {
          col_C: row[2] || '', // Column C
          col_D: row[3] || '', // Column D
          col_E: row[4] || '', // Column E
        };

        // Check column B for requirement type
        const requirementType = row[1] || ''; // Column B

        // Check if it's "findTenant" -> Properties
        if (requirementType.toLowerCase().includes('findtenant') || 
            requirementType.toLowerCase().includes('find tenant') ||
            requirementType.toLowerCase().includes('finding tenant')) {
          properties.push({
            id: properties.length + 1,
            ...rowData,
            type: 'property',
            clientName,
            clientEmail,
            clientPhone,
            details,
            requirementType
          });
        }
        
        // Check if it's "findSpace" -> Inquiries
        if (requirementType.toLowerCase().includes('findspace') || 
            requirementType.toLowerCase().includes('find space') ||
            requirementType.toLowerCase().includes('finding space')) {
          inquiries.push({
            id: inquiries.length + 1,
            ...rowData,
            type: 'inquiry',
            clientName,
            clientEmail,
            clientPhone,
            details,
            requirementType
          });
        }

        // Add unique clients
        if (clientEmail && clientName && !clientsMap.has(clientKey)) {
          clientsMap.set(clientKey, {
            id: clientsMap.size + 1,
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
	    city: clientCity,
	    company: clientCompany,
            uniqueKey: clientKey
          });
        }
      });

      console.log(`Excel: Found ${properties.length} properties, ${inquiries.length} inquiries, ${clientsMap.size} clients`);

      return {
        properties,
        inquiries,
        clients: Array.from(clientsMap.values()),
      };
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      return { properties: [], inquiries: [], clients: [] };
    }
  }
  return { properties: [], inquiries: [], clients: [] };
}
