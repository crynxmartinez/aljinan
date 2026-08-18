const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      partition: 'persist:tasheel'
    },
    autoHideMenuBar: true,
    title: 'Tasheel'
  });

  // Load the production website
  mainWindow.loadURL('https://www.tasheel.live');

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Hand only ordinary web links to the OS. Without this check any protocol the page
    // names, including file:, is opened by whatever is registered to handle it.
    try {
      const { protocol } = new URL(url);
      if (protocol === 'https:' || protocol === 'http:' || protocol === 'mailto:') {
        require('electron').shell.openExternal(url);
      }
    } catch {
      // not a URL we can reason about; ignore
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
