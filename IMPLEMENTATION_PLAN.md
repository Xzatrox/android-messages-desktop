# Google Chat Integration - Implementation Plan

## Overview
Add Google Chat alongside Android Messages with tab-based switching, shared notifications, and REST API webhook support.

## Architecture

### 1. View Management (`src/services/viewManager.ts`)
- **BrowserView switching**: Manages two separate BrowserViews (Messages & Chat)
- **Tab bar**: 40px top bar for switching between services
- **Dynamic bounds**: Adjusts view size on window resize

### 2. Tab Switcher UI (`src/preload/tab_switcher.ts`)
- **Injected UI**: Blue tab bar with Messages/Chat tabs
- **Click handlers**: Switches active view via IPC
- **Styling**: Fixed position, draggable region for macOS

### 3. Chat API Service (`src/services/chatApiService.ts`)
- **Webhook support**: POST messages to Google Chat webhook URLs
- **Minimal implementation**: Simple HTTPS requests
- **Configuration**: Webhook URL stored in settings

### 4. Chat Observers (`src/preload/chat_observers.ts`)
- **Unread detection**: Monitors `data-unread-count` attributes
- **IPC communication**: Sends unread status to main process
- **Tray integration**: Updates tray icon for Chat unread messages

### 5. Settings Integration
- **chatEnabled**: Toggle Chat feature on/off (default: true)
- **chatWebhookUrl**: Store webhook URL for API integration

## IPC Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `switch-view` | Renderer → Main | Switch between Messages/Chat |
| `set-chat-unread-status` | Renderer → Main | Update Chat unread status |

## User Flow

1. **Launch app** → ViewManager creates both BrowserViews
2. **Tab bar appears** → User clicks Messages or Chat tab
3. **View switches** → Active BrowserView changes, bounds update
4. **Notifications** → Both services use shared notification system
5. **Tray icon** → Shows unread status from either service

## Configuration

### Enable/Disable Chat
```typescript
settings.chatEnabled.value = true; // Enable Chat integration
```

### Set Webhook URL
```typescript
settings.chatWebhookUrl.value = 'https://chat.googleapis.com/v1/spaces/.../messages?key=...';
```

## Next Steps

### Phase 1: Basic Integration (Complete)
- ✅ ViewManager for BrowserView switching
- ✅ Tab switcher UI injection
- ✅ Settings for Chat enable/disable
- ✅ IPC communication setup

### Phase 2: Enhanced Features (TODO)
- [ ] Unified notification manager
- [ ] Chat-specific context menu
- [ ] Separate unread counts per service
- [ ] Keyboard shortcuts (Ctrl+1/2 for tab switching)
- [ ] Settings UI for webhook configuration

### Phase 3: API Integration (TODO)
- [ ] OAuth 2.0 authentication flow
- [ ] Full REST API client (not just webhooks)
- [ ] Message history sync
- [ ] Space/room management

## Testing

1. **Build**: `yarn build:dev`
2. **Run**: `yarn start`
3. **Verify**: Tab bar appears, clicking switches views
4. **Check**: Both Messages and Chat load correctly

## Dependencies

No new dependencies required for basic implementation. For full API integration:
```json
{
  "googleapis": "^134.0.0",
  "@googleapis/chat": "^3.0.0"
}
```

## Notes

- **BrowserView vs WebView**: Using BrowserView for better performance
- **Preload script**: Shared between both views for consistency
- **User agent**: Same spoofing applied to both services
- **Minimal changes**: Existing Messages functionality unchanged
