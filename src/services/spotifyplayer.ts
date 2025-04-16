import * as vscode from 'vscode';
import fetch from 'node-fetch';
import { Album } from '../models/Album';
async function getAccessToken(context: vscode.ExtensionContext): Promise<string | undefined> {
    return await context.secrets.get('spotifyAccessToken');
  }
  

export async function callSpotifyAPI(
  context: vscode.ExtensionContext,
  endpoint: string,
  method: 'PUT' | 'POST' | 'GET' = 'PUT'
): Promise<void> {
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('🔒 Please log in to Spotify first.');
    return;
  }

  const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 204) {
    vscode.window.showInformationMessage(`✅ Spotify ${endpoint} successful.`);
  } else {
    const error = await res.json();
    vscode.window.showErrorMessage(`❌ Spotify error: ${error.error?.message || res.status} ${endpoint}`);
  }
}

export async function playSpotify(context: vscode.ExtensionContext, albumId?: string ) {
    const accessToken = await getAccessToken(context);
    const tempcall = await refreshDeviceId(context);
    if (!accessToken) {
      vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
      return;
    }
    let deviceId = context.globalState.get<string>('spotifyDeviceId');
    // console.log(albumId,context.globalState.get<string>('currentlyPlayingAlbum'));
    if (albumId === context.globalState.get<string>('currentlyPlayingAlbum')){
      resumeSpotify(context);
    }
    else{
    const response = await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context_uri: `spotify:album:${albumId}`, // e.g., 'spotify:album:JJZyk0nPbabc123'
      }),
    });
      if (response.status === 404) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          vscode.window.showErrorMessage('Failed to parse error response from Spotify.');
          return;
        }
      
        if (error?.error?.reason === 'NO_ACTIVE_DEVICE') {
          // Refresh device ID and retry once
          const refreshedDeviceId = await refreshDeviceId(context);
          if (refreshedDeviceId) {
            const retryResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${refreshedDeviceId}`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ context_uri: `spotify:album:${albumId}` }),
            });
      
            if (!retryResponse.ok) {
              const retryError = await retryResponse.text();
              vscode.window.showErrorMessage(`Failed to retry play: ${retryResponse.status} ${retryError}`);
            } else {
              vscode.window.showInformationMessage('▶️ Playing after refreshing device!');
            }
            return;
          }
        } else {
          vscode.window.showErrorMessage(`Spotify error: ${error?.error?.message || 'Unknown error'}`);
        }
      } else if (!response.ok) {
        const errorText = await response.text();
        vscode.window.showErrorMessage(`Failed to play: ${response.status} ${errorText} please wait 1 minute or relogin later`);
      }
      else {
        vscode.window.showInformationMessage('▶️ Playing on Spotify!');
      }
    }
  }

  export async function resumeSpotify(context: vscode.ExtensionContext, albumUri?: string ) {
    const accessToken = await getAccessToken(context);
    const tempcall = await refreshDeviceId(context);
    if (!accessToken) {
      vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
      return;
    }
    let deviceId = context.globalState.get<string>('spotifyDeviceId');
    const response = await fetch(`https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${deviceId}` : ''}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  
    if (response.status === 404) {
      let error;
      try {
        error = await response.json();
      } catch (e) {
        vscode.window.showErrorMessage('Failed to parse error response from Spotify.');
        return;
      }
    
      if (error?.error?.reason === 'NO_ACTIVE_DEVICE') {
        // Refresh device ID and retry once
        const refreshedDeviceId = await refreshDeviceId(context);
        if (refreshedDeviceId) {
          const retryResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${refreshedDeviceId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ context_uri: `spotify:album:${albumUri}` }),
          });
    
          if (!retryResponse.ok) {
            const retryError = await retryResponse.text();
            vscode.window.showErrorMessage(`Failed to retry play: ${retryResponse.status} ${retryError}`);
          } else {
            vscode.window.showInformationMessage('▶️ Playing after refreshing device!');
          }
          return;
        }
      } else {
        vscode.window.showErrorMessage(`Spotify error: ${error?.error?.message || 'Unknown error'}`);
      }
    } else if (!response.ok) {
      const errorText = await response.text();
      vscode.window.showErrorMessage(`Failed to play: ${response.status} ${errorText}`);
    }
    else {
      vscode.window.showInformationMessage('▶️ Playing on Spotify!');
    }
  }

  export async function playPlaylist(context: vscode.ExtensionContext, albumUri?: string ) {
    const tempcall = await refreshDeviceId(context);
    const accessToken = await getAccessToken(context);
    if (!accessToken) {
      vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
      return;
    }
    
    const response = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        context_uri: `spotify:playlist:${albumUri}`, // e.g., 'spotify:album:JJZyk0nPbabc123'
      }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      
      vscode.window.showErrorMessage(`Failed to play: ${response.status} ${errorText}`);
    } else {
      vscode.window.showInformationMessage('▶️ Playing on Spotify!');
    }
  }
export async function pauseSpotify(context: vscode.ExtensionContext, albumUri?: string ) {
  const tempcall = await refreshDeviceId(context);
  const accessToken = await getAccessToken(context);
  
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  }
  const albumresponse = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const albumresponseJSON = await albumresponse.json();

  await context.globalState.update('currentlyPlayingAlbum', albumresponseJSON.item.album.id);

  const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    vscode.window.showErrorMessage(`Failed to play: ${response.status} ${errorText}`);
  } else {
    vscode.window.showInformationMessage('▶️ Paused!');
  }
}

export async function searchSpotify(context: vscode.ExtensionContext, albumName: string){
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  };
  const query = new URLSearchParams({ // allows us to do const url = `https://api.spotify.com/v1/search?q=${albumName}&type=album&limit=10`; this easier by doing this const url = `https://api.spotify.com/v1/search?${query.toString()}`; instead 
    q: albumName,
    type: "album", // because we are specifying an album on this search 
    limit: "5",
  });
  const response = await fetch(`https://api.spotify.com/v1/search?${query.toString()}`, { // use backticks to enable string interpolation
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    vscode.window.showErrorMessage(`Spotify API error: ${response.status}`);
    return null;
  }

  const responseJson = await response.json();
  const rawAlbums = responseJson.albums.items;

  // Map Spotify albums into your Album interface
  const mappedAlbums: Album[] = rawAlbums.map((a: any) => ({
    id: a.id,
    title: a.name,
    artist: a.artists.map((artist: any) => artist.name).join(', '),
    coverUrl: a.images?.[0]?.url || "", // Get first image URL or empty string
    spotifyUri: a.uri,
    isPlaylist: false
  }));

  return mappedAlbums;
}

export async function searchSpotifyPlaylists(context: vscode.ExtensionContext, playlistName: string){
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  };
  const query = new URLSearchParams({ // allows us to do const url = `https://api.spotify.com/v1/search?q=${albumName}&type=album&limit=10`; this easier by doing this const url = `https://api.spotify.com/v1/search?${query.toString()}`; instead 
    q: playlistName,
    type: "playlist", // because we are specifying an album on this search 
    limit: "20",
  });
  const response = await fetch(`https://api.spotify.com/v1/search?${query.toString()}`, { // use backticks to enable string interpolation
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    vscode.window.showErrorMessage(`Spotify API error: ${response.status}`);
    return null;
  }

  const responseJson = await response.json();
  // console.log("Raw Spotify playlist response:", responseJson);
  const rawAlbums = responseJson.playlists?.items?.filter(Boolean) || [];

  // Map Spotify albums into your Album interface
  const mappedAlbums: Album[] = rawAlbums.map((a: any) => ({
    id: a.id,
    title: a.name,
    artist: a.owner?.display_name || "Unknown Owner",
    coverUrl: a.images?.[0]?.url || "", // Get first image URL or empty string
    spotifyUri: a.uri,
    isPlaylist: true
  }));

  return mappedAlbums;
}


export async function getSpecificPlaylist(context: vscode.ExtensionContext, playlistURI:string){
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  };
  const seperatedID = playlistURI.split(":")
  const playlistID = seperatedID[seperatedID.length - 1]; // cant use -1 in ts

  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistID}`, { // use backticks to enable string interpolation
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    vscode.window.showErrorMessage(`Spotify API error: ${response.status}`);
    return null;
  }
  const responseJson = await response.json();
  // console.log("Raw Spotify playlist response:", responseJson);
  return responseJson;
}
export async function skipSpotify(context: vscode.ExtensionContext){
  const tempcall = await refreshDeviceId(context);
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/next', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    vscode.window.showErrorMessage(`Failed to play: ${response.status} ${errorText}`);
  } else {
    vscode.window.showInformationMessage('▶️ skipped!');
  }
}

export async function backSpotify(context: vscode.ExtensionContext){
  const tempcall = await refreshDeviceId(context);
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    vscode.window.showErrorMessage(`Failed to play: ${response.status} ${errorText}`);
  } else {
    vscode.window.showInformationMessage('▶️ returned!');
  }
}

export async function displayCurrentSpotify(context: vscode.ExtensionContext){
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  
  if (response.status === 204) {
    // console.log('Nothing is currently playing.');
    return;
  }

  if (!response.ok) {
    const errorText = await response.text();
    // vscode.window.showErrorMessage(`Failed to fetch currently playing track: ${response.status} ${errorText}`);
    return;
  }

  const data = await response.json();

  if (!data || !data.item) {
    vscode.window.showInformationMessage('No song is currently playing.');
    return;
  }
  const trackName = data.item.name;
  const artistNames = data.item.artists.map((a: any) => a.name).join(', ');

  const songInfo = `${trackName} - ${artistNames}`;

  return songInfo;
}


export async function checkStatus(context: vscode.ExtensionContext){
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return;
  }

  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
 
  if (!response.ok) {
    const errorText = await response.text();
    vscode.window.showErrorMessage(`Failed to fetch currently playing track: ${response.status} ${errorText}`);
    return;
  }

  const data = await response.json();

 

  return data;
}

export async function shuffleSpotify(context: vscode.ExtensionContext, toggle: boolean): Promise<boolean> {
  const accessToken = await getAccessToken(context);
  if (!accessToken) {
    vscode.window.showErrorMessage('Spotify access token not found. Please log in.');
    return false;
  }

  const url = `https://api.spotify.com/v1/me/player/shuffle?state=${toggle}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    vscode.window.showErrorMessage(`Failed to toggle shuffle: ${response.status} ${errorText}`);
    return false;
  }

  vscode.window.showInformationMessage(`🔀 Shuffle turned ${toggle ? 'on' : 'off'}.`);
  return true;
}


export async function refreshDeviceId(context: vscode.ExtensionContext): Promise<string | null> {
  // console.log("entered");
  const accessToken = await getAccessToken(context);
  if (!accessToken) {return null;}

  const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {return null;}

  const data = await response.json();
  const activeDevice = data.devices.find((device: any) => device.is_active);

  if (activeDevice) {
    await context.globalState.update('spotifyDeviceId', activeDevice.id);
    // console.log(activeDevice.id);
    return activeDevice.id;
  }

  return null;
}