import * as vscode from 'vscode';
import fetch from 'node-fetch'; // basically like requests in python 
import * as crypto from 'crypto';
import { refreshDeviceId } from './spotifyplayer';
// let storedVerifier = ''; // Will hold the verifier for later use

// 1. Generate code verifier and code challenge
function generateCodeVerifierAndChallenge() {
  const verifier = [...Array(64)].map(() => Math.random().toString(36)[2]).join(''); // basically generate as tring of 64 characters, eac character is mapped to a random string created 
  const challenge = crypto
    .createHash('sha256') // 
    .update(verifier)
    .digest()
    .toString('base64')
    .replace(/=/g, '') // replace special cahracters so they are URL safe 
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return { verifier, challenge };
}

// 2. Start the login process
export async function loginToSpotify(context: vscode.ExtensionContext) {
  await context.secrets.delete('spotifyAccessToken');
  await context.secrets.delete('spotifyRefreshToken');
  await context.globalState.update('spotifyTokenExpiry', undefined);
  await context.globalState.update('spotifyCodeVerifier', undefined); // important!

  const { verifier, challenge } = generateCodeVerifierAndChallenge(); // call previusly defined code generation 
  // storedVerifier = verifier; // using a global variable to try store the verifier 
  await context.globalState.update('spotifyCodeVerifier', verifier);

  const SPOTIFY_CLIENT_ID = '4d0b2ff2eb234ff39835e0cd437ee01f'; // ID info we got from website, may have to put it into a config file soon 
  const SPOTIFY_REDIRECT_URI = 'vscode://fromfuchsia.musicshelf/callback'; // redirect URI

  const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({ // code that controls opening the auth url 
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: 'user-read-playback-state user-modify-playback-state streaming',
  })}`;

  await vscode.env.openExternal(vscode.Uri.parse(authUrl)); // opens authorisation in external browser 
}

// 3. Register URI handler in `activate` function of your extension
// the idea is that the URI is like a letter, spotify is like a psot office sending that letter to our app, and then we need to process that uri, and get the code out of it, give it back to spotify to get token 
export function registerUriHandler(context: vscode.ExtensionContext) { 
  const handler: vscode.UriHandler = {
    async handleUri(uri: vscode.Uri) {
      const query = new URLSearchParams(uri.query); // we have to parse the query, whic his basically part of the uri - think of it as the tail end of the url or an api call , eg vscode://fromfuchsia.musicshelf/callback?code=12345abcde&state=xyz gives us a query of code=12345abcde&state=xyz 
      const code = query.get('code'); // now we can easily get the code, this is jsut to make our code more manageable, less string parsing etc 
      if (code) {
        await exchangeCodeForToken(context, code);
      }
    },
  };

  context.subscriptions.push(vscode.window.registerUriHandler(handler)); // this means when we recieve the message from spotify, vscode will automatically do something 
}

// 4. Exchange authorization code for tokens
async function exchangeCodeForToken(context: vscode.ExtensionContext, code: string) {
  const SPOTIFY_CLIENT_ID = '4d0b2ff2eb234ff39835e0cd437ee01f';
  const SPOTIFY_REDIRECT_URI = 'vscode://fromfuchsia.musicshelf/callback';
  const storedVerifier = context.globalState.get<string>('spotifyCodeVerifier');
  if (!storedVerifier) {
    vscode.window.showErrorMessage('Code verifier not found. Please log in again.');
    return;
  }
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID, // we need to pass thru id in the api call 
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_verifier: storedVerifier,
    }),
  });

  const data = await response.json();
  console.log('🔍 Token exchange response:', data);
  if (data.access_token) {
    await context.secrets.store('spotifyAccessToken', data.access_token);
    if (data.refresh_token) {
      await context.secrets.store('spotifyRefreshToken', data.refresh_token);
      console.log('🔁 Refresh token stored.');
    } else {
      console.log('⚠️ No refresh token received.');
    }
    await context.globalState.update('spotifyTokenExpiry', Date.now() + 3600 * 1000);
    vscode.window.showInformationMessage('🎧 Spotify login successful!');
  } else {
    vscode.window.showErrorMessage('⚠️ Spotify login failed.');
  }
}

export async function getValidAccessToken(context: vscode.ExtensionContext): Promise<string | null> { // using our token we can now call the spotify API 
  const token = await context.secrets.get('spotifyAccessToken');
  const refreshToken = await context.secrets.get('spotifyRefreshToken');

  // Try basic access token first
  if (token) {
    return token;
  }
  if (!refreshToken) {
    vscode.window.showWarningMessage('🔒 No refresh token found. Please log in again.');
    return null;
  }
  // If no access token, try to refresh, the token and store it into the access token 
  if (refreshToken) {
    const SPOTIFY_CLIENT_ID = '4d0b2ff2eb234ff39835e0cd437ee01f';
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: SPOTIFY_CLIENT_ID
      }),
    });

    const data = await response.json();
    
    if (data.access_token) {
      await context.secrets.store('spotifyAccessToken', data.access_token);
      await context.globalState.update('spotifyTokenExpiry', Date.now() + 3600 * 1000);
      return data.access_token;
    } else {
      vscode.window.showErrorMessage('⚠️ Failed to refresh Spotify token.');
      return null;
    }
  }

  vscode.window.showWarningMessage('🔒 No Spotify token available. Please log in again.');
  return null;
}

async function refreshAccessToken(context: vscode.ExtensionContext): Promise<string | null> {
  const refreshToken = await context.secrets.get('spotifyRefreshToken');
  if (!refreshToken) {
    console.log('❌ No refresh token found.');
    return null;
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: '4d0b2ff2eb234ff39835e0cd437ee01f'

    }),
  });

  const data = await response.json();
  console.log(`🔍 Refresh response: ${JSON.stringify(data, null, 2)}`);
  
  if (data.access_token) {
    await context.secrets.store('spotifyAccessToken', data.access_token);
    await context.globalState.update('spotifyTokenExpiry', Date.now() + 3600 * 1000);
    if (data.refresh_token) {
      await context.secrets.store('spotifyRefreshToken', data.refresh_token);
      console.log(`🔑 New refresh token: ${data.refresh_token}`);
      console.log('🔁 Refresh token updated.');
    }
    return data.access_token;
  }
  else{
    if (data.error === 'invalid_grant') {
      await context.secrets.delete('spotifyRefreshToken');
      await context.secrets.delete('spotifyAccessToken');
      await context.globalState.update('spotifyTokenExpiry', undefined);
      vscode.window.showWarningMessage('🔄 Spotify session expired. Please log in again.');
    } else {
      vscode.window.showErrorMessage(`⚠️ Failed to refresh token: ${data.error_description || data.error}`);
    }
  };
  return null;
}

// export function scheduleAutoRefresh(context: vscode.ExtensionContext) {
//   console.log('⚠️ Starting token auto-refresh (TEST MODE)');
//   const interval = setInterval(async () => {
//     const expiry = 40*1000
//     const now = Date.now();

//     // For testing: refresh 20 seconds before expiry
//     if (expiry && now > expiry - 20 * 1000) {
//       console.log('🔄 [TEST] Refreshing Spotify token...');
//       const newToken = await refreshAccessToken(context);
//       if (newToken) {
//         console.log('✅ [TEST] Token refreshed');
//       } else {
//         console.log('⚠️ [TEST] Failed to refresh token');
//       }
//     }
//   }, 10 * 1000); // Check every 10 seconds

//   context.subscriptions.push({ dispose: () => clearInterval(interval) });
// }

export function scheduleAutoRefresh(context: vscode.ExtensionContext) {
  console.log('⚠️ refreshing token');
  const interval = setInterval(async () => {
    const expiry = context.globalState.get<number>('spotifyTokenExpiry');
    const now = Date.now();

    // Refresh 5 minutes before expiry
    if (expiry && now > expiry - 5 * 60 * 1000) { // should be set to 5, toggle for testing 
      console.log('🔄 Refreshing Spotify token...');
      const newToken = await refreshAccessToken(context);
      if (newToken) {
        console.log('✅ Token refreshed');
      } else {
        console.log('⚠️ Failed to refresh token');
      }
    }
  }, 60 * 1000); 

  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}
