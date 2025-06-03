// pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize, parse } from 'cookie'; // Import 'parse'
import { revokeToken } from '../../../lib/zoho-auth'; // Import revokeToken

export default async function handler(req: NextApiRequest, res: NextApiResponse) { // Make handler async
  console.log('Logout endpoint called:', req.method);

  try {
    const cookies = parse(req.headers.cookie || '');
    const refreshToken = cookies.refreshToken;
    const accountsServer = cookies.accountsServer || 'https://accounts.zoho.com'; // Assuming you might set this cookie on login
      // Log the refresh token (or part of it) to confirm it's present and looks valid
   // console.log('Refresh token retrieved for revocation:', refreshToken ? refreshToken.substring(0, 10) + '...' : 'No refresh token found in cookies');

    // 1. Attempt to revoke the refresh token with Zoho
   // if (refreshToken) {
   //   try {
    //    console.log('Attempting to revoke Zoho refresh token...');
     //   // Pass the accountsServer if you have it
      //  await revokeToken(refreshToken, 'refresh_token', accountsServer);
      //  console.log('Zoho refresh token revoked successfully.');
      //} catch (revokeError) {
       // console.error('Error revoking Zoho refresh token:', revokeError);
        // Continue clearing local cookies even if Zoho revocation fails
      //}
   // }

    // 2. Clear cookies
    res.setHeader('Set-Cookie', [
      serialize('accessToken', '', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: -1,
      }),
      serialize('refreshToken', '', {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: -1,
      }),
      serialize('zohoUserEmail', '', {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: -1,
      }),
      // You might also want to clear accountsServer cookie if you set it
      serialize('accountsServer', '', {
        path: '/',
        httpOnly: false, // Or true, depending on how you use it
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: -1,
      }),
    ]);

    console.log('Local cookies cleared successfully');

    res.status(200).json({
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
