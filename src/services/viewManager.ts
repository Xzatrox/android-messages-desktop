import { BrowserView, BrowserWindow, ipcMain, shell } from "electron";
import { IS_DEV, IS_MAC } from "../helpers/constants";
import path from "path";
import { app } from "electron";
import fs from "fs";

export type ViewType = "messages" | "chat";

export class ViewManager {
  private messagesView: BrowserView;
  private chatView: BrowserView;
  private tabBarView: BrowserView;
  private currentView: ViewType = "messages";
  private window: BrowserWindow;

  constructor(window: BrowserWindow) {
    this.window = window;
    
    const preloadPath = IS_DEV
      ? path.resolve(app.getAppPath(), "bridge.js")
      : path.resolve(app.getAppPath(), "app", "bridge.js");

    this.tabBarView = new BrowserView({
      webPreferences: {
        preload: preloadPath,
        contextIsolation: false,
        nodeIntegration: true,
      },
    });

    this.messagesView = new BrowserView({
      webPreferences: { 
        session: window.webContents.session,
      },
    });

    this.chatView = new BrowserView({
      webPreferences: { 
        session: window.webContents.session,
      },
    });

    this.tabBarView.setBackgroundColor('#1a73e8');
    this.tabBarView.webContents.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            background: #1a73e8; 
            display: flex; 
            height: 40px; 
            font-family: Arial, sans-serif; 
            -webkit-user-select: none; 
            -webkit-app-region: drag;
            align-items: center;
          }
          .tab { 
            padding: 10px 20px; 
            color: #ffffff; 
            cursor: pointer; 
            font-size: 14px; 
            line-height: 20px;
            -webkit-app-region: no-drag;
          }
          .tab.active { 
            background: #1557b0; 
            font-weight: bold; 
          }
        </style>
      </head>
      <body>
        <div class="tab active" id="msg">Messages</div>
        <div class="tab" id="chat">Chat</div>
        <script>
          const {ipcRenderer} = require('electron');
          document.getElementById('msg').onclick = () => ipcRenderer.send('switch-view', 'messages');
          document.getElementById('chat').onclick = () => ipcRenderer.send('switch-view', 'chat');
        </script>
      </body>
      </html>
    `));

    // Inject minimal notification handler for both views
    this.messagesView.webContents.on('did-finish-load', () => {
      if (this.messagesView.webContents.getURL().includes('messages.google.com/web')) {
        this.messagesView.webContents.executeJavaScript(`
          if (!window.notificationHandlerInstalled) {
            window.notificationHandlerInstalled = true;
            window.OldNotification = window.Notification;
            window.Notification = function(title, options) {
              const notification = new window.OldNotification(title, options);
              return notification;
            };
            window.Notification.permission = "granted";
            window.Notification.requestPermission = async () => "granted";
          }
        `).catch(() => {});
      }
    });

    this.chatView.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: "deny" };
    });

    let chatAuthenticated = false;
    
    this.chatView.webContents.on('did-finish-load', () => {
      const url = this.chatView.webContents.getURL();
      
      // Once authenticated and on chat.google.com, recreate view with preload
      if (url.includes('chat.google.com') && !url.includes('accounts.google.com') && !chatAuthenticated) {
        chatAuthenticated = true;
        const bounds = this.chatView.getBounds();
        this.window.removeBrowserView(this.chatView);
        
        this.chatView = new BrowserView({
          webPreferences: { 
            session: window.webContents.session,
            preload: preloadPath,
            contextIsolation: false,
            nodeIntegration: false,
          },
        });
        
        this.chatView.webContents.on('ipc-message', (_event, channel, ...args) => {
          if (channel === 'set-chat-unread-status') {
            ipcMain.emit('set-chat-unread-status', _event, ...args);
          }
        });
        
        this.chatView.webContents.on('did-finish-load', () => {
          if (this.chatView.webContents.getURL().includes('chat.google.com')) {
            this.chatView.webContents.executeJavaScript('window.interop?.preload_init()').catch(() => {});
          }
        });
        
        // Add navigation handler only after authentication
        this.chatView.webContents.on('will-navigate', (event, url) => {
          if (url.includes('google.com')) {
            return;
          }
          event.preventDefault();
        });
        
        if (this.currentView === 'chat') {
          this.window.addBrowserView(this.chatView);
          this.chatView.setBounds(bounds);
        }
        
        this.chatView.webContents.loadURL(url);
      }
    });

    this.messagesView.webContents.loadURL("https://messages.google.com/web/");
    this.chatView.webContents.loadURL("https://accounts.google.com/signin/v2/identifier?continue=https://chat.google.com&flowName=GlifWebSignIn");

    this.window.addBrowserView(this.messagesView);
    this.window.addBrowserView(this.tabBarView);
    this.updateBounds();
  }

  switchTo(view: ViewType) {
    this.currentView = view;
    const oldView = view === "messages" ? this.chatView : this.messagesView;
    const newView = view === "messages" ? this.messagesView : this.chatView;
    
    this.window.removeBrowserView(oldView);
    this.window.addBrowserView(newView);
    this.updateBounds();
    this.window.setTopBrowserView(this.tabBarView);
    
    this.tabBarView.webContents.executeJavaScript(`
      msg.className = 'tab${view === 'messages' ? ' active' : ''}';
      chat.className = 'tab${view === 'chat' ? ' active' : ''}';
    `).catch(() => {});
  }

  updateBounds() {
    const bounds = this.window.getContentBounds();
    const tabBarHeight = 40;
    this.tabBarView.setBounds({ x: 0, y: 0, width: bounds.width, height: tabBarHeight });
    const view = this.currentView === "messages" ? this.messagesView : this.chatView;
    view.setBounds({ x: 0, y: tabBarHeight, width: bounds.width, height: bounds.height - tabBarHeight });
  }

  getCurrentView() {
    return this.currentView === "messages" ? this.messagesView : this.chatView;
  }
}
