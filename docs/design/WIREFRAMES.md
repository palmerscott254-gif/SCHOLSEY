# UI Wireframes

## 📱 Mobile App Wireframes

### 1. Login Screen
```
┌─────────────────────────────────┐
│                                 │
│         🔐 Device Tracker       │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Email                   │   │
│   └─────────────────────────┘   │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Password                │   │
│   └─────────────────────────┘   │
│                                 │
│   [      LOGIN      ]           │
│                                 │
│   👆 Use Biometrics             │
│                                 │
│   Don't have an account?        │
│   Sign up                       │
│                                 │
└─────────────────────────────────┘
```

### 2. Dashboard Screen
```
┌─────────────────────────────────┐
│  ☰  Dashboard           👤 🔔   │
├─────────────────────────────────┤
│                                 │
│  📊 Device Status               │
│  ┌─────────────────────────┐   │
│  │ ● Online                │   │
│  │ 🔋 85%  📡 WiFi         │   │
│  │ 📍 Last updated: 2m ago │   │
│  └─────────────────────────┘   │
│                                 │
│  🔒 Security Status             │
│  ┌─────────────────────────┐   │
│  │ ✅ All systems normal   │   │
│  │ 🛡️ Stealth: OFF         │   │
│  │ 📸 Auto-capture: ON     │   │
│  └─────────────────────────┘   │
│                                 │
│  ⚠️ Recent Alerts (0)           │
│  ┌─────────────────────────┐   │
│  │ No recent alerts        │   │
│  └─────────────────────────┘   │
│                                 │
│  [  View Location History  ]    │
│  [  Security Settings     ]     │
│                                 │
└─────────────────────────────────┘
```

### 3. Security Alerts Screen
```
┌─────────────────────────────────┐
│  ← Security Alerts      🔍      │
├─────────────────────────────────┤
│                                 │
│  🔴 Failed Login Attempt        │
│  ┌─────────────────────────┐   │
│  │ 3 attempts detected     │   │
│  │ 📍 Location captured    │   │
│  │ 📸 Photo taken          │   │
│  │ ⏰ 2 hours ago          │   │
│  │ [View Details]          │   │
│  └─────────────────────────┘   │
│                                 │
│  🟡 SIM Status Changed          │
│  ┌─────────────────────────┐   │
│  │ SIM card removed        │   │
│  │ ⏰ Yesterday 11:30 PM   │   │
│  │ [View Details]          │   │
│  └─────────────────────────┘   │
│                                 │
│  🟢 Device Connected            │
│  ┌─────────────────────────┐   │
│  │ Dashboard login         │   │
│  │ ⏰ 3 days ago           │   │
│  └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### 4. Settings Screen
```
┌─────────────────────────────────┐
│  ← Settings                     │
├─────────────────────────────────┤
│                                 │
│  🔐 Security                    │
│  ├ 🛡️ Stealth Mode    [OFF]    │
│  ├ 📸 Auto Capture    [ON ]    │
│  ├ 🔊 Voice Trigger   [ON ]    │
│  └ 🎭 Decoy Mode      [OFF]    │
│                                 │
│  📍 Location                    │
│  ├ Tracking          [ON ]    │
│  ├ Update Interval   60s      │
│  └ Geo-fencing       [OFF]    │
│                                 │
│  🔔 Notifications               │
│  ├ Push Alerts       [ON ]    │
│  ├ Email Alerts      [OFF]    │
│  └ SMS Alerts        [OFF]    │
│                                 │
│  ⚙️ Advanced                    │
│  ├ Battery Saver     [OFF]    │
│  ├ Background Mode   [ON ]    │
│  └ Root Detection    [ON ]    │
│                                 │
└─────────────────────────────────┘
```

## 🖥️ Desktop Dashboard Wireframes

### 1. Main Dashboard
```
┌────────────────────────────────────────────────────────────────────┐
│  ☰ Device Tracker                               👤 John  🔔 3  ⚙️  │
├───────────────┬────────────────────────────────────────────────────┤
│               │                                                    │
│  Dashboard    │  📊 Dashboard Overview                            │
│  🗺️ Device Map│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  ⚠️ Alerts    │  │📱      │ │📍      │ │⚠️      │ │🔋      │   │
│  📈 Timeline  │  │Devices │ │Active  │ │Alerts  │ │Battery │   │
│  🤖 AI        │  │  3     │ │  2     │ │  5     │ │  85%   │   │
│  ⚙️ Settings  │  └────────┘ └────────┘ └────────┘ └────────┘   │
│               │                                                    │
│               │  📱 Connected Devices                             │
│               │  ┌─────────────────────────────────────────────┐ │
│               │  │ 📱 iPhone 15 Pro                           ● │ │
│               │  │    iOS 17.2 • Online • 85% 🔋              │ │
│               │  │    📍 Last seen: 2 minutes ago             │ │
│               │  │    [Lock] [Alarm] [Locate]                │ │
│               │  ├─────────────────────────────────────────────┤ │
│               │  │ 📱 Samsung Galaxy S23                      ● │ │
│               │  │    Android 14 • Online • 42% 🔋           │ │
│               │  │    📍 Last seen: 5 minutes ago             │ │
│               │  │    [Lock] [Alarm] [Locate]                │ │
│               │  ├─────────────────────────────────────────────┤ │
│               │  │ 📱 iPad Air                                ○ │ │
│               │  │    iOS 17.1 • Offline • Last: 2 hours ago  │ │
│               │  │    [View History]                         │ │
│               │  └─────────────────────────────────────────────┘ │
│               │                                                    │
│               │  ⚠️ Recent Alerts                                 │
│               │  ┌─────────────────────────────────────────────┐ │
│               │  │ 🔴 Failed Login • iPhone 15 • 2h ago       │ │
│               │  │ 🟡 SIM Removed • Galaxy S23 • Yesterday    │ │
│               │  │ 🟢 Device Online • iPad Air • 3 days ago   │ │
│               │  └─────────────────────────────────────────────┘ │
│               │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

### 2. Device Map View
```
┌────────────────────────────────────────────────────────────────────┐
│  ☰ Device Tracker                               👤 John  🔔 3  ⚙️  │
├───────────────┬────────────────────────────────────────────────────┤
│               │  🗺️ Device Map                    [📍] [🛰️] [🔍]  │
│  Dashboard    │  ┌─────────────────────────────────────────────┐  │
│  🗺️ Device Map│  │                                             │  │
│  ⚠️ Alerts    │  │         ╔════════════════════╗              │  │
│  📈 Timeline  │  │         ║    ~  ~  ~  ~  ~   ║              │  │
│  🤖 AI        │  │         ║  ~   📍A  ~  ~  ~ ║              │  │
│  ⚙️ Settings  │  │         ║ ~  ~  ~  📍B  ~   ║              │  │
│               │  │         ║  ~  ~  ~  ~  ~  ~ ║              │  │
│  Devices      │  │         ║ ~  ~  ~  ~  ~  ~  ║              │  │
│  ─────────    │  │         ╚════════════════════╝              │  │
│  ✅ iPhone 15 │  │                                             │  │
│     85% 🔋    │  │  Map Data: Mapbox                          │  │
│  ✅ Galaxy S23│  └─────────────────────────────────────────────┘  │
│     42% 🔋    │                                                    │
│  ❌ iPad Air  │  📱 Selected: iPhone 15 Pro                       │
│               │  ─────────────────────────────────────────────    │
│               │  📍 40.7128° N, 74.0060° W                       │
│               │  ⏰ Last update: 2 minutes ago                    │
│               │  🔋 Battery: 85%                                  │
│               │  📡 Network: WiFi                                 │
│               │  🛡️ Status: Protected                            │
│               │                                                    │
│               │  [🔒 Lock Device]  [📢 Trigger Alarm]            │
│               │  [🗺️ View History] [⚙️ Settings]                │
│               │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

### 3. Alerts & Timeline
```
┌────────────────────────────────────────────────────────────────────┐
│  ☰ Device Tracker                               👤 John  🔔 3  ⚙️  │
├───────────────┬────────────────────────────────────────────────────┤
│               │  ⚠️ Security Alerts & Timeline                    │
│  Dashboard    │  ┌─────┬──────┬────────┬────────┐                │
│  🗺️ Device Map│  │ All │ High │ Medium │  Low   │ [🔍 Search]    │
│  ⚠️ Alerts    │  └─────┴──────┴────────┴────────┘                │
│  📈 Timeline  │                                                    │
│  🤖 AI        │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ⚙️ Settings  │  ┃ 🔴 CRITICAL - Failed Login Attempts      ┃  │
│               │  ┃ iPhone 15 Pro • 2 hours ago              ┃  │
│               │  ┃ ─────────────────────────────────────────┃  │
│               │  ┃ 3 failed attempts detected               ┃  │
│               │  ┃ 📍 Location: 40.7128°N, 74.0060°W       ┃  │
│               │  ┃ 📸 Photo captured: [View Image]          ┃  │
│               │  ┃ ✉️ Alert sent to: user@email.com        ┃  │
│               │  ┃                                          ┃  │
│               │  ┃ [Acknowledge] [View Details] [Dismiss]  ┃  │
│               │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│               │                                                    │
│               │  ┌──────────────────────────────────────────────┐ │
│               │  │ 🟡 MEDIUM - SIM Card Status Changed         │ │
│               │  │ Galaxy S23 • Yesterday 11:30 PM             │ │
│               │  │ ───────────────────────────────────────────  │ │
│               │  │ SIM card removed from device                │ │
│               │  │ [View Details]                              │ │
│               │  └──────────────────────────────────────────────┘ │
│               │                                                    │
│               │  ┌──────────────────────────────────────────────┐ │
│               │  │ 🟢 INFO - Device Connected                  │ │
│               │  │ iPhone 15 Pro • 3 days ago                  │ │
│               │  │ ───────────────────────────────────────────  │ │
│               │  │ Dashboard login from new location           │ │
│               │  │ [View Details]                              │ │
│               │  └──────────────────────────────────────────────┘ │
│               │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

### 4. AI Image Analysis
```
┌────────────────────────────────────────────────────────────────────┐
│  ☰ Device Tracker                               👤 John  🔔 3  ⚙️  │
├───────────────┬────────────────────────────────────────────────────┤
│               │  🤖 AI Image Analysis                             │
│  Dashboard    │                                                    │
│  🗺️ Device Map│  ┌──────────────────────────────────────────────┐ │
│  ⚠️ Alerts    │  │  Drag & Drop Image or Click to Upload       │ │
│  📈 Timeline  │  │                                              │ │
│  🤖 AI        │  │              📤                              │ │
│  ⚙️ Settings  │  │         Upload Image                        │ │
│               │  │                                              │ │
│               │  │  Supported: JPG, PNG, HEIC (Max 10MB)       │ │
│               │  └──────────────────────────────────────────────┘ │
│               │                                                    │
│               │  Analysis Results                                 │
│               │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│               │  ┃  ╔════════╗                                ┃  │
│               │  ┃  ║        ║  🎯 Authenticity Score: 68%    ┃  │
│               │  ┃  ║ IMAGE  ║  Confidence: HIGH              ┃  │
│               │  ┃  ║        ║                                ┃  │
│               │  ┃  ╚════════╝  ━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃  │
│               │  ┃                                            ┃  │
│               │  ┃  🤖 AI Generation: 15% probability         ┃  │
│               │  ┃  ✏️ Editing Detected: 75% probability      ┃  │
│               │  ┃                                            ┃  │
│               │  ┃  ⚠️ Findings:                              ┃  │
│               │  ┃  • Software tag shows Photoshop use       ┃  │
│               │  ┃  • Inconsistent lighting patterns         ┃  │
│               │  ┃  • GPS/timestamp mismatch                 ┃  │
│               │  ┃                                            ┃  │
│               │  ┃  [View Detailed Report] [Export PDF]      ┃  │
│               │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│               │                                                    │
│               │  Recent Analyses                                  │
│               │  ┌──────────────────────────────────────────────┐ │
│               │  │ IMG_2024.jpg • 68% authentic • 2 hours ago  │ │
│               │  │ photo.png    • 92% authentic • Yesterday    │ │
│               │  │ suspect.jpg  • 34% authentic • 3 days ago   │ │
│               │  └──────────────────────────────────────────────┘ │
│               │                                                    │
└───────────────┴────────────────────────────────────────────────────┘
```

## 🎨 Design System

### Colors
- **Primary**: #2196F3 (Blue)
- **Secondary**: #F50057 (Pink)
- **Success**: #4CAF50 (Green)
- **Warning**: #FF9800 (Orange)
- **Error**: #F44336 (Red)
- **Background Dark**: #0A0E1A
- **Background Paper**: #1A1F2E

### Typography
- **Headings**: Inter Bold
- **Body**: Inter Regular
- **Monospace**: Roboto Mono

### Spacing
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px

---

**Wireframes Version**: 1.0  
**Last Updated**: February 2026
