import { app, BrowserWindow, shell, ipcMain, screen, Tray } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let windowState = {}; // 用于存储窗口状态

function createWindow() {
    console.log('env:', process.env.NODE_ENV)

    const tray = new Tray(path.join(__dirname, '/assets/logo.png'))

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        acceptFirstMouse: true,
        roundedCorners: false,
        transparent: true,
        titleBarStyle: 'hiddenInset', // 使用隐藏的标题栏，但保留交通灯按钮
        webPreferences: {
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    mainWindow.setWindowButtonVisibility(true); // 显示交通灯按钮
    mainWindow.setFullScreenable(true)

    mainWindow.on('enter-full-screen', () => {
        windowState = mainWindow.getBounds();
    });

    mainWindow.on('leave-full-screen', () => {
        mainWindow.setBounds(windowState);
    });

    ipcMain.on('dump', (event, value) => {
        console.log(value)
    })

    ipcMain.on('pin-window', (event, shouldPin) => {
        mainWindow.setAlwaysOnTop(shouldPin)
    })

    ipcMain.on('close-window', () => {
        mainWindow.close()
    })

    ipcMain.on('minimize-window', () => {
        mainWindow.minimize()
    })

    ipcMain.on('maximize-window', (event, flag = false) => {
        if (flag) {
            windowState = mainWindow.getBounds();
            mainWindow.setSimpleFullScreen(flag)
            return;
        }

        mainWindow.setSimpleFullScreen(flag)
        mainWindow.setBounds(windowState, true);
    })

    ipcMain.handle('get-mouse-position', () => {
        return screen.getCursorScreenPoint()
    })

    ipcMain.handle('get-menu-section', (event, height = 0) => {
        return {
            xStart: mainWindow.getPosition()[0],
            xEnd: mainWindow.getPosition()[0] + mainWindow.getSize()[0],
            yStart: mainWindow.getPosition()[1],
            yEnd: mainWindow.getPosition()[1] + height
        }
    })

    mainWindow.on('closed', () => {
        ipcMain.removeHandler('get-mouse-position');
        ipcMain.removeHandler('get-menu-section');
        ipcMain.removeAllListeners();
    })

    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.loadFile(join(__dirname, '../dist/index.html'));

    // if (process.env.NODE_ENV === 'development') {
    //     mainWindow.loadURL('http://localhost:5173');
    // } else {
    //     mainWindow.loadFile(join(__dirname, '../dist/index.html'));
    // }
}

app.setName('WebRef')

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('web-contents-created', (e, webContents) => {

    webContents.on('did-finish-load', (e) => {

        webContents.setWindowOpenHandler((details) => {
            shell.openExternal(details.url)

            return { action: 'deny' }
        })

    })
})