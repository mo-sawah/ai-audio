# AI Audio WordPress Plugin

A professional Text-to-Speech plugin that converts your article content into high-quality audio using Google TTS and ChatGPT APIs.

## Features

### 🎵 **Professional Audio Player**

- Clean, modern design that matches your website
- Compact player that sits elegantly above your articles
- Play/pause, skip forward/backward (10s), volume control
- Playback speed control (0.5x to 2x)
- Progress bar with click-to-seek functionality
- Dark and light mode support
- Fully responsive design

### 🤖 **Dual AI Integration**

- **Google Text-to-Speech**: Premium neural voices with natural intonation
- **ChatGPT TTS**: OpenAI's latest text-to-speech technology
- Multiple voice options for each service
- Automatic fallback between services

### ⚙️ **Flexible Settings**

- **Global Settings**: Configure default behavior for all posts
- **Per-Post Overrides**: Customize AI service, voice, and theme per article
- **Always Enable**: Automatically add audio to all new posts
- **Custom Colors**: Match your brand with full color customization
- **Theme Options**: Light/dark mode with automatic detection

### 🎨 **Customization Options**

- Custom primary colors for buttons and progress bars
- Adjustable text and background colors
- Custom player text ("Listen to Article" by default)
- Full CSS customization support
- Multiple pre-designed themes

## Installation

### Method 1: Upload Plugin Files

1. Download all plugin files
2. Create a folder named `ai-audio` in your `/wp-content/plugins/` directory
3. Upload all files to this folder
4. The structure should look like:
   ```
   /wp-content/plugins/ai-audio/
   ├── ai-audio.php (main plugin file)
   ├── assets/
   │   ├── player.css
   │   ├── player.js
   │   ├── admin.css
   │   └── admin.js
   └── README.md
   ```
5. Go to WordPress Admin → Plugins → Installed Plugins
6. Find "AI Audio" and click "Activate"

### Method 2: ZIP Installation

1. Create a ZIP file containing all plugin files
2. Go to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin"
4. Choose your ZIP file and click "Install Now"
5. Activate the plugin

## Setup Guide

### 1. Get Your API Keys

#### Google Text-to-Speech API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the "Cloud Text-to-Speech API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

#### ChatGPT API (OpenAI)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Click "Create new secret key"
5. Copy your API key

### 2. Configure Plugin Settings

1. Go to WordPress Admin → Settings → AI Audio
2. **API Settings Tab:**

   - Enter your Google TTS API key
   - Enter your ChatGPT API key
   - Test connections using the "Test" buttons

3. \*\*General Tab
