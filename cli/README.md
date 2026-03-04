# E-Mobility Driver App CLI

Essential development commands with intuitive naming and extensible framework built with TypeScript, Commander, Inquirer, and Chalk.

## 🚀 Installation

```bash
cd cli
npm install
npm run build
```

## 💡 CLI Usage Syntax

When using CLI commands with options, you need to use the `--` separator to pass arguments correctly through npm:

```bash
# ✅ Correct syntax for commands with options
npm run cli -- <command> <options>

# ✅ Examples
npm run cli -- generate-qr --interactive
npm run cli -- generate-qr --show-key-status
npm run cli -- generate-qr --setup-key

# ✅ Commands without options work normally
npm run cli install
npm run cli config
npm run cli start
```

**Why the `--` is needed:**

- The `--` tells npm to pass all following arguments directly to the CLI script
- Without `--`, npm tries to interpret the options itself instead of passing them to the CLI
- This is standard npm behavior for passing arguments to scripts

## 📋 Commands

### `install` - Install All Project Dependencies

The primary method for installing dependencies across all project modules with comprehensive checks and validation.

```bash
npm run cli install
```

**What it does:**

- **Prerequisites Check**: Validates Node.js >= 20 and npm >= 8
- **Root Dependencies**: Installs main project dependencies
- **CLI Dependencies**: Installs CLI tool dependencies
- **Frontend Dependencies**: Installs Vue.js app dependencies
- **CDS CLI Check**: Ensures SAP CDS CLI is available globally
- **Cross-Platform**: Works on Windows, macOS, and Linux

> **Note**: Generated dependencies (`gen/srv`, `gen/policies`) are not installed as they are created during build processes.

**Features:**

- Colored output with progress feedback
- Error handling and validation
- Skips missing directories gracefully
- Shows clear next steps after installation
- Uses consistent CLI logging framework

**Example output:**

```console
🚀 Installing E-Mobility Driver App Dependencies...
🔍 Checking prerequisites...
✅ Prerequisites check passed
📦 Installing root project dependencies...
✅ Root project dependencies installed
📦 Installing CLI dependencies...
✅ CLI dependencies installed
🎉 All dependencies installed successfully!
```

### `build` - Build MTA Archive

Build Multi-Target Application archive for deployment using MBT CLI.

```bash
npm run cli build
```

**What it does:**

- **Prerequisites Check**: Validates MBT CLI is available
- **Project Validation**: Checks for mta.yaml in project root
- **MTA Build**: Runs `mbt build` to create deployment archive
- **Archive Detection**: Lists generated .mtar files
- **Next Steps**: Provides deployment guidance

**Features:**

- Automatic project root detection
- Prerequisites validation with installation guidance
- Progress feedback during build process
- Build artifact location and next step suggestions
- Error handling with troubleshooting tips

**Example output:**

```console
🏗️ Building E-Mobility Driver App MTA Archive...
🔍 Checking MBT CLI...
✅ MBT CLI is available
✅ mta.yaml found
🔨 Building MTA archive...
✅ MTA archive built successfully!
📦 Generated archive(s):
   • driver-app_1.0.0.mtar
💡 Next steps:
   - Deploy with: npm run cli deploy
```

### `deploy` - Deploy to Cloud Foundry

Deploy MTA archive to Cloud Foundry with interactive prompts and validation.

```bash
npm run cli deploy
```

**What it does:**

- **Prerequisites Check**: Validates Cloud Foundry CLI is available
- **Login Verification**: Checks CF login status and target
- **Archive Selection**: Interactive selection if multiple archives exist
- **Deployment Confirmation**: Prompts before deployment
- **CF Deployment**: Runs `cf deploy` with selected archive

**Features:**

- Cloud Foundry CLI validation
- Login status checking with helpful prompts
- Multiple archive support with interactive selection
- Deployment confirmation prompts
- Real-time deployment progress
- Post-deployment guidance

**Example output:**

```console
🚀 Deploying E-Mobility Driver App to Cloud Foundry...
🔍 Checking Cloud Foundry CLI...
✅ Cloud Foundry CLI is available
✅ Logged in to Cloud Foundry
📦 Found archive: driver-app_1.0.0.mtar
? Deploy driver-app_1.0.0.mtar to Cloud Foundry? Yes
🚀 Deploying to Cloud Foundry...
✅ Deployment completed successfully!
```

### `config` - Configure Development Environment

Comprehensive project configuration with profile management.

```bash
npm run cli config
```

**What it does:**

- **Profile Management**: Create, update, or delete development profiles (`[hybrid]`, `[staging]`, `[production]`, etc.)
- **Service Bindings**: Runs `cds bind -2 emobility-api` for Cloud Foundry service bindings
- **Auto-Service Generation**: Automatically creates bindings for **all external services** found in `.cdsrc.json`:
  - `RemoteBadgeService`
  - `ChargingStationService`
  - `ChargingSessionService`
  - Any other OData services you define

- **Authentication Setup**: Configures profile-specific auth-dev variables in `.cdsrc-private.json`
- **Multiple Profiles**: Supports unlimited environment profiles for easy switching

**Features:**

- Interactive profile selection (create/update/delete/list)
- Automatic detection of external services from `.cdsrc.json`
- Preserves existing service bindings and profiles
- Smart profile switching with `--profile` option
- Adds `.cdsrc-private.json` to `.gitignore`

### `profiles` - List Available Profiles

Quick overview of configured development profiles.

```bash
npm run cli profiles
```

Shows all configured profiles in your `.cdsrc-private.json`.

### `start` - Start Development Servers

Starts both backend (CAP) and frontend (Vue.js) development servers with profile support.

```bash
npm run cli start [--profile <name>] [--debug] [--debug-port <port>]
```

**Options:**

- `--profile <name>`: Profile to use for the CAP server (default: hybrid)
- `--debug`: Enable debug mode for backend server
- `--debug-port <port>`: Debug port for backend server (default: 9229)

**What it runs:**

- Backend: `cds watch` (CAP server with hot reload and profile support)
- Frontend: `npm run dev` in `app/driver-vue` (Vite dev server)

**Examples:**

```bash
# Start with default profile (hybrid)
npm run cli start

# Start with specific profile
npm run cli start --profile production

# Start with backend debugging enabled
npm run cli start --debug

# Start with custom debug port
npm run cli start --debug --debug-port 9230
```

### `backend` - Start Backend Server Only

Starts only the CAP backend server (useful for debugging backend code).

```bash
npm run cli backend [--profile <name>] [--debug] [--debug-port <port>]
```

**Features:**

- Excludes frontend files from watch (no restarts when Vue builds)
- Clean backend-only output
- Perfect for debugging backend code with breakpoints
- Uses same profile system as start command

**Examples:**

```bash
# Backend only
npm run cli backend

# Backend with debugging
npm run cli backend --debug

# Backend with custom debug port
npm run cli backend --debug --debug-port 9230
```

### `bootstrap` - Complete Setup + Start

One-command solution: configure environment and start development servers.

```bash
npm run cli bootstrap
```

Perfect for first-time setup or clean environments.

### `generate-qr` - Generate QR Codes for EVSE Charging Stations

Generate professional PDF documents with QR codes for EVSE charging stations to enable quick customer access.

```bash
npm run cli generate-qr [options]
```

**What it does:**

- **CDS Connection**: Connects to the CAP server (port 4004) to fetch EVSE data
- **EVSE Data Retrieval**: Fetches charging stations with connector information
- **QR Code Generation**: Creates QR codes that trigger charging session start actions
- **PDF Creation**: Generates professional PDF documents in multiple formats
- **Filtering Support**: Filter by site area, EVSE name, or custom criteria
- **Interactive Mode**: Optional prompts for user-friendly configuration

**Options:**

- `--output <path>`: Output directory for PDF files (default: `./qr-codes`)
- `--site-area <name>`: Filter by specific site area
- `--filter <criteria>`: Filter EVSEs by name or code
- `--format <format>`: PDF format - A4, Letter, or Sticker (default: A4)
- `--title <title>`: Custom title for PDF (default: "E-Mobility Quick Start")
- `--interactive`: Interactive mode with prompts

**PDF Formats:**

- **A4**: Full-page format with detailed information (one EVSE per page)
- **Letter**: Full-page US format with detailed information (one EVSE per page)
- **Sticker**: Compact 5×7cm stickers, 16 per A4 page - perfect for printing and attaching to charging stations

**QR Code Styles:**

- Multiple professional presets available (standard, SAP blue, gradients, etc.)
- Customizable with optional logo support
- Use `--interactive` mode to see all available styles

**Features:**

- Professional PDF layout with branding
- One QR code per page for easy printing and distribution
- Automatic file naming with timestamps
- Connection validation and error handling
- Progress feedback and generation summary
- Support for multiple PDF formats
- Batch processing of multiple EVSEs

**Examples:**

```bash
# Generate QR codes for all EVSEs (default A4 format)
npm run cli -- generate-qr

# Interactive mode with prompts (choose format from menu)
npm run cli -- generate-qr --interactive

# Generate compact stickers (20 per page)
npm run cli -- generate-qr --format sticker

# Filter by site area with sticker format
npm run cli -- generate-qr --site-area "Main Campus" --format sticker

# Custom output and format
npm run cli -- generate-qr --output ./my-qr-codes --format Letter

# Custom title and filter
npm run cli -- generate-qr --title "Quick Charge Access" --filter "Station-A"
```

**Example output (A4/Letter format):**

```console
🔌 Starting QR Code Generation for EVSE Charging Stations...
🔍 Connecting to CDS server on port: 4004
✅ Connected to CDS services
📡 Fetching EVSE data...
📊 Found 5 EVSEs (5 QR codes will be generated)

📋 Preview of EVSEs to be processed:
   1. Station-A-001 (Main Campus) - 2 connector(s)
   2. Station-B-002 (Parking Lot) - 3 connector(s)
   3. Station-C-003 (Building East) - 1 connector(s)
   ... and 2 more EVSEs

🎨 Generating professional PDF with encrypted QR codes...
✅ PDF generated successfully!
📄 File: ./qr-codes/evse-qr-codes-2025-11-13.pdf
📏 Size: 245 KB
📊 Pages: 5 (one QR code per EVSE)

📈 Generation Summary:
   • EVSEs processed: 5
   • QR codes generated: 5 (one per EVSE)
   • PDF format: A4

🎯 Next Steps:
   1. Review the generated PDF: ./qr-codes/evse-qr-codes-2025-11-13.pdf
   2. Print the PDF for customer distribution
   3. Customers can scan QR codes with your E-Mobility app
   4. QR codes will trigger the startChargingSession action
```

**Example output (Sticker format):**

```console
🔌 Starting QR Code Generation for EVSE Charging Stations...
🔍 Connecting to CDS server on port: 4004
✅ Connected to CDS services
📡 Fetching EVSE data...
📊 Found 15 EVSEs (15 QR codes will be generated)

🎨 Generating professional PDF with encrypted QR codes...
✅ PDF generated successfully!
📄 File: ./qr-codes/evse-qr-stickers-2025-11-13.pdf
📏 Size: 180 KB
📊 Pages: 15 (one QR code per EVSE)

📈 Generation Summary:
   • EVSEs processed: 15
   • QR codes generated: 15 (one per EVSE)
   • PDF format: Sticker
   • Stickers per page: 16 (5×7cm each)
   • Total pages: 1

🎯 Next Steps:
   1. Review the generated PDF: ./qr-codes/evse-qr-stickers-2025-11-13.pdf
   2. Print the PDF for customer distribution
   3. Customers can scan QR codes with your E-Mobility app
   4. QR codes will trigger the startChargingSession action
```

**Prerequisites:**

- CDS server must be running on port 4004
- Start the server with: `npm run cli start` or `npm run cli backend`
- EVSE data must be available in the system
- QR encryption key must be configured (see Configuration section below)

#### QR Encryption Key Configuration

**Production**: The `driver-app-qr-config` user-provided service is automatically created during deployment, but the encryption key must be manually synchronized using CLI commands:

```bash
npm run cli -- generate-qr --setup-key        # Generate and configure initial key
npm run cli -- generate-qr --sync-key-to-cf   # Push local key to CF service  
npm run cli -- generate-qr --sync-key-from-cf # Pull key from CF service
npm run cli -- generate-qr --show-key-status  # Check synchronization status
```

**Development**: Add the encryption key to your local configuration:

```json
// .cdsrc-private.json
{
  "qr-encryption": {
    "QR_ENCRYPTION_KEY": "your-64-character-hex-key"
  }
}
```

**Generate a key** (recommended):

```bash
cd cli
npm run cli -- generate-qr --setup-key  # Generates key AND configures it automatically
```

**Manual generation** (if needed):

```bash
# Generate a random 256-bit key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Troubleshooting**: If QR generation fails with `🚨 QR_ENCRYPTION_KEY not configured!`, use the CLI commands above to create and synchronize your encryption key.

**Use Cases:**

- **Customer Self-Service**: Print QR codes for physical placement at charging stations
- **Maintenance**: Generate updated QR codes when station configurations change
- **Secure Distribution**: QR codes can be shared publicly without exposing internal system details
- **Compact Stickers**: Use the Sticker format for space-efficient labels that can be easily attached to charging stations

**Sticker Format Details:**

The Sticker format generates compact 5×7cm labels perfect for attaching to charging stations:

- **Size**: 5cm × 7cm rectangle
- **Layout**: 16 stickers per A4 page (4 columns × 4 rows)
- **Content**: QR code + EVSE Code + Name
- **Border**: Dashed cutting guides for easy separation
- **File naming**: `evse-qr-stickers-YYYY-MM-DD.pdf`

## 🎯 Complete Workflow

```bash
# Option 1: One command does everything (development)
npm run cli bootstrap

# Option 2: Step by step (development)
npm run cli install    # Install all dependencies first
npm run cli config     # Configure profiles and services
npm run cli start      # Start development servers

# Option 3: With specific profile
npm run cli install    # Install dependencies
npm run cli config     # Setup profiles
npm run cli start --profile staging

# Option 4: Quick setup for new environment
npm run cli install    # Install all dependencies
npm run cli bootstrap  # Configure and start everything

# Option 5: Full development to deployment cycle
npm run cli install    # Install dependencies
npm run cli config     # Configure environment
npm run cli start      # Develop and test
npm run cli build      # Build for deployment
npm run cli deploy     # Deploy to Cloud Foundry

# Option 6: Generate QR codes for charging stations
npm run cli start      # Start backend server
npm run cli -- generate-qr --interactive  # Generate QR codes with prompts
```

## 🔧 Profile Management

The CLI supports multiple development profiles, allowing you to easily switch between different configurations:

### Profile Structure

Each profile contains:

- Service bindings for external APIs
- Authentication configurations
- Environment-specific settings

### Example Usage

```bash
# Create/update a profile
npm run cli config
> Create/Update profile
> Enter profile name: staging

# Start with specific profile
npm run cli start --profile staging
```

### Profile Configuration

Profiles are stored in `.cdsrc-private.json`:

```json
{
  "requires": {
    "[hybrid]": {
      "RemoteBadgeService": { /* binding config */ },
      "ChargingStationService": { /* binding config */ },
      "ChargingSessionService": { /* binding config */ },
      "custom-service:emobility-api": { /* binding config */ }
    },
    "[staging]": {
      /* different configuration */
    }
  },
  "auth-dev": {
    "[hybrid]": {
      "email": "your.email@example.com",
      "name": "Your Name",
      "roles": "admin,user,badgeRead,chargePointRead,chargingSessionRead"
    },
    "[staging]": {
      /* different auth config */
    }
  }
}
```

Main authentication handler in `.cdsrc.json`:

```json
{
  "requires": {
    "auth": {
      "[hybrid]": {
        "impl": "srv/auth/dev-auth.ts"
      }
    }
  }
}
```

## 🔧 Extensible Framework

Easy command scripting addition with our mini-framework:

```typescript
// 1. Create your command
export const myCommand: BaseCommand = {
  name: 'my-command',
  description: 'Does something useful',
  action: async (options) => {
    // Access command options
    console.log(options.myFlag);
  },
  options: [
    { flags: '--my-flag <value>', description: 'Optional flag' }
  ]
};

// 2. Register in index.ts
commandRegistry.register(myCommand);
```

## 🛠 Development

```bash
# Development mode (runs TypeScript directly)
npm run cli <command>

# Development with auto-restart on file changes
npm run dev <command>

# Build for production
npm run build

# Watch mode (auto-recompile on changes)
npm run build:watch

# Run built CLI
npm start <command>
```

## 🐛 Backend Debugging

The CLI provides excellent debugging support for the CAP backend server:

### Command Line Debugging

```bash
# Backend only with debugging
npm run cli backend --debug
🐛 Debug mode enabled on port 9229
   Attach your IDE debugger to localhost:9229

# Both servers with backend debugging  
npm run cli start --debug
🚀 Starting development servers...
🐛 Backend debug mode enabled on port 9229
   Attach your IDE debugger to localhost:9229
```

### IDE Setup

**VS Code:**

- Available launch configurations:
  - **CLI - Start Servers (hybrid)**: Start both servers with hybrid profile
  - **CLI - Start Servers (production)**: Start both servers with production profile
  - **CLI - Config env**: Run configuration command
- For debugging: Start backend with `--debug` flag, then use **Debug → Attach to Node Process → localhost:9229**

**IntelliJ IDEA:**

- Available run configurations:
  - **CLI - Start Servers (hybrid)**: Start both servers with hybrid profile
  - **CLI - Start Servers (hybrid-unknown-user)**: Start with specific user profile
  - **CLI - Config env**: Run configuration command
- For debugging: Start backend with `--debug` flag, then use **Run → Attach to Node.js/Chrome → localhost:9229**

### Output Separation

```bash
[BACKEND] Server is listening on port 4004
[FRONTEND] Local: http://localhost:5173  
[BACKEND-ERR] Database connection failed
[FRONTEND-WARN] Component deprecated
```

### Perfect Debugging Workflow

```bash
# 1. Start backend in debug mode
npm run cli backend --debug --profile hybrid

# 2. Set breakpoints in your CAP service code
# 3. Attach IDE debugger to localhost:9229  
# 4. Make API calls → breakpoints hit!
# 5. No Vue.js interference → clean debugging
```

## 📁 Project Structure

```text
cli/
├── src/
│   ├── framework/          # Mini CLI framework
│   │   └── command-registry.ts
│   ├── commands/           # Command implementations
│   │   ├── config.ts       # Environment configuration
│   │   ├── start.ts        # Development servers
│   │   ├── generate-qr.ts  # QR code generation
│   │   └── ...             # Other commands
│   ├── utils/              # Shared utilities
│   │   ├── logger.ts       # Colored logging utilities
│   │   ├── cds-evse-client.ts  # CDS EVSE data client
│   │   ├── pdf-generator.ts    # PDF generation utilities
│   │   └── qr-generator.ts     # QR code utilities
│   └── index.ts            # CLI entry point
├── qr-codes/               # Generated QR code PDFs
├── dist/                   # Compiled JavaScript (generated)
├── package.json            # CLI dependencies
└── tsconfig.json           # TypeScript configuration
```

## 🎯 Complete Development Workflow

```bash
# First time setup
cd cli && npm install

# Option 1: Everything in one command
npm run cli bootstrap

# Option 2: Step by step with profiles
npm run cli config      # Setup multiple profiles
npm run cli start       # Start with default profile
npm run cli start --profile production  # Start with specific profile
