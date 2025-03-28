import * as vscode from 'vscode';
import { AlbumManager } from './providers/albummanager';
import { AlbumGridWebview } from './views/albumgridproviderwebview';

export function activate(context: vscode.ExtensionContext) {
	
    const albumManager = AlbumManager.getInstance();

    // Create the view provider
    const albumGridWebview = new AlbumGridWebview(context);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(AlbumGridWebview.viewType, albumGridWebview));
    // context.subscriptions.push(
	// 	vscode.commands.registerCommand('musicshelf.showAlbumGrid', () => {
	// 		albumGridWebview.show();
	// 	})
    // );

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.addAlbum', async () => {
			const title = await vscode.window.showInputBox({ prompt: 'Album Title' });
			const artist = await vscode.window.showInputBox({ prompt: 'Artist Name' });
			const coverUrl = await vscode.window.showInputBox({ prompt: 'Album Cover URL (optional)' });
	
			if (title && artist) {
				albumManager.addAlbum({
					title,
					artist,
					coverUrl: coverUrl || 'default-cover-url'
				});
			}
		}
	
	));

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.playAlbum', (album) => {
			vscode.window.showInformationMessage(`Playing: ${album.title} by ${album.artist}`);
		}));
	

	context.subscriptions.push(
		vscode.commands.registerCommand('musicshelf.removeAlbum', (album) => {
			albumManager.removeAlbum(album.id);
		}));



}

export function deactivate() {}