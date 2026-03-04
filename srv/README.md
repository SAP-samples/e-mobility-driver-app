# 🎛️ Backend Services (`srv/`)

SAP CAP-based backend services providing the core business logic and API endpoints for the e-mobility driver application, built with TypeScript and integrated with external e-mobility services.

## 📋 Overview

The `srv/` directory contains the backend implementation including:

- **CAP Services**: Business logic and OData endpoints
- **Authentication**: Custom development authentication and authorization
- **External Integrations**: Connection to charging stations, sessions, and badge services
- **Utilities**: Shared business logic, validation, and filtering utilities

## 🏗️ Architecture

```text
srv/
├── 📋 Service Definitions (CDS)
│   ├── badge-service.cds         # Badge management service
│   ├── charge-point-service.cds  # Charging point operations
│   ├── session-service.cds       # Charging session management
│   ├── qr-service.cds            # QR code encryption service
│   └── user-service.cds          # User information service
├── 🔧 Service Implementations (TypeScript)
│   ├── badge-service.ts          # Badge business logic
│   ├── charge-point-service.ts   # Charging point logic
│   ├── session-service.ts        # Session management logic
│   ├── qr-service.ts             # QR code encryption/decryption
│   ├── user-service.ts           # User service logic
│   └── server.ts                 # Main server setup
├── 🔐 Authentication
│   └── auth/
│       └── dev-auth.ts           # Development authentication middleware
├── 🌐 External Services
│   └── external/
│       ├── ChargingStationService.cds    # External charging station API
│       ├── ChargingSessionService.cds    # External session API
│       └── RemoteBadgeService.cds        # External badge API
├── 🔧 Utilities
│   └── utils/
│       ├── badge-validator.ts     # Badge validation and caching
│       ├── badge-filter.ts        # Badge-based data filtering
│       ├── qr-encryption-service.ts  # QR encryption utilities
│       ├── request-filter.ts      # Query filtering utilities
│       └── user-utils.ts          # User context utilities
└── 📊 Business Services
    └── service/
        └── emobility-service.ts   # Core e-mobility business service
```

## ⚡ Core Services

### 🎫 Badge Service (`badge-service.ts`)

Manages user badges for charging station authentication.

**Key Features:**

- User badge retrieval with email-based filtering
- Integration with external badge service
- Automatic user context validation

**Endpoints:**

- `GET /BadgeService/Badges` - Get user's badges

### 🔌 Charge Point Service (`charge-point-service.ts`)

Provides charging point information and operations.

**Key Features:**

- Badge-based access control
- Integration with external charging station service
- Real-time charging point status

**Endpoints:**

- `GET /ChargePointService/ChargePoints` - Get available charge points

### ⚡ Session Service (`session-service.ts`)

Manages charging sessions and statistics.

**Key Features:**

- Start/stop charging sessions
- Session history and analytics
- Monthly statistics and usage patterns
- Badge-based session filtering

**Endpoints:**

- `GET /SessionService/ChargingSessions` - Get user's charging sessions
- `POST /SessionService/startChargingSession` - Start new session
- `POST /SessionService/stopChargingSession` - Stop active session
- `GET /SessionService/ChargingSessionMonthlyStats` - Monthly statistics
- `GET /SessionService/MostUsedSiteArea` - Usage analytics

### 👤 User Service (`user-service.ts`)

Provides user information and profile management.

**Key Features:**

- Current user information
- Profile management

**Endpoints:**

- `GET /UserService/currentUser` - Get current user info

### 🔐 QR Service (`qr-service.ts`)

Manages secure QR code encryption and decryption for charging station access.

**Key Features:**

- AES-256-GCM encryption for QR codes
- Secure QR code validation and decryption
- Integration with charging session workflow
- Multi-source encryption key management

**Endpoints:**

- `POST /QRService/decryptQRData` - Decrypt QR code data to start charging sessions

**Security:**

- Encrypted QR codes prevent unauthorized access
- Robust input validation and error handling
- Production-ready encryption key management

## 🔐 Authentication & Authorization

### Development Authentication (`auth/dev-auth.ts`)

Custom authentication middleware for development environments.

**Features:**

- Profile-based user configuration
- Role-based access control
- Configurable via CLI profiles

**Supported Roles:**

- `admin` - Administrative access
- `user` - Basic user access
- `badgeRead` - Badge reading permissions
- `chargePointRead` - Charge point reading permissions
- `chargingSessionRead` - Session reading permissions

### Badge-Based Authorization (`utils/badge-validator.ts`)

Centralized badge validation system with LRU caching.

**Key Features:**

- Email-based badge lookup
- LRU cache for performance (30 min TTL)
- CDS context integration
- Flexible badge requirement validation

**Usage:**

```typescript
// Require any valid badge
await requireBadgeAccess(request);

// Require specific badges
await requireBadgeAccess(request, ['badge-123', 'badge-456']);

// Check current user badges
const badges = await getCurrentUserBadges();
```

## 🌐 External Service Integration

### Charging Station Service

- **Purpose**: Retrieve charging point information and operations
- **API**: `/cpo/odata/chargingStation/v1`
- **Operations**: Get charging points, start/stop sessions

### Charging Session Service

- **Purpose**: Manage charging sessions and retrieve history
- **API**: `/cpo/odata/chargingSession/v1`
- **Operations**: Session CRUD, statistics, analytics

### Remote Badge Service

- **Purpose**: User badge management and validation
- **API**: `/emsp/odata/badge/v1`
- **Operations**: Badge retrieval, validation

## 🔧 Utilities

### Badge Filtering (`utils/badge-filter.ts`)

- Dynamic query filtering based on user badges
- CDS expression building for badge-based access control

### Request Filtering (`utils/request-filter.ts`)

- Generic query filtering utilities
- Badge filter integration with CDS queries

### User Utilities (`utils/user-utils.ts`)

- User context extraction from requests
- Email and identity management

## 🚀 Development

### Prerequisites

- Node.js >= 20
- SAP CDS CLI
- Access to external e-mobility services

### Local Development

```bash
# Start with default profile
cds watch

# Start with specific profile
cds watch --profile hybrid

# Debug mode
cds watch --debug
```

### Using the CLI (Recommended)

```bash
cd cli
npm run cli backend          # Backend only
npm run cli backend --debug  # With debugging
npm run cli start           # Both backend + frontend
```

### Environment Configuration

Services are configured via `.cdsrc.json` and `.cdsrc-private.json`:

```json
{
  "requires": {
    "ChargingStationService": {
      "kind": "odata",
      "model": "srv/external/ChargingStationService"
    },
    "ChargingSessionService": {
      "kind": "odata", 
      "model": "srv/external/ChargingSessionService"
    },
    "RemoteBadgeService": {
      "kind": "odata",
      "model": "srv/external/RemoteBadgeService"
    }
  }
}
```

### Authentication Setup

Development authentication is configured via CLI profiles:

```bash
cd cli
npm run cli config  # Setup authentication profile
```

### QR Service Configuration

The QR service requires an encryption key for secure QR code operations:

**Production**: The `driver-app-qr-config` user-provided service is automatically created during deployment, but the encryption key must be manually synchronized using CLI commands:

```bash
cd cli
npm run cli generate-qr --setup-key        # Generate and configure initial key
npm run cli generate-qr --sync-key-to-cf   # Push local key to CF service  
npm run cli generate-qr --sync-key-from-cf # Pull key from CF service
npm run cli generate-qr --key-status       # Check synchronization status
```

**Development**: Add encryption key to your local configuration:

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
npm run cli generate-qr --setup-key  # Generates key AND configures it automatically
```

**Manual generation** (if needed):

```bash
# Generate a random 256-bit key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Key Sources** (in priority order):

1. CDS configuration (`cds.env['qr-encryption']`)
2. VCAP_SERVICES (CF bound services)
3. Environment variable (`QR_ENCRYPTION_KEY`)

**Troubleshooting**: If you see `🚨 QR_ENCRYPTION_KEY not configured!`, use the CLI commands above to create and synchronize your encryption key.

## 🔄 Data Flow

```text
1. Client Request → Authentication Middleware
2. Authentication → User Context Creation
3. Service Handler → Badge Validation
4. Badge Validation → External Badge Service (cached)
5. Query Building → Badge-based Filtering
6. External API Call → Response Processing
7. Response → Client
```

## 📊 Performance Optimizations

### Badge Caching

- **LRU Cache**: 5-minute TTL, max 1000 users
- **Context Integration**: Badges stored in CDS context
- **Cache Statistics**: Available via `BadgeValidator.getCacheStats()`

### Query Optimization

- Badge-based filtering at query level
- Reduced external API calls via caching
- Efficient CDS expression building

## 📚 Key Dependencies

- **@sap/cds**: SAP Cloud Application Programming Model
- **@sap/ams**: Authorization Management Service
- **@sap-cloud-sdk/http-client**: SAP Cloud SDK for external APIs
- **lru-cache**: Badge validation caching
- **express**: Web server framework

## 🔗 Related Documentation

- [Frontend Documentation](../app/driver-vue/README.md)
- [CLI Documentation](../cli/README.md)
- [Root Project Documentation](../README.md)
- [SAP CAP Documentation](https://cap.cloud.sap/docs/)
