const { app, BrowserWindow, Menu, ipcMain, Tray } = require("electron");
const log = require('electron-log')
const Store = require('./Store')
const path = require('path')
const MainWindow = require('./MainWindow.js')
// Set env
process.env.NODE_ENV = 'development'
// process.env.NODE_ENV = "production";

const isDev = process.env.NODE_ENV !== 'production' ? true : false
const isMac = process.platform === 'darwin' ? true : false

let mainWindow
let tray



// initializing store and defaults
const store = new Store({
  configName: 'user-settings',
  defaults: {
    settings: {
      cpuOverload: 80,
      alertFrequency: 5
    }
  }
})

/*
* Here we are creating the main window of our app, which
* will create the frame inside which our app will be hosted
* in windows, the icon option will replace standard electron icon with provided icon
* in the bottom bar (uncomment the line to see the effect)
* now why we need to do dirname in icon?
* https://www.udemy.com/course/electron-from-scratch/learn/lecture/20050728#questions
* later we moved this functionality to MainWindow class
*/

// function createMainWindow() {
//   mainWindow = new BrowserWindow({
//     title: 'APP NAME',
//     width: isDev ? 800 : 500,
//     height: 600,
//     icon: `${__dirname}/assets/icons/icon.png`,
//     resizable: isDev ? true : false,
//     backgroundColor: 'white',
//     webPreferences: {
//       nodeIntegration: true,
//       enableRemoteModule: true
//     },
//   })

  function createMainWindow() {
  mainWindow = new MainWindow("./app/index.html", isDev);

  // if (isDev) {
  //   // open up the dev tools if we are in development mode
  //   mainWindow.webContents.openDevTools()
  // }

    /*
    * after creating the main window, here we are pointing our 
    * app to host the file,
    * Here the title of the index.html file will overwrite the
    * title we defined in the BrowserWindow constructor
    * Later we tell the app to do this inside MainWindow.js file
    */

  // mainWindow.loadFile('./app/index.html')
}

/*
* when the app is ready, do stuff
* here we will create the main window as soon as the app is ready, and then send the settings we stored 
* to the main window
*/
app.on('ready', () => {
  createMainWindow()
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.send('settings:get', store.get('settings'))
  })

  
  // creates the menu, on mac it is on top left bar
  const mainMenu = Menu.buildFromTemplate(menu)
  Menu.setApplicationMenu(mainMenu)

  /*
  * When we close the window using the x button on Mac, we just want to hide it instead of quiting it, and quit it 
  * either from clicking quit from the tray icon or from going to file menu and quit. This code ensures that
  */
  mainWindow.on('close',e => {
    if (!app.isQuiting){
      e.preventDefault()
      mainWindow.hide()
    }

    return true
  })

  const icon = path.join(__dirname,'assets', 'icons', 'tray_icon.png')

  // creating tray
  tray = new Tray(icon)

  // this hides and shows the window when we click on the tray icon
  tray.on('click', () => {
    if (mainWindow.isVisible() === true){
      mainWindow.hide()
    }
    else{
      mainWindow.show()
    }
  })

  // when we right click on the tray icon, we will see a menu with quit, this code
  // allows that functionality
  tray.on('right-click', () => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Quit',
        click: () => {
          app.isQuiting = true
          app.quit()
        }
      }
    ])
    tray.popUpContextMenu(contextMenu)
  })

})

const menu = [
  ...(isMac ? [{ role: 'appMenu' }] : []),
  {
    role: 'fileMenu',
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Toggle Navigation',
        click: () => mainWindow.webContents.send('nav:toggle'),
      }
    ]
  },
  ...(isDev
    ? [
        {
          label: 'Developer',
          submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' },
          ],
        },
      ]
    : []),
]

// Set settings
/*
* this will fire up whenever we receive an event named 'settings:set' from our index.html file, around line 87 in
* that file it sends the event
*/

ipcMain.on('settings:set', (e, value) => {
  store.set('settings', value)
   // this will send an event with name "settings:get", that we will
   // deal with in index.html file using ipcRenderer.on method, and
   // the values of setting
   mainWindow.webContents.send("settings:get", store.get("settings"));
})

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

// app.on('activate', () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createMainWindow()
//   }
// })

app.allowRendererProcessReuse = true
