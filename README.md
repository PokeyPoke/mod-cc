# Modular Dashboard

A customizable, widget-based dashboard platform built with Node.js and vanilla JavaScript. Create, arrange, and personalize modules to display various data across web, mobile, and IoT devices.

## Features

- **Modular Widget System**: Weather, Notes, Todo, Countdown, Links, and Custom HTML modules
- **Drag & Drop Layout**: Powered by GridStack.js for intuitive module arrangement
- **Multi-Device Support**: Responsive design with separate layouts for web, mobile, and IoT
- **Theme System**: Light, Dark, Blue, and Green themes with CSS custom properties
- **API-First Architecture**: RESTful API with JWT authentication
- **Free & Premium Tiers**: Free (5 modules, 1hr refresh) and Premium ($1/month, unlimited modules, 15min refresh)
- **IoT Integration**: Device API keys for ESP32 and similar devices
- **Secure API Key Management**: Encrypted storage of third-party service API keys

## Tech Stack

### Backend
- **Node.js** with Express.js
- **SQLite** with better-sqlite3
- **JWT** authentication with bcrypt
- **Rate limiting** and security middleware

### Frontend
- **Vanilla JavaScript** (ES6+)
- **GridStack.js** for layout management
- **CSS Custom Properties** for theming
- **Font Awesome** for icons
- **Responsive design** with mobile-first approach

## Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd mod-cc
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database:**
   ```bash
   npm run migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Open browser:**
   Navigate to `http://localhost:3000`

### Heroku Deployment

1. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-jwt-secret-here
   heroku config:set ENCRYPTION_KEY=your-32-character-encryption-key
   ```

3. **Deploy:**
   ```bash
   git push heroku main
   ```

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Modules
- `GET /api/v1/modules/list` - Get user modules
- `POST /api/v1/modules/create` - Create new module
- `GET /api/v1/modules/:id/data` - Get module data
- `PUT /api/v1/modules/:id/config` - Update module config
- `DELETE /api/v1/modules/:id` - Delete module

### Devices & Layouts
- `POST /api/v1/devices/register` - Register device
- `GET /api/v1/layouts/:deviceType` - Get device layout
- `PUT /api/v1/layouts/:deviceType` - Save device layout

### Settings
- `GET /api/v1/settings` - Get user settings
- `PUT /api/v1/settings` - Update settings
- `GET /api/v1/settings/api-keys` - Get API keys
- `POST /api/v1/settings/api-keys` - Add API key

## Module Types

### Weather Module
- Displays current weather conditions
- Requires OpenWeatherMap API key (optional, uses demo data otherwise)
- Configurable location

### Notes Module
- Quick notes and reminders
- Add/delete functionality
- Limit: 10 notes (free) / 50 notes (premium)

### Todo Module
- Task management with completion tracking
- Statistics display
- Limit: 20 todos (free) / 100 todos (premium)

### Countdown Module
- Count down to specific events
- Real-time updates
- Customizable title and expired message

### Links Module
- Quick access to favorite websites
- Smart icon detection for popular sites
- Limit: 10 links (free) / 50 links (premium)

### Custom HTML Module
- Custom HTML and CSS content
- XSS protection with content sanitization
- Preview functionality

## IoT Device Integration

### ESP32 Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* deviceKey = "your-device-api-key";
const char* apiUrl = "https://your-app.herokuapp.com/api/v1/modules/1/data";

void fetchModuleData() {
  HTTPClient http;
  http.begin(apiUrl);
  http.addHeader("X-Device-Key", deviceKey);
  
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    // Parse JSON and display on screen
  }
  http.end();
}
```

## Security Features

- **JWT Authentication** with refresh tokens
- **Rate limiting** on all endpoints
- **Input sanitization** and validation
- **Encrypted API key storage**
- **CORS protection**
- **Helmet.js** security headers
- **XSS protection** in custom HTML modules

## Database Schema

### Users
- Authentication and subscription management
- Supports free and premium tiers

### Modules
- User-specific module configurations
- JSON config storage for flexibility

### Devices
- Multi-device support with API keys
- Separate layouts per device type

### Settings & API Keys
- User preferences and theme settings
- Encrypted third-party API key storage

## Environment Variables

```bash
PORT=3000
NODE_ENV=development
JWT_SECRET=your-jwt-secret-here
DATABASE_URL=./database.sqlite
ENCRYPTION_KEY=your-32-character-encryption-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.