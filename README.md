# Promo Feature Flag Service

An enterprise-grade feature flag orchestration platform built with Node.js, TypeScript, and Apollo GraphQL. Designed to isolate blast radiuses and protect core storefront transaction flows during high-scale e-commerce promotions.

## 🎯 Overview

This service provides real-time feature flag evaluation with:

- **Rule-based targeting** - Evaluate flags based on store ID, user segment, and device type
- **Event-driven architecture** - Pub/Sub-based cache invalidation for distributed systems
- **Platform observability** - Built-in metrics tracking and structured JSON logging
- **Clean Architecture** - Decoupled domain, infrastructure, and GraphQL layers
- **Production-ready** - Full test coverage, TypeScript strict mode, CI/CD pipeline

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (GraphQL)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GraphQL Resolvers                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ evaluateFlag: Repository → Evaluator → Metrics       │   │
│  │ toggleFlag: Repository → PubSub Event → Response     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  FlagRepository │ │  PubSubClient   │ │ PlatformMetrics │
│  (in-memory Map)│ │  (event logger) │ │  (counter Map)  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │
         ▼
┌─────────────────┐
│  FlagEvaluator  │
│  (domain logic) │
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 22.0.0
- npm >= 10.0.0

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd promo-flag-service

# Install dependencies
npm install
```

### Development Server

```bash
# Start development server with hot-reload
npm run dev:clean
```

### Production Build

```bash
# Build and start production server
npm run build
npm run start:clean
```

The GraphQL endpoint will be available at `http://localhost:4000/graphql`

## 📋 API Reference

### Operations

| Operation          | Type     | Description                               |
| ------------------ | -------- | ----------------------------------------- |
| `evaluateFlag`   | Query    | Evaluate a feature flag for given context |
| `getFlagDetails` | Query    | Fetch full feature flag configuration     |
| `toggleFlag`     | Mutation | Toggle a flag's active state              |

### Input Types

```graphql
input EvaluationContextInput {
  storeId: String!
  userSegment: String!
  deviceType: String!
}
```

### Example Queries

#### 1. Evaluate Flag (Matching Store)

Evaluate the `promo-black-friday` flag for store `BCN-01`:

```bash
curl -s "http://localhost:4000/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ evaluateFlag(key: \"promo-black-friday\", context: { storeId: \"BCN-01\", userSegment: \"premium\", deviceType: \"mobile\" }) }"}' | jq
```

**Expected Result:**

```json
{
  "data": {
    "evaluateFlag": true
  }
}
```

**Server Logs:**

```
[Metrics] Flag "promo-black-friday" evaluated: MATCH (total: 1)
```

---

#### 2. Evaluate Flag (Non-Matching Store)

Evaluate the `promo-black-friday` flag for store `DUB-01` (not in targeting list):

```bash
curl -s "http://localhost:4000/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ evaluateFlag(key: \"promo-black-friday\", context: { storeId: \"DUB-01\", userSegment: \"premium\", deviceType: \"mobile\" }) }"}' | jq
```

**Expected Result:**

```json
{
  "data": {
    "evaluateFlag": false
  }
}
```

**Server Logs:**

```
[Metrics] Flag "promo-black-friday" evaluated: FALLBACK (total: 2)
```

---

#### 3. Toggle Flag Mutation

Toggle the `promo-black-friday` flag to active:

```bash
curl -s "http://localhost:4000/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { toggleFlag(key: \"promo-black-friday\", isActive: true) { key isActive } }"}' | jq
```

**Expected Result:**

```json
{
  "data": {
    "toggleFlag": {
      "key": "promo-black-friday",
      "isActive": true
    }
  }
}
```

**Server Logs:**

```
[PubSub:flag-updates] Event published: {
  "eventType": "FLAG_UPDATED",
  "flagKey": "promo-black-friday",
  "isActive": true,
  "timestamp": "2026-06-27T..."
}
```

---

#### 4. Get Flag Details

Fetch full configuration for a flag:

```bash
curl -s "http://localhost:4000/graphql" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ getFlagDetails(key: \"promo-black-friday\") { id key isActive rules { attribute operator values } } }"}' | jq
```

**Expected Result:**

```json
{
  "data": {
    "getFlagDetails": {
      "id": "flag-001",
      "key": "promo-black-friday",
      "isActive": true,
      "rules": [
        {
          "attribute": "storeId",
          "operator": "IN",
          "values": ["BCN-01", "MAD-02"]
        }
      ]
    }
  }
}
```

---

## 🧪 Testing

### Run All Tests

```bash
npm test
```

**Expected Output:**

```
 RUN  v4.1.9 /Users/petercoker/Documents/home-git/promo-flag-service

 Test Files  4 passed (4)
      Tests  36 passed (36)
```

### Test Coverage

| Suite             | Tests | Description                                   |
| ----------------- | ----- | --------------------------------------------- |
| Unit Tests        | 18    | Flag evaluation engine (EQUALS, IN operators) |
| Integration Tests | 18    | GraphQL API, PubSub events, Metrics           |

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

---

## 🔧 Development

### Available Scripts

| Command                 | Description                                   |
| ----------------------- | --------------------------------------------- |
| `npm run dev`         | Start development server (tsx watch)          |
| `npm run dev:clean`   | Free port 4000, then start dev server         |
| `npm start`           | Start production server                       |
| `npm run start:clean` | Free port 4000, then start production server  |
| `npm run build`       | Compile TypeScript to JavaScript              |
| `npm run typecheck`   | TypeScript validation (no emit)               |
| `npm test`            | Run all tests                                 |
| `npm run validate`    | Full validation (typecheck + imports + tests) |
| `npm run free-port`   | Kill process using port 4000                  |
| `npm run clean`       | Remove dist/ directory                        |

### Full Validation

```bash
npm run validate
```

**Expected Output:**

```
> npm run typecheck
> npm run check:imports
> npm run test

 Test Files  4 passed (4)
      Tests  36 passed (36)
```

---

## 📁 Project Structure

```
promo-flag-service/
├── .github/workflows/
│   └── ci.yml                 # GitHub Actions CI/CD pipeline
├── terraform/
│   ├── main.tf                # GCP Pub/Sub infrastructure
│   └── variables.tf           # Terraform variables
├── config/
│   └── default.ts             # Application configuration
├── src/
│   ├── domain/
│   │   ├── types.ts           # Core domain types
│   │   └── evaluator.ts       # Stateless flag evaluation engine
│   ├── graphql/
│   │   ├── schema.graphql     # GraphQL API contract
│   │   └── resolvers.ts       # GraphQL resolvers
│   ├── infra/
│   │   ├── db.ts              # In-memory FlagRepository
│   │   ├── pubsub.ts          # Event publisher for cache invalidation
│   │   └── metrics.ts         # Evaluation metrics tracker
│   ├── shared/
│   │   ├── errors.ts          # Custom error hierarchy
│   │   └── logger.ts          # Structured JSON logger
│   ├── app.ts                 # Apollo Server configuration
│   └── index.ts               # Application entry point
├── tests/
│   ├── evaluator.test.ts      # Unit tests (18 tests)
│   └── integration.test.ts    # Integration tests (18 tests)
├── scripts/
│   └── check-imports.js       # ESM import validator
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🏛️ Design Decisions

### 1. Clean Architecture

The codebase follows Clean Architecture principles with clear separation:

- **Domain Layer** (`src/domain/`) - Pure business logic, no external dependencies
- **Infrastructure Layer** (`src/infra/`) - External concerns (DB, PubSub, Metrics)
- **GraphQL Layer** (`src/graphql/`) - API orchestration and response mapping
- **Shared Layer** (`src/shared/`) - Cross-cutting concerns (logging, errors)

### 2. Event-Driven Cache Invalidation

When a flag is toggled, a `FLAG_UPDATED` event is published via Pub/Sub. This allows downstream services (CDN edge workers, mobile gateways) to invalidate their local caches instantly, guaranteeing sub-millisecond evaluation times across all storefront systems.

### 3. Fail-Secure Defaults

Missing flags always evaluate to `false`, preventing accidental feature exposure during outages or misconfigurations.

### 4. Observability First

- **Metrics**: Prometheus-compatible counters for evaluation tracking
- **Logging**: Structured JSON output compatible with GCP Logging, Datadog, Splunk
- **Errors**: Typed error hierarchy with HTTP status codes for API responses

### 5. Native ESM

All imports use explicit `.js` extensions for native Node.js ESM resolution, ensuring compatibility with modern tooling and avoiding bundler-specific configurations.

---

## ☁️ Infrastructure

### Terraform (GCP)

Provision cloud infrastructure:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

**Resources Created:**

- `google_pubsub_topic.flag_updates` - Event channel for cache invalidation
- `google_pubsub_subscription.store_app_cache_listener` - Downstream consumer
- `google_pubsub_topic.flag_updates_dead_letter` - Failed message handling
- `google_monitoring_alert_policy.pubsub_backlog` - Backlog alerting

---

## 🔍 Troubleshooting

### Port 4000 Already in Use

```bash
# Free the port
npm run free-port

# Or start with clean
npm run start:clean
```

### TypeScript Errors

```bash
# Run type check
npm run typecheck
```

### Import Resolution Errors

```bash
# Verify ESM imports
npm run check:imports
```

### Server Won't Start

Check for detailed error messages:

```bash
# The error handler now provides actionable feedback
[Bootstrap] ERROR: Port 4000 is already in use.
[Bootstrap] Fix: Run "lsof -ti:4000 | xargs kill -9" to free the port.
[Bootstrap] Or set a different port: PORT=4001 npm start
```

---

## 📊 Discussion Pointis context:  translate to Spanish from Spain speaking as a local Spanish man and break down the sentence so I could learn also context of the translation: s

### System Design

1. **Scalability** - In-memory evaluation is O(1), stateless design allows horizontal scaling
2. **Consistency** - Pub/Sub events ensure eventual consistency across distributed caches
3. **Reliability** - Fail-secure defaults, dead-letter queues for failed events
4. **Observability** - Metrics, structured logging, and alerting built-in

### Technical Choices

1. **TypeScript Strict Mode** - Catches errors at compile time, improves IDE support
2. **Native ESM** - No bundler required, faster cold starts
3. **GraphQL** - Strongly-typed API contract, easy to extend
4. **In-Memory Repository** - Fast for demo/testing, designed for easy swap to MongoDB/Redis

### Extension Points

1. **Add MongoDB** - Implement `FlagRepository` with MongoDB driver
2. **Add Authentication** - GraphQL context middleware with JWT validation
3. **Add Rate Limiting** - Apollo Server plugins with Redis-backed counter
4. **Add Circuit Breaker** - Evaluate retry/failure thresholds per flag

---

## 📄 License

ISC

## 👨‍💻 Author

Peter Coker
