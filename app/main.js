'use strict';

// TODO: Integrate auto-updater.
const {app, BrowserWindow} = require('electron');
const updater = require('electron-simple-updater');
const process = require('process');

let mainWindow;

app.on('ready', () => {

	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true
	});

	mainWindow.loadURL('file://' + __dirname + '/index.html');

	if (process.env.NODE_ENV === 'development')
    mainWindow.webContents.openDevTools();
});

updater.init({
	autoDownload: false,
	checkUpdateOnStart: false
});

