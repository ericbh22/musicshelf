import * as vscode from 'vscode';
import { AlbumManager } from './providers/AlbumManager';
import { AlbumGridWebview } from './views/albumgridproviderwebview';
import { loginToSpotify, registerUriHandler } from './services/SpotifyService';
import { getSpecificPlaylist, pauseSpotify, playSpotify, searchSpotify, searchSpotifyPlaylists,shuffleSpotify,skipSpotify, 
    backSpotify,resumeSpotify,} from './services/spotifyplayer';
import { getValidAccessToken, scheduleAutoRefresh } from './services/SpotifyService';
import { Album } from './models/Album';
import { registerStatusBarControls } from './views/statusbarprovider';
export function activate(context: vscode.ExtensionContext) {
	registerUriHandler(context);
	scheduleAutoRefresh(context);
	registerStatusBarControls(context);
    const albumManager = AlbumManager.getInstance(context); // singleton instance, basically creating an instnace of this class, albummamanger() basically

    // Create the view provider
    const albumGridWebview = new AlbumGridWebview(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(AlbumGridWebview.viewType, albumGridWebview)); // note the .viewType, remember the viewtype we have depdfiend it ion package.json. and albumgridwebview handles actual rendering and events 

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.addinAlbum', async () => { // why do we need this syntax? 
			const title = await vscode.window.showInputBox({ prompt: 'Album Title' });
			const artist = await vscode.window.showInputBox({ prompt: 'Artist Name' });
			const coverUrl = await vscode.window.showInputBox({ prompt: 'Album Cover URL (optional)' });
	
			if (title && artist) {
				albumManager.addAlbum({ // because we did getinstance() at the start we can use this like oop
					title,
					artist,
					coverUrl: coverUrl || 'default-cover-url',
					spotifyURI: "default",
					isPlaylist: false
				});
				albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() }); // sends message to the webview, we tell it we are delaing with updateAlbums  and we give it all its albums
			}
		}
	
	));

	context.subscriptions.push(
		vscode.commands.registerCommand("musicshelf.addAlbum", async () => {
		  const albumName = await vscode.window.showInputBox({ prompt: "Album Name" });
	  
		  if (!albumName) {
			vscode.window.showErrorMessage("Album name is required for search.");
			return;
		  }
	  
		  const res = await searchSpotify(context, albumName);
	  
		  if (res && res.length > 0) {
			const pick = await vscode.window.showQuickPick(
				res.map((album: Album) => ({
				  label: album.title,
				  id: album.id,
				  description: album.artist,
				  detail: album.coverUrl,
				})),
				{ placeHolder: "Select an album" }
			  );
			  
			if (pick) {
			albumManager.addAlbum({
				title: pick.label,
				artist: pick.description,
				coverUrl: pick.detail,
				spotifyURI: pick.id || 'default',
				isPlaylist: false
			});
				albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			  vscode.window.showInformationMessage(`You picked: ${pick.label}`);
			  // Optional: open the album in Spotify or store it somewhere
			}
		  } else {
			vscode.window.showErrorMessage("No albums found.");
		  }
		})
	  );

	  context.subscriptions.push(
		vscode.commands.registerCommand("musicshelf.addPlaylist", async () => {
		  const albumName = await vscode.window.showInputBox({ prompt: "Playlist Name" });
	  
		  if (!albumName) {
			vscode.window.showErrorMessage("Playlist name is required for search.");
			return;
		  }
		  const res = await searchSpotifyPlaylists(context, albumName);
		  if (res && res.length > 0) {
			
			const pick = await vscode.window.showQuickPick(
				res.map((album: Album) => ({
				  label: album.title,
				  id: album.id,
				  description: album.artist,
				  detail: album.coverUrl,
				})),
				{ placeHolder: "Select a playlist" }
			  );
			  
			if (pick) {
			albumManager.addAlbum({
				title: pick.label,
				artist: pick.description,
				coverUrl: pick.detail,
				spotifyURI: pick.id || 'default',
				isPlaylist: true
			});
				albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			  vscode.window.showInformationMessage(`You picked: ${pick.label}`);
			  // Optional: open the album in Spotify or store it somewhere
			}
		  } else {
			vscode.window.showErrorMessage("No albums found.");
		  }
		}),
		vscode.commands.registerCommand("musicshelf.addPlaylistUI", async () => {
			const albumName = await vscode.window.showInputBox({ prompt: "Playlist Name" });
		
			if (!albumName) {
			  vscode.window.showErrorMessage("Playlist name is required for search.");
			  return;
			}
			const res = await searchSpotifyPlaylists(context, albumName);
			if (res && res.length > 0) {
			  
			  const pick = await vscode.window.showQuickPick(
				  res.map((album: Album) => ({
					label: album.title,
					id: album.id,
					description: album.artist,
					detail: album.coverUrl,
				  })),
				  { placeHolder: "Select a playlist" }
				);
				
			  if (pick) {
			  albumManager.addAlbum({
				  title: pick.label,
				  artist: pick.description,
				  coverUrl: pick.detail,
				  spotifyURI: pick.id || 'default',
				  isPlaylist: true
			  });
				  albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
				vscode.window.showInformationMessage(`You picked: ${pick.label}`);
				// Optional: open the album in Spotify or store it somewhere
			  }
			} else {
			  vscode.window.showErrorMessage("No albums found.");
			}
		  })
	  );

	  context.subscriptions.push(
		vscode.commands.registerCommand("musicshelf.addPlaylistURI", async() => {
			const playlistURI = await vscode.window.showInputBox({prompt: "spotify playlist URI"});
			if (!playlistURI){
				vscode.window.showErrorMessage("Must supply a playlist URI");
				return;
			}

			const playlistJson = await getSpecificPlaylist(context,playlistURI);
			if (playlistJson){
			albumManager.addAlbum({
				title:playlistJson.name,
				artist: playlistJson.owner.display_name,
				coverUrl: playlistJson.images?.[0]?.url || '',
				spotifyURI: playlistJson.id ,
				isPlaylist: true 
			});
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			vscode.window.showInformationMessage(`You picked: ${playlistJson.name}`);
		}else{
			vscode.window.showErrorMessage("No album found");
		}
			
		})
	  );

	

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.playAlbum', (album) => {
			vscode.window.showInformationMessage(`Playing: ${album.title} by ${album.artist}`);
		}));

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.removeAlbum', async() => {
			const name = await vscode.window.showInputBox({prompt : "Name of album to be removed"});
			if (name){
			albumManager.removeAlbum(name);
			}
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
		},
		
	));

	const loginCommand = vscode.commands.registerCommand('musicshelf.login', () => {
		loginToSpotify(context);
		});
	
		context.subscriptions.push(loginCommand);
	

	const loginCommand2 = vscode.commands.registerCommand('musicshelf.loginUI', () => {
		loginToSpotify(context);
		});
	
		context.subscriptions.push(loginCommand2);
	
	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.spotifyPlay', async () => {
			await playSpotify(context,"spotify:album:5FrjDW96mCYw9ECc74c637");
		}),
		
		vscode.commands.registerCommand('musicshelf.spotifyPause', async () => {
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			await pauseSpotify(context);
		}),



		vscode.commands.registerCommand('musicshelf.shuffleOn', async () => {
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			await shuffleSpotify(context,true);
		}),

		vscode.commands.registerCommand('musicshelf.shuffleOff', async () => {
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			await shuffleSpotify(context,false);
		}),

		vscode.commands.registerCommand('musicshelf.skipSong', async () => {
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			await skipSpotify(context);
		}),
		vscode.commands.registerCommand('musicshelf.goBackSong', async () => {
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			await backSpotify(context);
		}),
		vscode.commands.registerCommand('musicshelf.resumeSong', async () => {
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
			await resumeSpotify(context);
		}),
		vscode.commands.registerCommand('musicshelf.removeAlbumUI', async() => {
			const name = await vscode.window.showInputBox({prompt : "Name of album to be removed"});
			if (name){
			albumManager.removeAlbum(name);
			}
			albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
		}),
		vscode.commands.registerCommand("musicshelf.addAlbumUI", async () => {
			const albumName = await vscode.window.showInputBox({ prompt: "Album Name" });
		
			if (!albumName) {
			  vscode.window.showErrorMessage("Album name is required for search.");
			  return;
			}
		
			const res = await searchSpotify(context, albumName);
		
			if (res && res.length > 0) {
			  const pick = await vscode.window.showQuickPick(
				  res.map((album: Album) => ({
					label: album.title,
					id: album.id,
					description: album.artist,
					detail: album.coverUrl,
				  })),
				  { placeHolder: "Select an album" }
				);
				
			  if (pick) {
			  albumManager.addAlbum({
				  title: pick.label,
				  artist: pick.description,
				  coverUrl: pick.detail,
				  spotifyURI: pick.id || 'default',
				  isPlaylist: false
			  });
				  albumGridWebview.postMessage({ type: 'updateAlbums', albums: albumManager.getAlbums() });
				vscode.window.showInformationMessage(`You picked: ${pick.label}`);
				// Optional: open the album in Spotify or store it somewhere
			  }
			} else {
			  vscode.window.showErrorMessage("No albums found.");
			}
		  })


	);
	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.testTokenRefresh', async () => {
			const token = await getValidAccessToken(context);
			vscode.window.showInformationMessage(`Token: ${token?.substring(0, 10)}...`);
		})
		);	
}

export function deactivate() {}