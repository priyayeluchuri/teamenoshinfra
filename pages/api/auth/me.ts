import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { accessToken, zohoUserEmail } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.status(200).json({
    email: zohoUserEmail || 'no email stored',
  });
}

