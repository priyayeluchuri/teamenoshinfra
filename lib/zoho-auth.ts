// zoho-auth.ts

export const getZohoConfig = (accountsServer: string = 'https://accounts.zoho.com') => ({
  authorizationUrl: `${accountsServer}/oauth/v2/auth`,
  tokenUrl: `${accountsServer}/oauth/v2/token`,
  revokeUrl: `${accountsServer}/oauth/v2/token/revoke`,

  clientId: process.env.NEXT_PUBLIC_ZOHO_CLIENT_ID || '',
  clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
  redirectUri: process.env.NEXT_PUBLIC_ZOHO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  scopes: 'AaaServer.profile.Read',

//  scopes: [
//    'ZohoMail.accounts.READ',
//    'ZohoMail.messages.READ',
 //   'profile.userinfo.read',
//    'email',
//  ].join(' '),

  responseType: 'code',
});

export const exchangeCodeForTokens = async (code: string, accountsServer: string) => {
  const zohoConfig = getZohoConfig(accountsServer);
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: zohoConfig.clientId,
    client_secret: zohoConfig.clientSecret,
    redirect_uri: zohoConfig.redirectUri,
    code,
  });
  const response = await fetch(zohoConfig.tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${response.status} - ${errorText}`);
  }

  return response.json();
};

export const getZohoUserInfo = async (accessToken: string, accountsServer: string) => {
  const response = await fetch(`${accountsServer}/oauth/user/info`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user info: ${response.status} - ${errorText}`);
  }

  return response.json();
};
export const getZohoAuthUrl = (state?: string, accountsServer = 'https://accounts.zoho.com') => {
  const config = getZohoConfig(accountsServer);

  const params = new URLSearchParams({
    response_type: config.responseType,
    client_id: config.clientId,
    scope: config.scopes,
    redirect_uri: config.redirectUri,
    access_type: 'offline',
    prompt: 'consent', // Forces Zoho to show login screen every time
    ...(state && { state }),
  });

  return `${config.authorizationUrl}?${params.toString()}`;
};
export const revokeToken = async (token: string, tokenType: 'access_token' | 'refresh_token', accountsServer: string) => {
  const zohoConfig = getZohoConfig(accountsServer);

  // CORRECTED: Removed 'grant_type: 'authorization_code''
  const params = new URLSearchParams({
    token: token,         // The token to revoke (access_token or refresh_token)
    token_type: tokenType, // 'access_token' or 'refresh_token'
    client_id: zohoConfig.clientId,
    client_secret: zohoConfig.clientSecret,
  });

  console.log(`Attempting to revoke Zoho token of type '${tokenType}' for accounts server: ${accountsServer}`);
  console.log(`Revocation request body (excluding full token): ${params.toString().replace(token, 'TOKEN_REDACTED')}`);

  const response = await fetch(zohoConfig.revokeUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Zoho Revocation Error: Status: ${response.status}, Response: ${errorText}`);
    throw new Error(`Failed to revoke Zoho token: ${response.status} - ${errorText}`);
  }

  console.log(`Zoho token of type '${tokenType}' revoked successfully.`);
  return response.json();
};
