import { google } from 'googleapis';

// Type definitions
interface ClientInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface PropertyData {
  id: number;
  type: 'property';
  [key: string]: any;
}

interface InquiryData {
  id: number;
  type: 'inquiry';
  [key: string]: any;
}

interface SheetData {
  properties: PropertyData[];
  inquiries: InquiryData[];
  clients: ClientInfo[];
}

// Google Sheets configuration
export const SPREADSHEET_ID = '1sFpsOWC2QDSQdszSoxmqT_9KOMWiiIOw3tJJCAtUCLM';
export const SHEET_NAME = 'Sheet1';

// Initialize Google Sheets API
export async function getGoogleSheetsClient() {
  try {
    // For public sheets, we can use API key
    // For private sheets, we would need OAuth2
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return sheets;
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw error;
  }
}

// Fetch data from Google Sheets
export async function fetchSheetData(): Promise<SheetData> {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:K`, // Columns A to K based on your description
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return { properties: [], inquiries: [], clients: [] };
    }

    // Parse the data
    const headers = rows[0];
    const data = rows.slice(1);

    const properties: PropertyData[] = [];
    const inquiries: InquiryData[] = [];
    const clients = new Map<string, ClientInfo>();

    data.forEach((row, index) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header, i) => {
        rowData[header] = row[i] || '';
      });

      // Check if it's "Finding Tenant" -> Properties
      if (rowData['Type'] === 'Finding Tenant' || rowData['Requirement Type'] === 'Finding Tenant') {
        properties.push({
          id: index + 1,
          ...rowData,
          type: 'property'
        });
      }
      
      // Check if it's "Finding Space" -> Inquiries
      if (rowData['Type'] === 'Finding Space' || rowData['Requirement Type'] === 'Finding Space') {
        inquiries.push({
          id: index + 1,
          ...rowData,
          type: 'inquiry'
        });
      }

      // Extract client information from columns F, G, and K
      const clientInfo = {
        name: row[5] || '', // Column F (index 5)
        email: row[6] || '', // Column G (index 6)
        phone: row[10] || '', // Column K (index 10)
      };

      if (clientInfo.email && !clients.has(clientInfo.email)) {
        clients.set(clientInfo.email, {
          ...clientInfo,
          id: clients.size + 1,
        });
      }
    });

    return {
      properties,
      inquiries,
      clients: Array.from(clients.values()),
    };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

// For development/testing with local Excel file
export async function parseExcelFile(): Promise<SheetData> {
  if (typeof window === 'undefined') {
    // Server-side parsing
    const XLSX = require('xlsx');
    const fs = require('fs');
    
    try {
      const file = fs.readFileSync('./enoshinfra.xlsx');
      const workbook = XLSX.read(file, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      return processExcelData(data);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      return { properties: [], inquiries: [], clients: [] };
    }
  }
  return { properties: [], inquiries: [], clients: [] };
}

function processExcelData(data: any[]): SheetData {
  const properties: PropertyData[] = [];
  const inquiries: InquiryData[] = [];
  const clients = new Map<string, ClientInfo>();

  data.forEach((row, index) => {
    // Check requirement type
    const requirementType = row['Requirement Type'] || row['Type'] || '';
    
    if (requirementType.toLowerCase().includes('finding tenant')) {
      properties.push({
        id: index + 1,
        ...row,
        type: 'property'
      });
    }
    
    if (requirementType.toLowerCase().includes('finding space')) {
      inquiries.push({
        id: index + 1,
        ...row,
        type: 'inquiry'
      });
    }

    // Extract client information
    const clientEmail = row['Email'] || row['Client Email'] || '';
    const clientName = row['Name'] || row['Client Name'] || '';
    const clientPhone = row['Phone'] || row['Contact'] || '';

    if (clientEmail && !clients.has(clientEmail)) {
      clients.set(clientEmail, {
        id: clients.size + 1,
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
      });
    }
  });

  return {
    properties,
    inquiries,
    clients: Array.from(clients.values()),
  };
}

// Helper function to fetch data using API key for public sheets
export async function fetchPublicSheetData(): Promise<SheetData> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn('No Google API key found, using local Excel file');
      return parseExcelFile();
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}!A:K?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch sheet data');
    }

    const data = await response.json();
    const rows = data.values;
    
    if (!rows || rows.length === 0) {
      return { properties: [], inquiries: [], clients: [] };
    }

    // Parse the data similar to fetchSheetData
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const properties: PropertyData[] = [];
    const inquiries: InquiryData[] = [];
    const clients = new Map<string, ClientInfo>();

    dataRows.forEach((row: any[], index: number) => {
      const rowData: Record<string, any> = {};
      headers.forEach((header: string, i: number) => {
        rowData[header] = row[i] || '';
      });

      // Check if it's "Finding Tenant" -> Properties
      if (rowData['Type'] === 'Finding Tenant' || rowData['Requirement Type'] === 'Finding Tenant') {
        properties.push({
          id: index + 1,
          ...rowData,
          type: 'property'
        });
      }
      
      // Check if it's "Finding Space" -> Inquiries
      if (rowData['Type'] === 'Finding Space' || rowData['Requirement Type'] === 'Finding Space') {
        inquiries.push({
          id: index + 1,
          ...rowData,
          type: 'inquiry'
        });
      }

      // Extract client information from columns F, G, and K
      const clientInfo = {
        name: row[5] || '', // Column F (index 5)
        email: row[6] || '', // Column G (index 6)
        phone: row[10] || '', // Column K (index 10)
      };

      if (clientInfo.email && !clients.has(clientInfo.email)) {
        clients.set(clientInfo.email, {
          ...clientInfo,
          id: clients.size + 1,
        });
      }
    });

    return {
      properties,
      inquiries,
      clients: Array.from(clients.values()),
    };
  } catch (error) {
    console.error('Error fetching public sheet data:', error);
    // Fallback to local Excel file
    return parseExcelFile();
  }
}