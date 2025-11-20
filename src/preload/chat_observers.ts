import { ipcRenderer } from "electron";

export function createChatUnreadObserver(): MutationObserver {
  const observer = new MutationObserver(() => {
    const unreadElements = document.querySelectorAll('[data-unread-count]');
    const hasUnread = Array.from(unreadElements).some(
      (el) => parseInt(el.getAttribute('data-unread-count') || '0') > 0
    );
    ipcRenderer.send("set-chat-unread-status", hasUnread);
  });

  const target = document.querySelector('body');
  if (target) {
    observer.observe(target, {
      subtree: true,
      attributes: true,
      attributeFilter: ['data-unread-count'],
    });
  }

  return observer;
}
