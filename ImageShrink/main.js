// console.log("Hello World")
const {app, BrowswerWindow} = require("electron")

createMainWindow = () => {
    const mainWindow = new BrowswerWindow({
        title: 'ImageShrink',
        width: 500,
        height: 600
    })
}

app.on('ready', createMainWindow);