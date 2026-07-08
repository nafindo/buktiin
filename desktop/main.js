const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Poll until the backend server is accepting connections
function waitForBackend(url, maxAttempts, callback) {
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    const req = http.get(url, (res) => {
      clearInterval(interval);
      callback(null);
    });
    req.on('error', () => {
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        callback(new Error(`Backend not ready after ${maxAttempts} attempts`));
      }
    });
    req.end();
  }, 500);
}

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

  const isPackaged = app.isPackaged;

  const indexPath = isPackaged
    ? path.join(process.resourcesPath, 'frontend/index.html')
    : path.join(__dirname, '../app/dist/index.html');

  mainWindow.loadFile(indexPath).catch(e => {
    console.log('Failed to load local HTML:', e);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
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

  const indexJsPath = path.join(backendDir, 'dist', 'index.js');

  if (isPackaged) {
    // In packaged apps, ELECTRON_RUN_AS_NODE is disabled by default.
    // Instead of spawning, we can just require the bundled backend directly.
    try {
      process.env.PORT = '3001';
      require(indexJsPath);
      console.log('[Backend] Started successfully via require()');
    } catch (err) {
      console.error('[Backend Error]: Failed to start backend', err);
    }
  } else {
    // Development mode: run compiled JS with node directly (tsx exits immediately)
    backendProcess = spawn('node.exe', [indexJsPath], {
      cwd: backendDir,
      env: { ...process.env, PORT: '3001' },
      shell: false
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Backend]: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Backend Error]: ${data}`);
    });

    backendProcess.on('exit', (code) => {
      console.log(`[Backend] Exited with code: ${code}`);
    });
  }
}

app.setAsDefaultProtocolClient('buktiin');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
    // We can also parse the deep link from commandLine here if needed
    console.log('Second instance launched with:', commandLine);
  });

  app.on('ready', () => {
    startBackend();

  // Wait up to 30 seconds for the backend to be ready before opening the window
  waitForBackend('http://127.0.0.1:3001/', 60, (err) => {
    if (err) {
      console.error('Backend failed to start:', err.message);
    } else {
      console.log('Backend is ready. Opening window.');
    }
    // Open window regardless (frontend has its own offline handling)
    createWindow();
  });
});
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    if (backendProcess) {
      backendProcess.kill();
    }
    app.quit();
  }
});

// Handle custom protocol for macOS
app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  console.log('Opened URL:', url);
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

const { ipcMain } = require('electron');
ipcMain.on('download-file', (event, info) => {
  event.sender.downloadURL(info.url);
  event.sender.session.once('will-download', (event, item, webContents) => {
    if (info.filename) {
      item.setSaveDialogOptions({ defaultPath: info.filename });
    }
  });
});
