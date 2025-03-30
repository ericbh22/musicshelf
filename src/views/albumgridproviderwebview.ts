import * as vscode from 'vscode';
import { AlbumManager } from '../providers/AlbumManager';
import { Album } from '../models/Album';

export class AlbumGridWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = 'musicShelfGrid'; // class level constnat, basicaly sayting view_type musicshelfgrid 
  private view?: vscode.WebviewView; // instance properties that are local, type hinting, this view is optional 
  private albumManager: AlbumManager; // album manager is an isntance of albumManager, type hinting here  

  constructor(private context: vscode.ExtensionContext) {
    this.albumManager = AlbumManager.getInstance();
    
    // Subscribe to album changes
    this.albumManager.onDidChangeAlbums(() => {
      if (this.view) {
        this.postMessage({ 
          type: 'updateAlbums', 
          albums: this.albumManager.getAlbums() 
        });
      }
    });
  }
  
  // Method to post messages to the webview
  public postMessage(message: any) {
    this.view?.webview.postMessage(message); // ?. acts as optional chaining. If this view exists, post message to the webview 
  }

  // Resolve the webview view
  public resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, _token: vscode.CancellationToken) {
    this.view = webviewView;
    const webview = webviewView.webview;
    webview.html = this.getWebviewContent(webviewView.webview);

    webview.options = {
      enableScripts: true,
    };

    // Set the HTML content for the webview
  


    // Handle messages from the webview
    webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "init":
          this.postMessage({
            type: "updateAlbums" ,
            albums:this.albumManager.getAlbums() 
          });
        case "updateAlbums":
          this.postMessage({ type: "updateAlbums", albums: this.albumManager.getAlbums() }); 
          break; 
        case 'error':
          vscode.window.showErrorMessage(message.text);
          break;
        case 'info':
          vscode.window.showInformationMessage(message.text);
          break;
      }
    });
  }

  // Generate HTML content for the webview
  private getWebviewContent(webview: vscode.Webview): string {
    const style = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'assets', 'style.css'));
    const utilJS = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'assets', 'util.js'));
    
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Music Shelf</title>
      <link href="${style}" rel="stylesheet">
    </head>
    <body>
      <h1>Music Shelf</h1>
      
      <div class="album-grid" id="albumGrid">
        <!-- Albums will be inserted here dynamically -->
      </div>
      
      <script src="${utilJS}"></script> 
      <script>

        const vscode = acquireVsCodeApi();
        
        // Store state information for persisting between webview loads
        const state = vscode.getState() || { albums: [] };
        
        // Function to render albums
        function renderAlbums(albums) {
          const albumGrid = document.getElementById('albumGrid');
          
          // Clear existing albums
          albumGrid.innerHTML = '';
          
          if (albums.length === 0) {
            albumGrid.innerHTML = '<p>No albums added yet. Use the "Add Album" command to get started.</p>';
            return;
          }
          
          // Add each album to the grid
          albums.forEach(album => {
            const albumElement = document.createElement('div');
            albumElement.className = 'album-item';
            albumElement.setAttribute('data-album', JSON.stringify(album));
            
            const coverImg = document.createElement('img');
            coverImg.src = album.coverUrl || 'https://via.placeholder.com/150?text=No+Cover';
            coverImg.alt = \`\${album.title} by \${album.artist}\`;
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'album-title';
            titleDiv.textContent = album.title;
            
            const artistDiv = document.createElement('div');
            artistDiv.className = 'album-artist';
            artistDiv.textContent = album.artist;
            
            albumElement.appendChild(coverImg);
            albumElement.appendChild(titleDiv);
            albumElement.appendChild(artistDiv);
            
            // Position the album in the grid if position is available
            //CSS is 1 indexed so we need to add stuff on, and we need backticks to create a string 
            if (album.position) {
              albumElement.style.gridRow = (album.position.row + 1);
              albumElement.style.gridColumn = (album.position.column + 1);
            }
            
            // Add click event listener
            albumElement.addEventListener('click', () => {
              vscode.postMessage({ 
                type: 'selectAlbum', 
                album: album 
              });
            });
            
            albumGrid.appendChild(albumElement);
          });
        }
        
        // Handle messages from the extension
        window.addEventListener('message', event => {
          const message = event.data;
          
          switch (message.type) {
            case 'updateAlbums':
              console.log('Received albums update:', message.albums);
              state.albums = message.albums;
              vscode.setState(state);
              renderAlbums(message.albums);
              break;
          }
        });
        
        // Initialize by telling the extension we're ready
        vscode.postMessage({ type: 'init' });
        
        // If we have albums in state, render them
        if (state.albums.length > 0) {
          renderAlbums(state.albums);
        }
      </script>
    </body>
    </html>
    `;
  }
}


// explanation of events
// when extension wants to talk to webview u do this.view.webview.postMessage, so ur posting a message to self.webview
// when webview talks to extension, we do vscode.postmessage, talking to the extension now 
// now we need to set up event listeners, with webview on did receive message. what this does is processes what message we recieve, and does smthn with it 
// however, our webview needs a epearte event listerner 
// so when init is send from our webview to our extension , it will go into the message listener and proces t
// now notice we have a ondidchangeALbums() at the top, thats there to lsiten to the fires from albumchange ts, so when album changes, that works  and sends an update albums message to the webview 

// so the next course of action is to make this data SAVE between runs, and then implement remove and move, and UI is basically done! Im going to quickly add remove 