import {
    app,
    BrowserWindow,
    shell,
    ipcMain,
    screen,
    Tray,
    nativeImage,
    Menu,
    webContents,
    session
} from 'electron';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(isDev ? 'Running in development' : 'Running in production');

const windowState = {}
const appIcon = nativeImage.createFromPath(join(__dirname, '/assets/logo-500x500.png'))

const findWindow = (event) => {
    return BrowserWindow.fromWebContents(event.sender)
}

function createWindow() {

    const window = new BrowserWindow({
        width: 1200,
        height: 800,
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
            devTools: true,
            session: session.fromPartition('persist:MilaRef'),
            partition: 'persist:MilaRef',
            // nodeIntegration: true,
            // nodeIntegrationInSubFrames: true,
            // contextIsolation: false
        },
    });

    windowState[window.id] = {
        pin: false,
        bounds: {}
    }

    console.log('CREATED NEW WINDOW:', window.id);

    window.setFullScreenable(true)

    window
        .once('ready-to-show', () => {
            window.show()
            window.setBackgroundColor('rgba(0, 0, 0, 0)')
        })
        .on('enter-full-screen', () => {
            windowState[window.id].bounds = window.getBounds();
        })
        .on('leave-full-screen', () => {
            window.setBounds(windowState[window.id].bounds);
        })
        .on('focus', () => {
            window.webContents.send('on-focus');

            window.webContents.on('before-input-event', (event, input) => {
                if (input.key !== 'Tab') return
                window.webContents.send('toggle-tool-bar')
                event.preventDefault();
            });
        })
        .on('blur', () => {
            window.webContents.send('on-blur');

            window.webContents.removeAllListeners('before-input-event');
        })
        .on('closed', () => {
            // todo do something when globally detected it's closed
            delete windowState[window.id].bounds
        })

    isDev
        ? window.loadURL('http://localhost:5173')
        : window.loadFile(join(__dirname, '../dist/index.html'))
}

app.setName('MilaRef')

app.whenReady()
    .then(() => {
        if (process.platform === 'darwin') {
            app.dock.setIcon(appIcon)
            app.dock.setMenu(Menu.buildFromTemplate([
                {
                    label: 'New Window',
                    click: createWindow
                }
            ]))
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
            }

            return {
                xStart: currentWindow.getPosition()[0],
                xEnd: currentWindow.getPosition()[0] + currentWindow.getSize()[0],
                yStart: currentWindow.getPosition()[1],
                yEnd: currentWindow.getPosition()[1] + height
            }
        })

        ipcMain.handle('toggle-ignore-mouse', (event, shouldIgnoreMouse, rects) => {
            const win = BrowserWindow.fromWebContents(event.sender)
            if (!win) return

            console.log('shouldIgnoreMouse', shouldIgnoreMouse)
            console.log('rects', rects)
            if (shouldIgnoreMouse) {
                console.log('set shape', rects)
                win.setShape(rects)
                win.setIgnoreMouseEvents(true, { forward: true })
            } else {
                win.setIgnoreMouseEvents(false)
            }
        })

        ipcMain.handle('set-ignore-mouse-events', (event, ignore) => {
            const win = BrowserWindow.fromWebContents(event.sender)
            console.log('win win win', win)
            console.log('ignore ignore ignore', ignore)
            if (!win) return


            // 允许穿透点击（但仍允许拖动窗口）
            win.setIgnoreMouseEvents(ignore, { forward: true })
        })

        ipcMain.handle('get-window-bounds', (event) => {
            const win = BrowserWindow.fromWebContents(event.sender)
            return win.getBounds()
        })

        ipcMain
            .on('dump', (event, value) => {
                console.log(value)
            })
            .on('webview-ready', (event, id) => {
                const webviewContents = webContents.fromId(id);
                const currentWindow = findWindow(event)

                // 保存上一次的高度值
                let lastHeight = null

                const generateCodeForListenerHeaderHeight = () => `
(function() {
    return new Promise((resolve) => {
    
        // 创建observer
        const observer = new MutationObserver(() => {
        
            const header = document.querySelector('header.AppHeader');
            
            if (header) {
                const height = header.offsetHeight;

                if (height !== ${lastHeight}) {
                
                    observer.disconnect(); // 停止当前的监听器
                    resolve(height); // 返回新的高度值
                    
                }
            }
            
        });

        // 设置监听，观察 DOM 变化
        observer.observe(document.body, { childList: true, subtree: true });
        
    });
})();
                `

                const startListenerForHeaderHeight = () => {
                    webviewContents.executeJavaScript(generateCodeForListenerHeaderHeight())
                        .then(height => {
                            lastHeight = height
                            currentWindow.webContents.send('change-header-height', height);
                            startListenerForHeaderHeight()
                        })
                        .catch(error => {
                            console.error('Error in listening for header height:', error);
                        });
                }

                startListenerForHeaderHeight()

                webviewContents.on('before-input-event', (event, input) => {
                    if (input.key !== 'Tab') return

                    currentWindow.webContents.send('toggle-tool-bar')
                    event.preventDefault()
                });
            })
            .on('toggle-traffic-light', (event, value) => {
                findWindow(event).setWindowButtonVisibility(value);
            })
            .on('pin-window', (event, shouldPin) => {
                const currentWindow = findWindow(event)
                windowState[currentWindow.id].pin = shouldPin
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
                    currentWindow.setBounds(currentWindow.getBounds());
                    windowState[currentWindow.id].bounds = currentWindow.getBounds();
                    currentWindow.setSimpleFullScreen(isFull)
                    return;
                }

                currentWindow.setSimpleFullScreen(isFull)
                currentWindow.setBounds(windowState[currentWindow.id].bounds, true);
                currentWindow.setAlwaysOnTop(windowState[currentWindow.id]?.pin || false)
            })
    })

app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
    .on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
    .on('web-contents-created', (e, webContents) => {

        webContents.on('did-finish-load', (e) => {

            webContents.setWindowOpenHandler((details) => {
                shell.openExternal(details.url)

                return { action: 'deny' }
            })

        })

    })
