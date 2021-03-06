// console.log("Hello World")
const {app, BrowserWindow, Menu, globalShortcut, ipcMain, shell} = require('electron');
const path = require('path')
const os = require('os')
const imagemin = require('imagemin')
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngQuant = require("imagemin-pngquant");
const slash = require('slash')
const log = require('electron-log')

// this sets the environment and we need to set it to production after we are done
process.env.NODE_ENV = 'production';

// checks if we are in production mode
const isDev = process.env.NODE_ENV !== 'production' ? true: false;

// check if the environment is a mac
const isMac = process.platform === 'darwin' ? true: false;
let mainWindow;
let aboutWindow;

/*
* Here we are creating the main window of our app, which
* will create the frame inside which our app will be hosted
* in windows, the icon option will replace standard electron icon with provided icon
* in the bottom bar (uncomment the line to see the effect)
* now why we need to do dirname in icon?
* https://www.udemy.com/course/electron-from-scratch/learn/lecture/20050728#questions
*/
createMainWindow = () => {
    mainWindow = new BrowserWindow({
        title: 'ImageShrink',
        width: 500,
        height: 600,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: isDev,
        backgroundColor: 'white',
        // we need to do this 
        // https://www.udemy.com/course/electron-from-scratch/learn/lecture/19824022#questions/10984112
        // watch from 1:15
        // it basically allows us to write a bit of nodejs in our index.html file, or in other words, it integrates 
        // nodejs in our index.html file
        webPreferences: {
            nodeIntegration: true,
        },
    })
    /*
    * after creating the main window, here we are pointing our 
    * app to host the file,
    * Here the title of the index.html file will overwrite the
    * title we defined in the BrowserWindow constructor
    */

   /*
   * with loadURL we can load a website inside our app, but for loading files we need 
   * to provide the file tag and dirname stuff. loadFile is easier to use in this
   * sense
   */
    // mainWindow.loadURL(`file://${__dirname}/app/index.html`);
    mainWindow.loadFile('./app/index.html');
}

// creates the about us window
createAboutWindow = () => {
    aboutWindow = new BrowserWindow({
        title: 'About ImageShrink',
        width: 300,
        height: 300,
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        resizable: false,
        backgroundColor: 'white'
    })
    aboutWindow.loadFile('./app/about.html');
}

/*
* globalShortcut allows us to register a shortcut globally
* here Cmd+R or Ctrl+R will reload the main window
* Cmd+i or ctrl+i will bring up the dev tools
* the CmdOrCtrl is appropriate when our command is very short (only two keys like cmd+r)
*/
app.on('ready', () => {
    createMainWindow()
    // this creates the menu, look at google doc to see the required steps
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)
    // since we have developer menu where we use roles that automatically 
    // enables this shortcuts, we don't need them anymore
    // globalShortcut.register('CmdOrCtrl+R', () => mainWindow.reload())
    // globalShortcut.register(isMac?"Command+Alt+I":"Ctrl+Shift+I", () => mainWindow.toggleDevTools())
    mainWindow.on('close', ()=> (mainWindow = null))
});

// creating menus
/*
* What does the isMac portion do? https://www.udemy.com/course/electron-from-scratch/learn/lecture/19823966#questions
* watch from 3:00
* basically we won't see the top level menu file on the mac os menu, the Quit
* will be under electron menu, in order to show the File in the menu with the
* Quit submenu, we need to do the isMac part
* accelerator is basically a keyboard shortcut, it means on mac if we do cmd+w then
* the app will quit, and on windows ctrl+w will make the app quit,
* later we used role to initiate our menu
*/
// const menu = [
//     ... (isMac ? [
//         {role: 'appMenu'}
//     ]:[]) ,
//     {
//         label: 'File',
//         submenu: [
//             {
//                 label: 'Quit',
//                 click: () => app.quit(),
//                 // accelerator: isMac? "Command+W":"Ctrl+W"
//                 accelerator: "CmdOrCtrl+W"
//             }
//         ]
//     }
// ]

/*
* https://www.electronjs.org/docs/api/menu
* search the doc with role, they are constant keywords that creates the appropriate
* menu items
* role automatically create the label, the appropriate click events and shortcuts
* type: separatro creates a horizontal line/divider,
* look at google doc to see the end result
*/
const menu = [
    ... (isMac ? [
        { 
            label: app.name,
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }
    ] : []),
    {role:'fileMenu'},
    ...(!isMac ? [
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About',
                    click: createAboutWindow
                }
            ]
        }
    ]: []),
    ...(isDev ? [{
        label: 'Developer',
        submenu: [
            {role: 'reload'},
            { role: 'forcereload' },
            { type: 'separator' },
            { role: 'toggledevtools' }
        ]
    }]: [] )
]

// processing the file sent here from index.html, the id in opcRenderer has to be exact match
ipcMain.on("image:minimize", (e, options) => {
    console.log(options)
    options.dest = path.join(os.homedir(), "imageshrink");
    shrinkImage(options);
});

// shirnking image stuff
const shrinkImage = async ({imgPath,quality,dest}) => {
    try {
        // we use different plugin for different image type, imageminMozjpeg for jpeg, PNGQUANT for png etc
        // in png we have to have values in 0.1-1.0 range, that is why we need to divide it by 100
        const pngQuality = quality/100
        // we use slash to avoid issues in windows path due to forward and backward slash
        // this basically shrinks the image
        // we use async because it takes some time to get the file
        console.log(imgPath)
        const files = await imagemin([slash(imgPath)],{
            destination: dest,
            plugins: [
                imageminMozjpeg({quality}),
                imageminPngQuant({
                    quality: [pngQuality,pngQuality]
                })
            ]
        })
        console.log(files)
        log.info(files)
        // this opens the destination folder
        shell.openPath(dest)
        // we are sending event from here to our front-end html file letting them know its done
        mainWindow.webContents.send('image:done')
    } catch (error) {
        console.log(error)
        log.error(error)
    }
}

// some macOs stuff
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow()
  }
})