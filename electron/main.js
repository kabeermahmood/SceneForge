const { app, BrowserWindow, shell, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

const isDev = !app.isPackaged;
const PORT = 3000;

let mainWindow = null;
let serverProcess = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "SceneForge",
    backgroundColor: "#0a0a0f",
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
    if (isDev) mainWindow.webContents.openDevTools();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function waitForPort(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const socket = new net.Socket();
      socket.setTimeout(1000);
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Server did not start within ${timeout / 1000}s`));
        } else {
          setTimeout(check, 500);
        }
      });
      socket.once("timeout", () => {
        socket.destroy();
        setTimeout(check, 500);
      });
      socket.connect(port, "127.0.0.1");
    };
    check();
  });
}

function startProductionServer() {
  const serverDir = path.join(process.resourcesPath, "standalone");
  const serverScript = path.join(serverDir, "server.js");

  serverProcess = spawn(process.execPath, [serverScript], {
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      PORT: String(PORT),
      HOSTNAME: "127.0.0.1",
    },
    cwd: serverDir,
    stdio: ["ignore", "pipe", "pipe"],
  });

  serverProcess.stdout.on("data", (data) => {
    console.log(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`[Server] ${data.toString().trim()}`);
  });

  serverProcess.on("close", (code) => {
    if (!isQuitting) {
      console.error(`Server process exited unexpectedly with code ${code}`);
    }
  });
}

function killServer() {
  if (serverProcess && !serverProcess.killed) {
    isQuitting = true;
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(serverProcess.pid), "/f", "/t"]);
    } else {
      serverProcess.kill("SIGTERM");
      setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill("SIGKILL");
        }
      }, 5000);
    }
  }
}

app.whenReady().then(async () => {
  if (!isDev) {
    startProductionServer();
  }

  try {
    await waitForPort(PORT);
  } catch (err) {
    dialog.showErrorBox(
      "SceneForge — Startup Error",
      `Could not start the application server.\n\n${err.message}\n\nPlease make sure port ${PORT} is not in use and try again.`
    );
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  killServer();
  app.quit();
});

app.on("before-quit", () => {
  killServer();
});
