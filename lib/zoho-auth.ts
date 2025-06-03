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
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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
    ...(state && { state }),
  });

  return `${config.authorizationUrl}?${params.toString()}`;
};

