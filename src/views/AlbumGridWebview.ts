import * as vscode from 'vscode';
import { AlbumManager } from '../providers/AlbumManager';

export class AlbumGridWebview {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private albumManager: AlbumManager;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.albumManager = AlbumManager.getInstance();
    }

    // Create and show the webview
    public show() {
        // Create the webview panel
        this.panel = vscode.window.createWebviewPanel(
            'musicShelfGrid',
            'Music Shelf Grid',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Set the webview's HTML content
        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(
            (message) => this.handleMessage(message),
            undefined,
            this.context.subscriptions
        );
    }

    // Generate the HTML content for the webview
    private getWebviewContent(): string {
        //load in external stylesheets 
        const albums = this.albumManager.getAlbums(); // Get albums from AlbumManager
        const genres = ['All', 'Rock', 'Pop', 'Jazz', 'Hip-Hop']; // Example genres

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Music Shelf Grid</title>
            <style>
                .album-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 10px;
                }
                .album-item {
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                .album-item:hover {
                    transform: scale(1.05);
                }
            </style>
        </head>
        <body>
            <h1>Music Shelf</h1>
            <select id="genreSelect">
                ${genres.map(genre => `<option value="${genre}">${genre}</option>`).join('')}
            </select>
            <div class="album-grid" id="albumGrid">
                ${albums.map(album => `
                    <div class="album-item" data-album='${JSON.stringify(album)}'>
                        <img src="${album.coverUrl}" alt="${album.title}" style="max-width: 100%;">
                        <p>${album.title} - ${album.artist}</p>
                    </div>
                `).join('')}
            </div>

            <script>
                const vscode = acquireVsCodeApi();

                document.querySelectorAll('.album-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const album = JSON.parse(item.dataset.album);
                        vscode.postMessage({
                            command: 'playAlbum',
                            album: album
                        });
                    });
                });

                document.getElementById('genreSelect').addEventListener('change', (event) => {
                    const selectedGenre = event.target.value;
                    vscode.postMessage({
                        command: 'filterAlbums',
                        genre: selectedGenre
                    });
                });
            </script>
        </body>
        </html>
        `;
    }

    // Handle messages from the webview
    private handleMessage(message: any) {
        switch (message.command) {
            case 'playAlbum':
                this.playAlbum(message.album);
                break;
            default:
                console.log('Unknown command:', message.command);
        }
    }

    // Play the selected album
    private playAlbum(album: any) {
        vscode.commands.executeCommand('musicshelf.playAlbum', album);
    }

    // Filter albums based on genre and send the filtered list back to the webview

}
