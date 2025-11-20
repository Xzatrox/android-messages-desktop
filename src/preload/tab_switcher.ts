export function injectTabSwitcher() {
  const isChat = window.location.hostname === 'chat.google.com';
  
  const style = document.createElement("style");
  style.textContent = `
    #amd-tab-bar {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 40px;
      background: #1a73e8;
      display: flex;
      z-index: 10000;
      -webkit-app-region: drag;
    }
    .amd-tab {
      padding: 10px 20px;
      color: white;
      cursor: pointer;
      -webkit-app-region: no-drag;
      user-select: none;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 20px;
    }
    .amd-tab.active {
      background: #1557b0;
      font-weight: bold;
    }
    .amd-tab:hover {
      background: #1557b0;
    }
  `;
  document.head.appendChild(style);

  const tabBar = document.createElement("div");
  tabBar.id = "amd-tab-bar";
  tabBar.innerHTML = `
    <div class="amd-tab ${!isChat ? 'active' : ''}" data-view="messages">Messages</div>
    <div class="amd-tab ${isChat ? 'active' : ''}" data-view="chat">Chat</div>
  `;

  document.body.insertBefore(tabBar, document.body.firstChild);
  document.body.style.paddingTop = "40px";

  tabBar.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("amd-tab")) {
      const view = target.getAttribute("data-view");
      (window as any).interop?.switch_view(view);
    }
  });
}
