# 🚗 E-Mobility Driver App

A comprehensive SAP CAP-based application for e-mobility charging station management, built with TypeScript, Vue.js, and modern development tools.

## 📋 Project Overview

This is a full-stack e-mobility application that enables drivers to:

- 🔑 Manage badges for charging station access
- ⚡ Start and stop charging sessions
- 📊 View charging statistics and history
- 🗺️ Find available charging stations
- 💳 Track charging costs and consumption

## 🏗️ Architecture

```text
driver-app/
├── 📱 app/driver-vue/         # Vue.js Frontend (UI5 Web Components)
├── 🔧 cli/                   # Development CLI Tools
├── 🎛️ srv/                   # CAP Backend Services & Business Logic
├── 📦 gen/                   # Generated Deployment Artifacts
│   ├── srv/                  # Generated CAP Server
│   └── policies/             # AMS Security Policies
└── 📄 mta.yaml              # Multi-Target Application Descriptor
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 20
- **npm** >= 8
- **SAP CDS CLI**

### 1. One-Command Installation

```bash
# Clone the repository
git clone <repository-url>
cd driver-app

# Install all dependencies across all modules
npm run install:all
```

The install command will:

- ✅ Check prerequisites (Node.js >= 20, npm >= 8)
- ✅ Install root project dependencies
- ✅ Install CLI tool dependencies
- ✅ Install frontend Vue.js app dependencies
- ✅ Install SAP CDS CLI globally (if not already installed)

> **Note**: Generated service dependencies (`gen/srv`, `gen/policies`) are not installed automatically. These are created during build processes (`cds build`, `npm run build:ams`) and should be installed separately if needed.

### 2. Development Workflow

#### Option A: One-Command Start (Recommended)

```bash
cd cli
npm run cli bootstrap  # Configures environment + starts both servers
```

#### Option B: Step-by-Step Setup

```bash
# 1. Configure development environment
cd cli
npm run cli config     # Setup profiles and service bindings

# 2. Start development servers
npm run cli start      # Starts both backend + frontend
```

#### Option C: Backend Only (for debugging)

```bash
cd cli
npm run cli backend --debug  # Backend with debugging enabled
```

> **Note**: If you haven't run the install script yet, use `npm run install:all` from the root directory to install all dependencies first.

## 📚 Module Documentation

| Module | Description | Documentation |
| --- | --- | --- |
| 🎛️ **[Backend Services](./srv/README.md)** | CAP services, authentication, business logic | [srv/README.md](./srv/README.md) |
| 📱 **[Frontend App](./app/driver-vue/README.md)** | Vue.js SPA with UI5 Web Components | [app/driver-vue/README.md](./app/driver-vue/README.md) |
| 🔧 **[CLI Tools](./cli/README.md)** | Development automation and environment management | [cli/README.md](./cli/README.md) |

## 🛠️ Development

### Available Scripts

```bash
# Installation scripts
npm run install:all      # Install all dependencies (CLI-based)

# Root project scripts
npm run dev              # Start CAP server (hybrid profile)
npm run build:ams        # Build AMS policies
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run format           # Format code with Prettier

# CLI-based development (recommended)
cd cli
npm run cli install      # Install all dependencies via CLI
npm run cli config       # Configure environment
npm run cli start        # Start both servers
npm run cli backend      # Backend only
npm run cli profiles     # List configured profiles
npm run cli build        # Build MTA archive
npm run cli deploy       # Deploy to Cloud Foundry
```

### 🐛 Debugging

#### Backend Debugging

**VS Code**: Use `F5` → "CLI - Start Servers (hybrid)" for full stack debugging  
**IntelliJ**: Run → "CLI - Backend Only (Debug)"

> **Note**: VS Code launch configurations are available in `.vscode/launch.json`. You can create additional configurations for backend-only debugging if needed.

You can also run the backend in debug mode directly from the CLI:

```bash
cd cli
npm run cli backend --debug    # Debug mode on port 9229
npm run cli start --debug      # Both servers with backend debugging
```

### 🔧 Configuration Profiles

The CLI supports multiple environment profiles:

```bash
npm run cli config          # Create/update profiles
npm run cli start --profile production
```

Profiles are stored in `.cdsrc-private.json` and include:

- Service bindings (Cloud Foundry)
- Authentication configurations
- Environment-specific settings

## 🚀 Build & Deploy

### Using CLI Commands (Recommended)

```bash
# Build MTA archive
cd cli && npm run cli build

# Deploy to Cloud Foundry
cd cli && npm run cli deploy
```

### Manual Commands

```bash
# Build MTA archive
mbt build

# Deploy to Cloud Foundry
cf login -a <API_ENDPOINT> -o <ORG> -s <SPACE>
cf deploy mta_archives/driver-app_1.0.0.mtar
```

The CLI commands provide:

- **Prerequisites checking** (MBT and CF CLI availability)
- **Interactive deployment** (archive selection, confirmation prompts)
- **Error handling** with helpful troubleshooting tips
- **Status feedback** throughout the process

## 🔐 Security & Authentication

- **Production**: SAP IAS (Identity Authentication Service)
- **Development**: Custom mock authentication via CLI profiles
- **Authorization**: Role-based access control with badges
- **AMS Integration**: Authorization Management Service for policies

### AMS Policies

This project integrates SAP Authorization Management Service (AMS) for policy-based authorization. At the moment, a single policy named "Driver" is used. You can extend the policy set to fit your needs.

Current default policy:

```dcl
POLICY "Driver" {
  ASSIGN ROLE "Driver";
}
```

Assigning roles to users (IAS):

- Policies are deployed to AMS and linked to the IAS tenant used for authentication.
- In the IAS admin console, you can assign the "Driver" policy to users or groups.

### QR Code

The application includes a secure QR code system for quick charging station access:

- **🔒 Security First**: QR codes are encrypted using AES-256-GCM encryption
- **📱 Mobile Resolution**: The app securely decrypts and resolves QR codes to start charging sessions
- **🏭 CLI Generation**: Generate QR codes via `cd cli && npm run cli generate-qr`
- **📄 PDF Output**: PDF documents ready for printing and distribution
- **🔐 Encryption Key**: user-provided credential key configured in production (cli commands available for setup and synchronization)

#### Configuration

**Production**: The `driver-app-qr-config` user-provided service is automatically created during deployment, but the encryption key must be manually synchronized using CLI commands:

```bash
cd cli
npm run cli -- generate-qr --setup-key        # Generate and configure initial key
npm run cli -- generate-qr --sync-key-to-cf   # Push local key to CF service  
npm run cli -- generate-qr --sync-key-from-cf # Pull key from CF service
npm run cli -- generate-qr --show-key-status  # Check synchronization status
```

**Development**: Add encryption key to your local configuration (or use CLI commands to set it up):

```json
// .cdsrc-private.json
{
  "qr-encryption": {
    "QR_ENCRYPTION_KEY": "your-64-character-hex-key"
  }
}
```

**Usage Example:**

```bash
cd cli
npm run cli start                       # Start backend server
npm run cli -- generate-qr --interactive  # Generate QR codes with prompts
```

**Troubleshooting**: If you see `🚨 QR_ENCRYPTION_KEY not configured!`, use the CLI commands above to create and synchronize your encryption key.

## 🧪 Testing

```bash
# Frontend tests
cd app/driver-vue
npm run test              # Run unit tests
npm run test:coverage     # Run with coverage

# Backend tests
npm test                  # Run backend tests
```

## 📖 Technology Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | Vue.js 3 + TypeScript | Reactive user interface |
| **UI Components** | SAP UI5 Web Components | Enterprise-grade UI components |
| **Backend** | SAP CAP + TypeScript | Business logic and OData services |
| **Authentication** | SAP IAS | Identity management |
| **Authorization** | SAP AMS | Policy-based access control |

## 🔄 Development Workflow

1. **Setup**: `npm run install:all` (installs all dependencies)
2. **Configure**: `cd cli && npm run cli config` (environment setup)
3. **Start**: `cd cli && npm run cli start` (start servers)
4. **Code**: Edit backend services in `srv/` or frontend in `app/driver-vue/src/`
5. **Test**: Automatic hot-reload for both frontend and backend
6. **Debug**: Use IDE or `npm run cli backend --debug` for backend debugging
7. **Build**: `cd cli && npm run cli build` (create MTA archive)
8. **Deploy**: `cd cli && npm run cli deploy` (deploy to Cloud Foundry)

## 📞 Support & Contributing

- **CLI Help**: `cd cli && npm run cli --help`
- **CAP Documentation**: [SAP CAP Documentation](https://cap.cloud.sap/docs/)
- **Vue.js Guide**: [Vue.js 3 Documentation](https://vuejs.org/)
- **UI5 Web Components**: [UI5 Web Components](https://sap.github.io/ui5-webcomponents/)

## 📄 License

Copyright (c) 2026 SAP SE or an SAP affiliate company. All rights reserved. This project is licensed under the Apache Software License, version 2.0 except as noted otherwise in the [LICENSE](LICENSE) file.
