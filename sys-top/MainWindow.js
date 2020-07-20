const { BrowserWindow } = require("electron");

class MainWindow extends BrowserWindow {
  // super means it will call the constructor of the parent class which is browserwindow, since
  // passing these values in browswerwindow creates the window, we just called super and pass the required values

  /*
   * Here we are creating the main window of our app, which
   * will create the frame inside which our app will be hosted
   * in windows, the icon option will replace standard electron icon with provided icon
   * in the bottom bar (uncomment the line to see the effect)
   * now why we need to do dirname in icon?
   * https://www.udemy.com/course/electron-from-scratch/learn/lecture/20050728#questions
   */
  constructor(file, isDev) {
    super({
      title: "APP NAME",
      width: isDev ? 800 : 500,
      height: 600,
      icon: `${__dirname}/assets/icons/icon.png`,
      resizable: isDev ? true : false,
      backgroundColor: "white",
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
      },
    });
    this.loadFile(file);
    if (isDev) {
      // open up the dev tools if we are in development mode
      this.webContents.openDevTools();
    }
  }
}

module.exports = MainWindow