const vscode = acquireVsCodeApi();

const shelf = {
    div: document.getElementById("albums"),

    width: window.innerWidth,
    height: window.innerHeight,
    scale: 2, 
    mouse: { 
        element: document.getElementById("mouse"),
        pos: new Vec2(),
    },
    albums: [] 
    
};

// add all the winodw update event
window.addEventListener("message", event => { // rmbr we used to add event listeners for "clicks" when building web pages 
    // we get the message the json data send 
    const message = event.data; 
    switch (message.type.toLowerCase()){
        case "add": // add an album 
            switch (message.specie) { // this basically works like having three functions in a dictionary, and basically we are calling this function and checking if we have this function 
                default:
                    break;
            }
        break;
    }
});


function update(){
    if (shelf.width !== window.innerWidth || shelf.height !== window.innerHeight) {
        onResize();
    }
}
vscode.postMessage({type:'init'});