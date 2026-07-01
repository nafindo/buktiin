const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'BUKTIIN - Packing Evidence System',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Load the React app
  // In development, we can load the Vite dev server
  // mainWindow.loadURL('http://localhost:5173/buktiin/');
  
  // Check if we are running from a packaged app
  const isPackaged = app.isPackaged;
  
  // In production, load the built static files from resources/frontend
  const indexPath = isPackaged 
    ? path.join(process.resourcesPath, 'frontend/index.html')
    : path.join(__dirname, '../app/dist/index.html');
    
  mainWindow.loadFile(indexPath).catch(e => {
    console.log('Failed to load local HTML, trying localhost...', e);
    mainWindow.loadURL('http://localhost:5173/buktiin/');
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function startBackend() {
  const isPackaged = app.isPackaged;
  
  const backendDir = isPackaged
    ? path.join(process.resourcesPath, 'backend')
    : path.join(__dirname, '../backend');
  
  console.log(`Starting backend in: ${backendDir}`);
  
  // We use npx.cmd tsx in dev, but in prod we should ideally run node. 
  // For this quick prototype, running npm.cmd run start works if node_modules are intact.
  backendProcess = spawn('npm.cmd', ['run', 'start'], {
    cwd: backendDir,
    shell: true
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend]: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error]: ${data}`);
  });
}

app.on('ready', () => {
  startBackend();
  createWindow();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

app.on('activate', function () {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
