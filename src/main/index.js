'use strict'

const { app, BrowserWindow } = require('electron')
const open = require('open')
const fs = require('fs')
const easylabelPath = 'C:\\LABEL\\easylabel.lnk'
const { dialog } = require('electron')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  mainWindow = new BrowserWindow({
    height: 300,
    width: 600,
    minWidth: 500,
    minHeight: 300,
    maxHeight: 500,
    maxWidth: 800,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      webviewTag: true
    },
    resizable: true
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (fs.existsSync(easylabelPath)) {
    open(easylabelPath)
      .then(res => console.log('EasyLabel opened'))
      .catch(err => console.log('Could not open EasyLabel', err))
  } else {
    console.log(dialog.showErrorBox('Could Not Open EasyLabel', 'Could not find a shortcut to easylabel.exe at location: ' + easylabelPath + '.  Easylabel is needed if you need to print out labels from a printer.'))
  }
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
