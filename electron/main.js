import { app, BrowserWindow, shell, ipcMain, screen, Tray, globalShortcut, nativeImage, Menu } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('FILENAME', __dirname)

let windowState = {}; // 用于存储窗口状态
const appIcon = nativeImage.createFromPath(path.join(__dirname, '/assets/logo.png'))
const isMouseInWindow = window => {
    const mousePosition = screen.getCursorScreenPoint();
    const windowPosition = window.getPosition();
    const windowSize = window.getSize();

    const xInWindow = mousePosition.x >= windowPosition[0] && mousePosition.x <= (windowPosition[0] + windowSize[0]);
    const yInWindow = mousePosition.y >= windowPosition[1] && mousePosition.y <= (windowPosition[1] + windowSize[1]);

    return xInWindow && yInWindow;
}

function createWindow() {
    console.log('env:', process.env.NODE_ENV)

    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        icon: appIcon,
        acceptFirstMouse: true,
        roundedCorners: false,
        transparent: true,
        titleBarStyle: 'hidden',
        // titleBarStyle: 'hiddenInset', // 使用隐藏的标题栏，但保留交通灯按钮
        webPreferences: {
            webviewTag: true,
            preload: path.join(__dirname, 'preload.js')
        },
    });

    globalShortcut.register('Tab', () => {
        if (isMouseInWindow(mainWindow)) {
            mainWindow.webContents.send('toggle-tool-bar')
        }
    })

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

    ipcMain.on('toggle-traffic-light', (event, value) => {
        mainWindow.setWindowButtonVisibility(value); // 显示交通灯按钮
    })

    ipcMain.on('pin-window', (event, shouldPin) => {
        mainWindow.setAlwaysOnTop(shouldPin)
    })

    ipcMain.on('close-window', () => {
        console.log('CLOSE WINDOW')
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

const dockMenu = Menu.buildFromTemplate([
    {
        label: 'New Window',
        click () { console.log('New Window'); createWindow() }
    }, {
        label: 'New Window with Settings',
        submenu: [
            { label: 'Basic' },
            { label: 'Pro' }
        ]
    },
    { label: 'New Command...' }
])


app.whenReady().then(() => {
    if (process.platform === 'darwin') {
        app.dock.setMenu(dockMenu)
        app.dock.setIcon(appIcon)
    }
}).then(createWindow)

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