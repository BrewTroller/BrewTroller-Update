const electron = require('electron')
const electronApp = electron.app
const BrowserWindow = electron.BrowserWindow
const path = require('path')
const url = require('url')

let win

let app

function createWindow() {
    win = new BrowserWindow({width: 1024, height: 550})
    win.loadURL(url.format({
        pathname: path.join(__dirname, '../html/index.html'),
        protocol: 'file:',
        slashes: true
    })

    win.on('closed', () => {
        win = null
    })   
}

electronApp.on('ready', createWindow)
electronApp.on('activate', () => {
    if (win == null) {
        createWindow()
    }
})
