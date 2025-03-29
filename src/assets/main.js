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

};

// add all the winodw update event
window.addEventListener("message", event => {

})