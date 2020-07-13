const { app, BrowserWindow, Menu, ipcMain, Tray } = require('electron')
const log = require('electron-log')
const Store = require('./Store')
const path = require('path')

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

function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: 'APP NAME',
    width: isDev ? 800 : 500,
    height: 600,
    icon: `${__dirname}/assets/icons/icon.png`,
    resizable: isDev ? true : false,
    backgroundColor: 'white',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    },
  })

  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.loadFile('./app/index.html')
}

app.on('ready', () => {
  createMainWindow()
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.send('settings:get', store.get('settings'))
  })

  

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
ipcMain.on('settings:set', (e, value) => {
  store.set('settings', value)
   mainWindow.webContents.send("settings:get", store.get("settings"));
})

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})

app.allowRendererProcessReuse = true
