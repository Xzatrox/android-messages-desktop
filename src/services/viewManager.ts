import { BrowserView, BrowserWindow } from "electron";
import { IS_DEV } from "../helpers/constants";
import path from "path";
import { app } from "electron";

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
      webPreferences: { preload: preloadPath },
    });

    this.chatView = new BrowserView({
      webPreferences: { preload: preloadPath },
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
            align-items: center;
          }
          .tab { 
            padding: 10px 20px; 
            color: #ffffff; 
            cursor: pointer; 
            font-size: 14px; 
            line-height: 20px;
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

    this.messagesView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    this.chatView.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    this.messagesView.webContents.loadURL("https://messages.google.com/web/");
    this.chatView.webContents.loadURL("https://chat.google.com/");

    this.window.addBrowserView(this.tabBarView);
    this.window.addBrowserView(this.messagesView);
    this.updateBounds();
  }

  switchTo(view: ViewType) {
    this.currentView = view;
    const oldView = view === "messages" ? this.chatView : this.messagesView;
    const newView = view === "messages" ? this.messagesView : this.chatView;
    
    this.window.removeBrowserView(oldView);
    this.window.addBrowserView(newView);
    this.window.setTopBrowserView(this.tabBarView);
    this.updateBounds();
    
    this.tabBarView.webContents.executeJavaScript(`
      msg.className = 'tab${view === 'messages' ? ' active' : ''}';
      chat.className = 'tab${view === 'chat' ? ' active' : ''}';
    `);
  }

  updateBounds() {
    const bounds = this.window.getContentBounds();
    this.tabBarView.setBounds({ x: 0, y: 0, width: bounds.width, height: 40 });
    const view = this.currentView === "messages" ? this.messagesView : this.chatView;
    view.setBounds({ x: 0, y: 40, width: bounds.width, height: bounds.height - 40 });
  }

  getCurrentView() {
    return this.currentView === "messages" ? this.messagesView : this.chatView;
  }
}
