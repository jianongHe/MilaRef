import {
    app,
    BrowserWindow,
    shell,
    ipcMain,
    screen,
    Tray,
    nativeImage,
    Menu,
    webContents
} from 'electron';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log('FILENAME', __dirname)

let windowState = {}; // 用于存储窗口状态
const appIcon = nativeImage.createFromPath(join(__dirname, '/assets/logo.png'))

const findWindow = (event) => {
    return BrowserWindow.fromWebContents(event.sender)
}

function createWindow() {
    console.log('env:', process.env.NODE_ENV)

    const window = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        icon: appIcon,
        show: false,
        acceptFirstMouse: true,
        roundedCorners: false,
        transparent: true,
        backgroundColor: 'rgba(35, 35, 35, 1)',
        titleBarStyle: 'hidden',
        fullscreenable: true,
        // titleBarStyle: 'hiddenInset', // 使用隐藏的标题栏，但保留交通灯按钮
        webPreferences: {
            webviewTag: true,
            preload: join(__dirname, 'preload.js'),
            scrollBounce: true,
            devTools: true
        },
    });

    console.log('CREATED NEW WINDOW:', window.id);

    window.setFullScreenable(true)

    window
        .once('ready-to-show', () => {
            window.show()
            window.setBackgroundColor('rgba(0, 0, 0, 0)')
        })
        .on('enter-full-screen', () => {
            windowState[window.id] = window.getBounds();
        })
        .on('leave-full-screen', () => {
            window.setBounds(windowState[window.id]);
        })
        .on('focus', () => {
            window.webContents.on('before-input-event', (event, input) => {
                if (input.key !== 'Tab') return
                window.webContents.send('toggle-tool-bar')
                event.preventDefault();
            });
        })
        .on('blur', () => {
            window.webContents.removeAllListeners('before-input-event');
        })
        .on('closed', () => {
            // todo do something when globally detected it's closed
            delete windowState[window.id]
        })

    window.loadURL('http://localhost:5173');
    // window.loadFile(join(__dirname, '../dist/index.html'));

    // if (process.env.NODE_ENV === 'development') {
    //     window.loadURL('http://localhost:5173');
    // } else {
    //     window.loadFile(join(__dirname, '../dist/index.html'));
    // }
}

app.setName('WebRef')

app.whenReady()
    .then(() => {
        if (process.platform === 'darwin') {
            app.dock.setMenu(Menu.buildFromTemplate([{
                label: 'New Window', click() {
                    createWindow()
                }
            }, {
                label: 'New Window with Settings', submenu: [{label: 'Basic'}, {label: 'Pro'}]
            }, {label: 'New Command...'}]))
            app.dock.setIcon(appIcon)
        }
    })
    .then(() => {
        createWindow()

        ipcMain.handle('get-mouse-position', () => {
            return screen.getCursorScreenPoint()
        })

        ipcMain.handle('get-menu-section', (event, height = 0) => {
            const currentWindow = findWindow(event)

            if (!currentWindow) {
                return
                throw Error('Could not find current Window')
            }

            return {
                xStart: currentWindow.getPosition()[0],
                xEnd: currentWindow.getPosition()[0] + currentWindow.getSize()[0],
                yStart: currentWindow.getPosition()[1],
                yEnd: currentWindow.getPosition()[1] + height
            }
        })

        ipcMain
            .on('dump', (event, value) => {
                console.log(value)
            })
            .on('webview-ready', (event, id) => {
                const webviewContents = webContents.fromId(id);
                const currentWindow = findWindow(event)

                webviewContents.on('before-input-event', (event, input) => {
                    if (input.key !== 'Tab') return
                    currentWindow.webContents.send('toggle-tool-bar')
                    event.preventDefault()
                });
            })
            .on('toggle-traffic-light', (event, value) => {
                findWindow(event).setWindowButtonVisibility(value); // 显示交通灯按钮
            })
            .on('pin-window', (event, shouldPin) => {
                findWindow(event).setAlwaysOnTop(shouldPin)
            })
            .on('close-window', (event) => {
                findWindow(event).close()
            })
            .on('minimize-window', (event) => {
                findWindow(event).minimize()
            })
            .on('maximize-window', (event, isFull = false) => {
                const currentWindow = findWindow(event)

                if (isFull) {
                    windowState[currentWindow.id] = currentWindow.getBounds();
                    currentWindow.setSimpleFullScreen(isFull)
                    return;
                }

                currentWindow.setSimpleFullScreen(isFull)
                currentWindow.setBounds(windowState[currentWindow.id], true);
            })
    })

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
    .on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
    .on('web-contents-created', (e, webContents) => {

        webContents.on('did-finish-load', (e) => {

            webContents.setWindowOpenHandler((details) => {
                shell.openExternal(details.url)

                return {action: 'deny'}
            })

        })

    })
