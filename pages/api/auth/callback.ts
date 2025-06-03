import type { NextApiRequest, NextApiResponse } from 'next';
import { exchangeCodeForTokens, getZohoUserInfo } from '../../../lib/zoho-auth';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { code, state, 'accounts-server': accountsServerEncoded } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code parameter' });
    }

    // Decode accounts-server URL or use default
    const accountsServer = typeof accountsServerEncoded === 'string'
      ? decodeURIComponent(accountsServerEncoded)
      : 'https://accounts.zoho.com';

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, accountsServer);

    if (!tokens.access_token) {
      throw new Error('No access_token returned from token exchange');
    }

    // Get user info
    const userInfo = await getZohoUserInfo(tokens.access_token, accountsServer);

    if (!userInfo.Email) {
      throw new Error('User info does not contain Email');
    }

    // Set cookies for access token, refresh token, and user email
    res.setHeader('Set-Cookie', [
      serialize('accessToken', tokens.access_token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokens.expires_in || 3600, // expires_in is usually in seconds
      }),
      serialize('refreshToken', tokens.refresh_token || '', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
      }),
      serialize('zohoUserEmail', userInfo.Email, {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      }),
    ]);

    // Redirect to dashboard or home page
    res.redirect('/dashboard');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}

