import * as vscode from 'vscode';
import { AlbumManager } from '../providers/AlbumManager';
import { Album } from '../models/Album';

export class AlbumGridWebview implements vscode.WebviewViewProvider {
  public static readonly viewType = 'musicShelfGrid'; // class level constnat, basicaly sayting view_type musicshelfgrid 
  private view?: vscode.WebviewView; // instance properties that are local, type hinting, this view is optional 
  private albumManager: AlbumManager; // album manager is an isntance of albumManager, type hinting here  

  constructor(private context: vscode.ExtensionContext) {
    this.albumManager = AlbumManager.getInstance(context);
    
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
    const cdImageUri = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'assets', 'cd.png'));
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
            albums:this.albumManager.getAlbums() ,
            cdImageUri: cdImageUri.toString()
          });
          break;
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
    const scriptJS = webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'src', 'assets', 'script.js')); 
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
      <script src="${scriptJS}"></script> <!-- Load external script -->
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