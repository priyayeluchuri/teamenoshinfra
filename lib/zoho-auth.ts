// Zoho OAuth Configuration
// This file contains the configuration for Zoho OAuth integration
// In production, these values should be stored in environment variables

export const zohoConfig = {
  // OAuth endpoints
  authorizationUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  revokeUrl: 'https://accounts.zoho.com/oauth/v2/token/revoke',
  
  // Client credentials (should be in .env.local in production)
  clientId: process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID || '',
  clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  
  // OAuth scopes
  scopes: [
    'ZohoMail.accounts.READ',
    'ZohoMail.messages.READ',
    'profile.userinfo.read',
    'email'
  ].join(' '),
  
  // Response type
  responseType: 'code',
  accessType: 'offline',
  prompt: 'consent'
};

// Helper function to generate OAuth URL
export const getZohoAuthUrl = (state?: string) => {
  const params = new URLSearchParams({
    response_type: zohoConfig.responseType,
    client_id: zohoConfig.clientId,
    scope: zohoConfig.scopes,
    redirect_uri: zohoConfig.redirectUri,
    access_type: zohoConfig.accessType,
    prompt: zohoConfig.prompt,
    ...(state && { state })
  });
  
  return `${zohoConfig.authorizationUrl}?${params.toString()}`;
};

// Helper function to exchange code for tokens
export const exchangeCodeForTokens = async (code: string) => {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: zohoConfig.clientId,
    client_secret: zohoConfig.clientSecret,
    redirect_uri: zohoConfig.redirectUri,
    code
  });
  
  const response = await fetch(zohoConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange code for tokens');
  }
  
  return response.json();
};

// Helper function to refresh access token
export const refreshAccessToken = async (refreshToken: string) => {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: zohoConfig.clientId,
    client_secret: zohoConfig.clientSecret,
    refresh_token: refreshToken
  });
  
  const response = await fetch(zohoConfig.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }
  
  return response.json();
};

// Helper function to revoke token
export const revokeToken = async (token: string) => {
  const params = new URLSearchParams({
    token
  });
  
  const response = await fetch(zohoConfig.revokeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    throw new Error('Failed to revoke token');
  }
  
  return response.json();
};

// Helper function to get user info
export const getZohoUserInfo = async (accessToken: string) => {
  const response = await fetch('https://accounts.zoho.com/oauth/user/info', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to get user info');
  }
  
  return response.json();
};