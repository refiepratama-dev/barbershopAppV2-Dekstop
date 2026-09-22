const { app, BrowserWindow } = require("electron");
const path = require("path");

const serveModule = require("electron-serve");
const serve = serveModule.default || serveModule;

const loadURL = serve({ directory: "out" });

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Barbershop POS - Desktop",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    win.loadURL("http://localhost:3000");
  } else {
    loadURL(win);
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
