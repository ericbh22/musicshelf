function updateAlbumGrid(albums) {
    const albumGrid = document.getElementById('albumGrid');
    if (!albumGrid) return; // Safety check

    albumGrid.innerHTML = albums.map(album => `
        <div class="album-item" data-album='${JSON.stringify(album)}'>
            <img src="${album.coverUrl}" alt="${album.title}" style="max-width: 100%;">
            <p>${album.title} - ${album.artist}</p>
        </div>
    `).join('');
}

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === "updateAlbums") { // thjis is where we receive the msg, if we see tis updateAlbums, we will update the ALbumGrid with the albums in the message
        updateAlbumGrid(message.albums);
    }
});
