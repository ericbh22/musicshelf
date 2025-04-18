const vscode = acquireVsCodeApi();

// Store state information for persisting between webview loads
const state = vscode.getState() || { 
    albums: [],
    activeCdElement: null // Track the currently active CD
  };
// Function to render albums
function renderAlbums(albums) {
    const albumGrid = document.getElementById('albumGrid');

    // Clear existing albums
    albumGrid.innerHTML = '';

    if (albums.length === 0) {
        albumGrid.innerHTML = `
            <p class="empty-text">No albums added yet</p>
            <p class="empty-subtext">Use the <strong>"Add Album"</strong> command to get started!</p>`;
        return;
    }

    // Add each album to the grid
    // Note we are defining class names here so we can modify them later on with CSS
    albums.forEach(album => {
        const albumElement = document.createElement('div');
        albumElement.className = 'album-item';
        albumElement.setAttribute('data-album', JSON.stringify(album));

        // Div used for trying to display the wrapped effect
        const coverWrapper = document.createElement('div');
        coverWrapper.className = 'album-cover-wrapper';

        
        const CDWrapper = document.createElement("div");
        CDWrapper.className = "CD-div" ; 
        
        const CDOverlay = document.createElement("div");
        CDOverlay.className = "CD-Overlay" ; 
        CDOverlay.setAttribute('data-cd-state', 'retracted'); // to manage the state of the cds so we can manage animations 
        // Div used to create the CSS for plastic overlay
        const plasticOverlay = document.createElement("div");
        plasticOverlay.className = "plastic-overlay";

        const cdImg = document.createElement("img");
        cdImg.src = state.cdImageUri || "https://via.placeholder.com/150?text=CD"; // Use the URI from state
        cdImg.className = "cd-image"; 
        CDOverlay.appendChild(cdImg); // 
        


        const coverImg = document.createElement('img');
        coverImg.src = album.coverUrl || 'https://via.placeholder.com/150?text=No+Cover';
        coverImg.alt = `${album.title} by ${album.artist}`;
        coverImg.className = 'album-cover';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'album-title';
        titleDiv.textContent = album.title;

        const artistDiv = document.createElement('div');
        artistDiv.className = 'album-artist';
        artistDiv.textContent = album.artist;

        coverWrapper.appendChild(coverImg);
        coverWrapper.appendChild(plasticOverlay);



        // We put the whole wrapper in instead of just the image into the div
        albumElement.appendChild(coverWrapper);
        albumElement.appendChild(titleDiv);
        albumElement.appendChild(artistDiv);
        albumElement.append(CDOverlay);

        // Position the album in the grid if position is available
        // CSS is 1-indexed so we need to add stuff on, and we need backticks to create a string
        if (album.position) {
            albumElement.style.gridRow = (album.position.row + 1);
            albumElement.style.gridColumn = (album.position.column + 1);
        }
        // album event is the div of the ALBUM, so this makes sense 
        // Add click event listener to remove shrink wrap and animate
       
        albumElement.addEventListener('click', () => {
            const cdState = CDOverlay.getAttribute("data-cd-state");
            if (cdState === "retracted"){
                 // Add CSS class to animate removal, note we are using classList here because we are simply adding a class to it 
                
                const currentlyPlaying = document.querySelector('.CD-Overlay[data-cd-state="extended"]'); // if anything is currently playing, stop it from playing, there can only be one currently playing at a time so we can use query select 
                if (currentlyPlaying) {
                    currentlyPlaying.classList.remove("slide-out-rotate");
                    currentlyPlaying.classList.add("slide-in");
                    currentlyPlaying.setAttribute('data-cd-state', 'retracted');

                    // const previousPlasticOverlay = currentlyPlaying.parentElement.querySelector(".plastic-overlay"); // we need parent here because we are in the CD-OVERLAY div, not in the actual album div, so we need to find the parent elemnt, then look for plastic overlay div 
                    // if (previousPlasticOverlay.classList.contains("remove-overlay")){
                    //     previousPlasticOverlay.classList.remove("remove-overlay");
                    // };
                    // previousPlasticOverlay.classList.add("add-overlay");
                    
                    // Let the animation finish before removing the class
                    setTimeout(() => {
                        currentlyPlaying.classList.remove("slide-in");
                    }, 500);
                }
                
                // removing plastic effect 
                // if (plasticOverlay.classList.contains("add-overlay")){
                //     plasticOverlay.classList.remove("add-overlay");}
                // plasticOverlay.classList.add("remove-overlay"); // this references the album that was being clicked, albumElement.plasticoverlay essentially 
                // // setTimeout(() => {
                //     plasticOverlay.style.display = "none"; // Hide overlay after timed animation 
                // }, 500);
                

            

                if (CDOverlay) {
                    CDOverlay.classList.add("slide-out-rotate");
                    CDOverlay.setAttribute('data-cd-state', 'extended');
                }
                
                // setTimeout(() => {
                //     CDOverlay.classList.remove("remove-overlay");
                // }, 500);
                
                state.activeCdElement = album.title;
                vscode.setState(state);

                // Now we send the message to the extension, this message is currently not needed as we are only making front end changes, but eventually  this post message is what will trigger the spotify API 
                vscode.postMessage({ 
                    type: 'selectAlbum', 
                    album: album,
                    cdState: CDOverlay.getAttribute('data-cd-state')
                });
            }else{
                CDOverlay.classList.add("slide-in");
                CDOverlay.setAttribute('data-cd-state', 'retracted');

                // Let the animation finish before removing the class
                setTimeout(() => {
                    CDOverlay.classList.remove("slide-in");
                }, 500);
                // plasticOverlay.style.display = "flex";
                // plasticOverlay.classList.remove("remove-overlay");
                // plasticOverlay.classList.add("add-overlay");
                // setTimeout(() => {
                //     CDOverlay.classList.remove("add-overlay");
                // }, 500);
                CDOverlay.classList.remove("slide-out-rotate");
                
                // Clear the active CD
                state.activeCdElement = null;
                vscode.setState(state);
                vscode.postMessage({ 
                    type: 'selectAlbum', 
                    album: album,
                    cdState: CDOverlay.getAttribute('data-cd-state')
                });
            };
        });


        // Now append each child div which represents an album to albumGrid
        albumGrid.appendChild(albumElement);
    });
}

// Handle messages from the extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
        case 'updateAlbums':
            // console.log('Received albums update:', message.albums);
            state.albums = message.albums;
            if (message.cdImageUri) {
                state.cdImageUri = message.cdImageUri;
            }
            vscode.setState(state); // this means we save the state with cdImageUri to be used in the future, if we want to use local files this is the only way 
            renderAlbums(message.albums);
            break;
    }
});

window.addEventListener('load', () => {
    const vscode = acquireVsCodeApi();
    vscode.postMessage({ type: 'init' }); // This is crucial
  });
// Initialize by telling the extension we're ready
vscode.postMessage({ type: 'init' });

// If we have albums in state, render them
if (state.albums.length > 0) {
    renderAlbums(state.albums);
}

// Explanation of events
// When extension wants to talk to webview, we do this.view.webview.postMessage, so we're posting a message to self.webview
// When webview talks to extension, we do vscode.postMessage, talking to the extension now
// Now we need to set up event listeners, with webview.onDidReceiveMessage. What this does is process the message we receive and act accordingly
// However, our webview needs a separate event listener
// So when 'init' is sent from our webview to our extension, it will go into the message listener and process it
// Notice we have an onDidChangeAlbums() at the top; that's there to listen to album changes, so when an album changes, it sends an updateAlbums message to the webview
