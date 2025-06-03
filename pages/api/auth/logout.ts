import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Clear the accessToken cookie by setting it to empty and expired
  res.setHeader('Set-Cookie', [
    `accessToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `zohoUserEmail=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ]);

  // Optionally redirect or just respond
  res.status(200).json({ message: 'Logged out' });
}

