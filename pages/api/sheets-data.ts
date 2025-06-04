import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchSheetData, parseExcelFile } from '../../lib/google-sheets-service';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
   const { accessToken, zohoUserEmail } = req.cookies; // Get cookies from the request.

  // 1. Authentication check (based on me.ts logic).
  if (!accessToken) { // If accessToken is missing, return 401 Unauthorized.
    return res.status(401).json({ success: false, error: 'Unauthorized: Access token missing.' });
  }

  if (!zohoUserEmail || zohoUserEmail === 'no email stored') { // If zohoUserEmail is missing or "no email stored", return 401 Unauthorized.
    return res.status(401).json({ success: false, error: 'Unauthorized: Zoho user email not found.' });
  }

  const userEmail = zohoUserEmail; // Assign the zohoUserEmail to userEmail.

  try {
    let data;
    
    // Try to fetch from Google Sheets with service account
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Fetching from Google Sheets with service account...');
      data = await fetchSheetData();
    } else {
      // Fallback to Excel file if no service account credentials
      console.log('No service account credentials found, using Excel file...');
      data = await parseExcelFile();
    }
    
    res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
      source: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'google-sheets' : 'excel-file'
    });
  } catch (error) {
    console.error('Error in sheets-data API:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sheet data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
