import type { NextApiRequest, NextApiResponse } from 'next';
import { getZohoAuthUrl } from '../../../lib/zoho-auth';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get Zoho accounts server from query or default
  const accountsServer = req.query['accounts-server']?.toString() || 'https://accounts.zoho.com';

  const state = Math.random().toString(36).substring(2);

  const authUrl = getZohoAuthUrl(state, accountsServer);

  // Optionally store state in a cookie/session here for CSRF mitigation

  res.redirect(authUrl);
}

