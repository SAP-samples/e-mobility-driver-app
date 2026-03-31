# 📱 Driver Vue Frontend

A modern Vue.js 3 frontend application for the e-mobility driver app, built with TypeScript, SAP UI5 Web Components, and modern development tools.

## 📋 Overview

The driver-vue frontend provides an intuitive user interface for e-mobility drivers to:

- 🔑 Manage charging badges
- ⚡ Start and stop charging sessions
- 📊 View charging statistics and history
- 🗺️ Find available charging stations
- 💳 Track charging costs and consumption

## 🏗️ Technology Stack

| Technology | Version | Purpose |
| --- | --- | --- |
| **Vue.js** | 3.5.13 | Progressive JavaScript framework |
| **TypeScript** | 5.8.3 | Type-safe development |
| **UI5 Web Components** | 2.12.0 | Enterprise-grade UI components |
| **Vite** | 6.3.5 | Build tool and dev server |
| **Pinia** | 3.0.3 | State management |
| **Vue Router** | 4.5.1 | Client-side routing |
| **Leaflet** | 1.9.4 | Interactive maps |
| **Vitest** | 3.2.4 | Unit testing framework |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20
- npm >= 8

### Installation

```bash
cd app/driver-vue
npm install
```

### Development

```bash
# Development server with hot reload
npm run dev

# Watch mode (build + watch)
npm run watch

# Development build
npm run build:dev
```

### Using CLI (Recommended)

```bash
cd ../../cli
npm run cli config       # Configure development environment
npm run cli start        # Start both backend + frontend
```

## 📁 Project Structure

```text
app/driver-vue/
├── 📄 Configuration
│   ├── package.json              # Dependencies and scripts
│   ├── vite.config.ts            # Vite configuration
│   ├── tsconfig.json             # TypeScript configuration
│   ├── eslint.config.mjs         # ESLint configuration
│   └── vitest.config.ts          # Test configuration
├── 🌐 Public Assets
│   └── public/                   # Static assets
├── 📱 Source Code
│   └── src/
│       ├── components/           # Reusable Vue components
│       ├── pages/               # Page-level components
│       ├── router/              # Vue Router configuration
│       ├── store/               # Pinia state management
│       ├── services/            # API service layer
│       ├── types/               # TypeScript type definitions
│       ├── utils/               # Utility functions
│       ├── assets/              # Images, styles, icons
│       ├── App.vue              # Root component
│       └── main.ts              # Application entry point
├── 🧪 Testing
│   └── test/                    # Unit tests and test utilities
├── 📊 Reports
│   ├── coverage/                # Test coverage reports
│   └── reports/                 # Build and analysis reports
└── 📦 Distribution
    └── dist/                    # Built application (generated)
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server (http://localhost:5173)
npm run watch            # Vite in watch mode
npm run build:dev        # Development build

# Production
npm run build            # Production build
npm run build:cf         # Build + zip for Cloud Foundry
npm run zip              # Create deployment zip
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests
npm run test:coverage    # Run tests with coverage report

# Quality
npm run lint             # Lint code
npm run type-check       # TypeScript type checking
```

## 🎨 UI Components

The application uses **SAP UI5 Web Components 2.12.0** for enterprise-grade UI:

- **Navigation**: `ui5-shell-bar`, `ui5-navigation-layout`
- **Forms**: `ui5-input`, `ui5-button`, `ui5-select`
- **Data Display**: `ui5-table`, `ui5-card`, `ui5-list`
- **Feedback**: `ui5-message-strip`, `ui5-dialog`, `ui5-toast`
- **Layout**: `ui5-panel`, `ui5-page`, `ui5-bar`

**Icon Libraries**: UI5 Icons, Business Suite Icons, TNT Icons  
**Theming**: SAP Horizon design system with responsive, mobile-first approach

## 🗺️ Map Integration

**Leaflet 1.9.4** with marker clustering for performance:

```typescript
// Real Map.vue implementation
interface MapPoint {
  lat: number;
  lng: number;
  [key: string]: unknown;
}

// Features: clustering, popups, auto-fit bounds, mobile controls
```

## 📊 State Management

**Pinia 3.0.3** with Composition API stores:

```typescript
// User authentication store
export const useUserStore = defineStore('user', () => {
  const firstName = ref('');
  const isAuthenticated = ref(false);
  
  async function fetchUser() { /* ... */ }
  async function login() { /* ... */ }
  
  return { firstName, isAuthenticated, fetchUser, login };
});

// OData-powered stores with sophisticated querying
export const useBadgesStore = defineStore('badges', () => {
  const api = new BadgeApi(BASE_URL);
  const badgeCollection = useODataCollection(api);
  
  async function loadBadges(query?: BadgeQuery) {
    return await badgeCollection.load(query || BadgePresets.defaultSorted());
  }
  
  return { badgeCollection, loadBadges, /* ... */ };
});
```

## 🌐 API Integration

**OData-first architecture** with type-safe querying:

```typescript
// BaseApi + BaseQuery pattern
export class BadgeApi extends BaseApi<Badge, BadgeQuery> {
  getEntityName() { return 'Badges'; }
  getExpandFields() { return ['user']; }
}

// Type-safe OData filtering
const query = new BadgeQuery()
  .filter({ status: 'Active' })
  .orderBy('visualBadgeId', 'asc')
  .page(1, 50);

// Authentication with session management
const response = await useAuthFetch('/odata/v4/badge/Badges');
```

## 🧪 Testing

**Vitest 3.2.4** with Vue Testing Library:

```typescript
// Component testing with Pinia
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

const wrapper = mount(BadgeItem, {
  global: {
    plugins: [createTestingPinia({ createSpy: vi.fn })]
  }
});
```

## 📱 Progressive Web App

**Real PWA features implemented**:

- ✅ **App Installation**: Add to home screen
- ✅ **Offline Caching**: Workbox with smart caching strategies  
- ✅ **App Screenshots**: Mobile/desktop screenshots for app stores
- ✅ **Manifest**: Your company's branding

```typescript
// PWA config in vite.config.ts
VitePWA({
  manifest: {
    name: 'My Company Driver',
    short_name: 'EV Driver',
    theme_color: '#ffffff'
  },
  workbox: {
    runtimeCaching: [/* smart caching strategies */]
  }
})
```

## 🔐 Authentication

**Session-based authentication** with hash routing:

```typescript
// Router with auth guards
router.beforeEach(async () => {
  const userStore = useUserStore();
  await userStore.fetchUser();
  if (!userStore.isAuthenticated) {
    userStore.login();
    return false;
  }
});

// Authenticated fetch with session handling
export default async function useAuthFetch(url: string) {
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 401) {
    throw new Error('Session expired');
  }
  return response;
}
```

## 🎨 Styling

**CSS Custom Properties** with SAP Horizon theming:

```scss
:root {
  --primary-color: #0070f3;
  --background-color: #f5f5f5;
}

.component {
  background: var(--background-color);
  box-shadow: var(--ui5-card-shadow);
}
```

## 🚀 Build & Deployment

```bash
# Development with source maps
npm run build:dev

# Production optimized
npm run build

# Cloud Foundry deployment
npm run build:cf  # Creates dist/driver-vue.zip
```

## 🔧 Configuration

### Environment Variables

```bash
VITE_BACKEND_URL=/     # Development
VITE_BACKEND_URL=./    # Production
```

### TypeScript Path Mapping

Path aliases are configured in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],        // Import from src/ using @/
      "@test/*": ["test/*"]    // Import test utilities using @test/
    }
  }
}
```

**Usage Examples**:

```typescript
import { useUserStore } from '@/store/userStore';
import { mockResponse } from '@test/support/mockResponse';
```

### Vite Configuration Highlights

```typescript
// vite.config.ts
isCustomElement: (tag) => tag.startsWith('ui5-')
```

## 📚 Key Dependencies

**Runtime**: `@ui5/webcomponents`, `vue`, `pinia`, `vue-router`, `leaflet`, `odata-query`  
**Development**: `@vitejs/plugin-vue`, `vitest`, `@testing-library/vue`, `typescript`

## 🔗 Related Documentation

- [Backend Services Documentation](../../srv/README.md)
- [CLI Tools Documentation](../../cli/README.md)
- [Root Project Documentation](../../README.md)
- [Vue.js 3 Guide](https://vuejs.org/)
- [UI5 Web Components](https://sap.github.io/ui5-webcomponents/)
