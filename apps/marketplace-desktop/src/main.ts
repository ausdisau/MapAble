/**
 * MapAble Marketplace desktop alpha — Electron 45 TypeScript wrapper around
 * the existing server-authenticated Next.js closed alpha.
 * No preload, IPC, Node bridge, file handling, payments, auto-update or
 * arbitrary external navigation. A signed binary has NOT been produced.
 */
import { app, BrowserWindow, dialog, session } from "electron";
import { resolveDesktopOrigin, isAllowedDesktopUrl } from "./origin-policy";

let mainWindow: BrowserWindow | null = null;
const DEV = !app.isPackaged;

function boot() {
  let origin: string;
  try {
    origin = resolveDesktopOrigin({
      value: process.env.MAPABLE_DESKTOP_ALPHA_ORIGIN,
      packaged: app.isPackaged,
      releaseApproved: process.env.MAPABLE_DESKTOP_RELEASE_APPROVED === "true",
      reviewedOrigin: process.env.MAPABLE_DESKTOP_REVIEWED_ORIGIN,
    });
  } catch (error) {
    void dialog.showErrorBox(
      "MapAble desktop alpha is not configured",
      error instanceof Error ? error.message : "Unknown configuration error",
    );
    app.quit();
    return;
  }

  const allow = (url: string): boolean => isAllowedDesktopUrl(url, origin, DEV);
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    // In-browser navigation and network requests remain on the same approved
    // MapAble origin. OAuth redirects and third-party media are NOT supported.
    if (!allow(details.url)) callback({ cancel: true });
    else callback({});
  });

  mainWindow = new BrowserWindow({
    width: 1320, height: 860, minWidth: 700, minHeight: 550,
    show: false, title: "MapAble Marketplace — Closed Alpha",
    backgroundColor: "#f6f8fc",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
      allowRunningInsecureContent: false,
      // No preload / IPC: remote Next.js never acquires native privileges.
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!allow(url)) event.preventDefault();
  });
  mainWindow.webContents.on("will-redirect", (event, url) => {
    if (!allow(url)) event.preventDefault();
  });
  mainWindow.webContents.on("will-attach-webview", (event) => event.preventDefault());
  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
  });
  mainWindow.on("closed", () => { mainWindow = null; });

  const landing = origin + "/marketplace/design-lab/closed-alpha";
  void mainWindow.loadURL(landing).catch(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      void dialog.showMessageBox(mainWindow, {
        type: "warning", buttons: ["Close"],
        message: "Could not load MapAble Marketplace alpha.",
        detail: "Check the Next.js server, network, authentication and closed-alpha admission flags. No offline mode is available.",
      });
    }
  });
}

app.whenReady().then(() => {
  boot();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) boot();
  });
}).catch(() => app.quit());

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
