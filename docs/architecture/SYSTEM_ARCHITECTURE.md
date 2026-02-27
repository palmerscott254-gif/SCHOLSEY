# System Architecture

## 📐 Overview

The Smart Device Security & Tracking Platform follows a **microservices architecture** with event-driven communication, designed for horizontal scalability and high availability.

## 🏛️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├──────────────────────────────┬──────────────────────────────────────────┤
│   Mobile App (iOS/Android)   │    Desktop Dashboard (Electron/Web)      │
│   • React Native             │    • React + Electron                     │
│   • Redux + RTK Query        │    • Material-UI                          │
│   • Encrypted Local Storage  │    • Mapbox GL                            │
│   • Background Services      │    • Real-time Charts                     │
└──────────────┬───────────────┴──────────────────┬───────────────────────┘
               │                                  │
               │ HTTPS/WSS (TLS 1.3)             │
               │                                  │
┌──────────────┴──────────────────────────────────┴───────────────────────┐
│                        API GATEWAY LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Load Balancer (NGINX/ALB)                                      │    │
│  │  • SSL Termination          • Rate Limiting                     │    │
│  │  • DDoS Protection          • Request Routing                   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴───────────────────────────────────────┐
│                        APPLICATION LAYER                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │  Auth Service   │  │ Device Service  │  │  Tracking Service       │ │
│  │  • JWT tokens   │  │ • Registration  │  │  • GPS processing       │ │
│  │  • 2FA/TOTP     │  │ • Status mgmt   │  │  • Location history     │ │
│  │  • Sessions     │  │ • Pairing       │  │  • Geo-fencing          │ │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘ │
│           │                     │                       │               │
│  ┌────────┴────────┐  ┌────────┴────────┐  ┌───────────┴─────────────┐ │
│  │ Security Svc    │  │  Alert Service  │  │  WebSocket Gateway      │ │
│  │ • Threat detect │  │ • Event rules   │  │  • Real-time sync       │ │
│  │ • Photo capture │  │ • Notifications │  │  • Pub/Sub messaging    │ │
│  │ • SIM/mode chk  │  │ • Timeline      │  │  • Connection pool      │ │
│  └────────┬────────┘  └────────┬────────┘  └───────────┬─────────────┘ │
│           │                     │                       │               │
│  ┌────────┴─────────────────────┴──────────┐  ┌────────┴─────────────┐ │
│  │      Remote Actions Service              │  │   AI Proxy Service   │ │
│  │      • Lock/Unlock  • Alarm              │  │   • Image forwarding │ │
│  │      • Wipe         • Photo request      │  │   • Result caching   │ │
│  └──────────────────────────────────────────┘  └──────────────────────┘ │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴───────────────────────────────────────┐
│                         MESSAGE & CACHE LAYER                            │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Redis Cluster       │  │  Message Queue (Bull/RabbitMQ)           │ │
│  │  • Session store     │  │  • Async job processing                  │ │
│  │  • WebSocket adapter │  │  • Event distribution                    │ │
│  │  • Cache layer       │  │  • Retry mechanisms                      │ │
│  └──────────────────────┘  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴───────────────────────────────────────┐
│                           DATA LAYER                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  PostgreSQL Cluster  │  │  S3-Compatible Storage                   │ │
│  │  • User data         │  │  • Captured photos                       │ │
│  │  • Device registry   │  │  • AI analysis results                   │ │
│  │  • Tracking history  │  │  • Logs/backups                          │ │
│  │  • Security events   │  │                                          │ │
│  │  (Primary-Replica)   │  │                                          │ │
│  └──────────────────────┘  └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────┴───────────────────────────────────────┐
│                         EXTERNAL SERVICES                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  AI Analysis Svc │  │  Email/SMS Svc   │  │  Monitoring Stack    │  │
│  │  (Python/FastAPI)│  │  (SendGrid/SNS)  │  │  • Prometheus        │  │
│  │  • CNN models    │  │  • Alert delivery│  │  • Grafana           │  │
│  │  • Metadata scan │  │                  │  │  • ELK Stack         │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### 1. Real-time Location Tracking

```
Mobile App → WebSocket → Gateway Service → Redis Pub/Sub → 
Dashboard + Database (async write)
```

### 2. Security Event (Failed Login)

```
Mobile App detects failed login
    ↓
Capture photo + GPS + timestamp
    ↓
Store locally (encrypted)
    ↓
Send to Security Service via HTTPS
    ↓
Security Service:
  - Store event in PostgreSQL
  - Upload photo to S3
  - Publish alert to Redis
  - Queue notification job
    ↓
Alert Service:
  - Notify dashboard via WebSocket
  - Send push notification
  - Email/SMS (if enabled)
```

### 3. Remote Action (Lock Device)

```
Dashboard → Auth check → Remote Action Service → 
Message Queue → WebSocket → Mobile App → Execute lock
```

### 4. AI Image Analysis

```
Dashboard uploads image → AI Proxy Service → 
AI Analysis Service (Python) → ML models → 
Results cached in Redis → Return to dashboard
```

## 🔐 Security Architecture

### Encryption Layers

1. **Transport Layer**: TLS 1.3 for all communications
2. **Application Layer**: E2E encryption for sensitive payloads
3. **Storage Layer**: AES-256-GCM for data at rest
4. **Key Management**: AWS KMS / HashiCorp Vault

### Device Pairing Flow

```
1. User logs into Dashboard
2. Dashboard generates pairing request (QR code)
   - Contains: server URL, temporary token, device ID
3. Mobile app scans QR
4. App generates device keypair (ECDH)
5. Secure key exchange (ECDHE)
6. Derive shared secret
7. Store encrypted credentials in secure storage
8. Pairing confirmed, establish WebSocket
```

### Authentication Flow

```
1. User login (email + password)
2. Server validates credentials
3. If valid, request 2FA code (TOTP)
4. User provides 2FA code
5. Server validates TOTP
6. Issue JWT access token (15 min) + refresh token (7 days)
7. Client stores tokens securely
8. All subsequent requests include JWT in Authorization header
```

## 📡 Communication Protocols

### REST API (HTTPS)
- Device registration
- User management
- Historical data queries
- File uploads
- Configuration updates

### WebSocket (WSS)
- Real-time location updates
- Live alerts
- Remote commands
- Device status changes
- Dashboard notifications

### Message Queue
- Asynchronous job processing
- Email/SMS notifications
- Batch data processing
- Event distribution
- Retry handling

## 🔥 Scalability Strategy

### Horizontal Scaling

1. **Stateless Services**: All application services are stateless
   - Store sessions in Redis
   - Use JWT for authentication
   - Enable load balancing across instances

2. **Database Scaling**:
   - **Read Replicas**: Multiple read replicas for query distribution
   - **Connection Pooling**: PgBouncer for connection management
   - **Sharding**: Partition by user_id for extreme scale

3. **Cache Strategy**:
   - **Redis Cluster**: Distributed caching
   - **CDN**: Static assets (dashboard, images)
   - **Edge Caching**: Location data for maps

4. **WebSocket Scaling**:
   - Redis Adapter for multi-instance Socket.IO
   - Sticky sessions at load balancer level
   - Horizontal pod autoscaling in Kubernetes

### Performance Optimizations

- **Database Indexing**: Optimized indexes on frequently queried fields
- **Query Optimization**: Use of prepared statements, query planning
- **Compression**: Gzip/Brotli for API responses
- **Lazy Loading**: Pagination for large datasets
- **Background Jobs**: Offload heavy tasks to queue workers
- **Caching**: Multi-layer caching (Redis, CDN, browser)

## 🛡️ High Availability

### Fault Tolerance

- **Load Balancing**: Multiple instances behind load balancers
- **Health Checks**: Automated health monitoring with failover
- **Circuit Breakers**: Prevent cascade failures
- **Graceful Degradation**: Fallback mechanisms
- **Database Replication**: Multi-AZ PostgreSQL with automatic failover
- **Backup Strategy**: Automated daily backups with point-in-time recovery

### Monitoring & Alerts

- **Metrics**: Prometheus for time-series metrics
- **Visualization**: Grafana dashboards
- **Logging**: ELK stack for centralized logging
- **Tracing**: Jaeger for distributed tracing
- **Alerting**: PagerDuty/Opsgenie integration
- **Uptime Monitoring**: External monitoring (Pingdom/UptimeRobot)

## 🌍 Multi-Region Deployment

For global reach:

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   US-EAST    │◄───────►│   EU-WEST    │◄───────►│   AP-SOUTH   │
│   (Primary)  │         │  (Secondary) │         │  (Secondary) │
└──────────────┘         └──────────────┘         └──────────────┘
      │                          │                         │
      └──────────────────────────┴─────────────────────────┘
                                 │
                    Global Database Replication
```

- **Geo-routing**: Route users to nearest region
- **Data Replication**: Multi-master or primary-replica
- **GDPR Compliance**: EU data stays in EU
- **Disaster Recovery**: Cross-region failover

## 📊 Technology Decisions

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Backend | NestJS (Node.js) | TypeScript, modular architecture, scalable |
| Database | PostgreSQL | ACID compliance, JSON support, reliability |
| Cache | Redis | High performance, pub/sub, scalability |
| Mobile | React Native | Cross-platform, large ecosystem, performance |
| Desktop | Electron + React | Cross-platform, web tech, easy updates |
| Real-time | Socket.IO | WebSocket with fallbacks, easy scaling |
| AI Service | Python/FastAPI | ML ecosystem, async support, performance |
| Container | Docker | Consistency, portability, DevOps standard |
| Orchestration | Kubernetes | Auto-scaling, self-healing, industry standard |
| CI/CD | GitHub Actions | Integrated, flexible, cost-effective |
| Monitoring | Prometheus/Grafana | Open-source, powerful, ecosystem |

## 🔮 Future Enhancements

- Machine learning for anomaly detection
- Blockchain for audit trail immutability
- Edge computing for reduced latency
- GraphQL API for flexible queries
- Multi-factor device authentication
- Integration marketplace for 3rd party tools

---

**Architecture Version**: 1.0.0  
**Last Updated**: February 2026
