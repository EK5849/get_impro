const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    backgroundColor: '#0a0a0a',
    title: 'get_Impro - Music Improvisation App',
    // Icono opcional: icon: path.join(__dirname, 'assets/icons/icon.png')
  });

  // Ocultar la barra de menú predeterminada (opcional)
  mainWindow.setMenuBarVisibility(false);

  // Cargar el index.html
  mainWindow.loadFile('index.html');

  // Abrir DevTools si es necesario (solo para desarrollo)
  // mainWindow.webContents.openDevTools();
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
