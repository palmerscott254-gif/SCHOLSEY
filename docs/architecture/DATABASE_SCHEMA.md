# Database Schema

## 📊 Overview

PostgreSQL 15+ with the following design principles:
- **Normalization**: 3NF for data integrity
- **Indexing**: Optimized for query performance
- **Partitioning**: Time-based partitioning for large tables
- **Encryption**: Sensitive fields encrypted at application layer
- **Audit**: Timestamps and soft deletes on all tables

## 🗂️ Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│     Users       │─────────│   UserSessions  │
│                 │    1:N  │                 │
└────────┬────────┘         └─────────────────┘
         │
         │ 1:N
         │
┌────────▼────────┐         ┌─────────────────┐
│    Devices      │─────────│  DeviceStatus   │
│                 │    1:1  │                 │
└────────┬────────┘         └─────────────────┘
         │
         │ 1:N
         ├──────────┬──────────┬──────────┬─────────┐
         │          │          │          │         │
┌────────▼────────┐┌▼─────────┐┌▼─────────┐┌▼──────┐┌▼─────────┐
│LocationHistory  ││Security  ││  Alerts  ││Actions││AIAnalysis│
│                 ││Events    ││          ││       ││          │
└─────────────────┘└──────────┘└──────────┘└───────┘└──────────┘
```

## 📋 Table Definitions

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    
    -- 2FA
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    backup_codes TEXT[], -- Encrypted array
    
    -- Security
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP,
    last_login_at TIMESTAMP,
    last_login_ip INET,
    
    -- Subscription
    subscription_tier VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
    subscription_expires_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP, -- Soft delete
    
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_created_at ON users(created_at DESC);
```

### UserSessions Table

```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session data
    refresh_token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    
    -- Expiry
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_refresh_token ON user_sessions(refresh_token_hash) 
    WHERE revoked_at IS NULL;
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at) 
    WHERE revoked_at IS NULL;
```

### Devices Table

```sql
CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Device info
    device_name VARCHAR(100) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- android, ios
    os_version VARCHAR(50),
    app_version VARCHAR(20),
    device_model VARCHAR(100),
    
    -- Identifiers
    device_uuid VARCHAR(255) UNIQUE NOT NULL, -- Device-generated UUID
    push_token TEXT, -- For notifications
    
    -- Pairing
    pairing_code VARCHAR(6), -- Temporary pairing code
    pairing_expires_at TIMESTAMP,
    paired_at TIMESTAMP,
    public_key TEXT, -- For E2E encryption
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_tracking_enabled BOOLEAN DEFAULT TRUE,
    stealth_mode BOOLEAN DEFAULT FALSE,
    
    -- Settings
    settings JSONB DEFAULT '{}', -- Device-specific settings
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    CONSTRAINT valid_device_type CHECK (device_type IN ('android', 'ios'))
);

CREATE INDEX idx_devices_user_id ON devices(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_uuid ON devices(device_uuid) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_is_active ON devices(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_devices_settings_gin ON devices USING GIN (settings);
```

### DeviceStatus Table

```sql
CREATE TABLE device_status (
    device_id UUID PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Connection status
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP,
    connection_quality VARCHAR(20), -- excellent, good, fair, poor
    
    -- Battery
    battery_level INT CHECK (battery_level >= 0 AND battery_level <= 100),
    is_charging BOOLEAN,
    
    -- Network
    network_type VARCHAR(20), -- wifi, cellular, none
    carrier_name VARCHAR(100),
    sim_status VARCHAR(20), -- present, removed, unknown
    
    -- Location
    airplane_mode BOOLEAN DEFAULT FALSE,
    location_services_enabled BOOLEAN DEFAULT TRUE,
    
    -- Security
    is_rooted_jailbroken BOOLEAN DEFAULT FALSE,
    screen_locked BOOLEAN,
    
    -- Current location
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    current_accuracy DECIMAL(10, 2),
    location_updated_at TIMESTAMP,
    
    -- Metadata
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_device_status_last_seen ON device_status(last_seen_at DESC);
CREATE INDEX idx_device_status_online ON device_status(is_online);
```

### LocationHistory Table (Partitioned)

```sql
CREATE TABLE location_history (
    id BIGSERIAL,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Location data
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    
    -- Context
    activity VARCHAR(20), -- stationary, walking, running, driving
    battery_level INT,
    
    -- Timestamp
    recorded_at TIMESTAMP NOT NULL,
    synced_at TIMESTAMP DEFAULT NOW(),
    
    PRIMARY KEY (id, recorded_at)
) PARTITION BY RANGE (recorded_at);

-- Create partitions for each month (example for 2026)
CREATE TABLE location_history_2026_01 PARTITION OF location_history
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE location_history_2026_02 PARTITION OF location_history
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE location_history_2026_03 PARTITION OF location_history
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- Continue for all months...

CREATE INDEX idx_location_device_time ON location_history(device_id, recorded_at DESC);
CREATE INDEX idx_location_coordinates ON location_history USING GIST (
    ll_to_earth(latitude, longitude)
); -- For geospatial queries
```

### SecurityEvents Table

```sql
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    
    -- Event type
    event_type VARCHAR(50) NOT NULL,
    -- Types: failed_login, sim_removed, airplane_mode, root_detected,
    --        device_powered_off, unusual_motion, emergency_trigger
    
    -- Event data
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    description TEXT,
    metadata JSONB, -- Event-specific data
    
    -- Location at time of event
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    accuracy DECIMAL(10, 2),
    
    -- Media
    photo_url TEXT, -- S3 URL to captured photo
    audio_url TEXT, -- S3 URL to audio recording (if any)
    
    -- Status
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES users(id),
    
    -- Timestamp
    occurred_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_device_id ON security_events(device_id);
CREATE INDEX idx_security_event_type ON security_events(event_type);
CREATE INDEX idx_security_severity ON security_events(severity);
CREATE INDEX idx_security_occurred_at ON security_events(occurred_at DESC);
CREATE INDEX idx_security_acknowledged ON security_events(acknowledged) 
    WHERE NOT acknowledged;
CREATE INDEX idx_security_metadata_gin ON security_events USING GIN (metadata);
```

### Alerts Table

```sql
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    security_event_id UUID REFERENCES security_events(id) ON DELETE SET NULL,
    
    -- Alert details
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(50) NOT NULL, -- security, system, info
    priority VARCHAR(20) NOT NULL, -- low, medium, high, urgent
    
    -- Notification channels
    sent_push BOOLEAN DEFAULT FALSE,
    sent_email BOOLEAN DEFAULT FALSE,
    sent_sms BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_device_id ON alerts(device_id);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX idx_alerts_unread ON alerts(user_id, is_read) 
    WHERE NOT is_read;
```

### RemoteActions Table

```sql
CREATE TABLE remote_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    initiated_by UUID NOT NULL REFERENCES users(id),
    
    -- Action details
    action_type VARCHAR(50) NOT NULL,
    -- Types: lock, unlock, alarm, wipe, request_photo, 
    --        enable_tracking, disable_tracking
    
    parameters JSONB, -- Action-specific parameters
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status: pending, sent, delivered, executed, failed, expired
    
    result JSONB, -- Execution result
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    executed_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '5 minutes')
);

CREATE INDEX idx_actions_device_id ON remote_actions(device_id);
CREATE INDEX idx_actions_status ON remote_actions(status) 
    WHERE status IN ('pending', 'sent');
CREATE INDEX idx_actions_created_at ON remote_actions(created_at DESC);
```

### AIAnalysis Table

```sql
CREATE TABLE ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Image info
    image_url TEXT NOT NULL,
    image_hash VARCHAR(64) UNIQUE, -- SHA-256 for deduplication
    file_size_bytes BIGINT,
    
    -- Analysis results
    is_ai_generated BOOLEAN,
    ai_probability DECIMAL(5, 4), -- 0.0000 to 1.0000
    is_edited BOOLEAN,
    edit_probability DECIMAL(5, 4),
    
    -- Detailed findings
    metadata_anomalies JSONB,
    lighting_inconsistencies JSONB,
    compression_artifacts JSONB,
    
    -- Overall
    authenticity_score DECIMAL(5, 4), -- 0.0000 to 1.0000
    confidence_level VARCHAR(20), -- low, medium, high
    explanation TEXT,
    detailed_report JSONB,
    
    -- Processing
    processing_time_ms INT,
    model_version VARCHAR(20),
    
    -- Metadata
    analyzed_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_analysis_user_id ON ai_analysis(user_id);
CREATE INDEX idx_ai_analysis_image_hash ON ai_analysis(image_hash);
CREATE INDEX idx_ai_analysis_created_at ON ai_analysis(created_at DESC);
```

### AuditLog Table

```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    
    -- Who
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    
    -- What
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- users, devices, alerts, etc.
    entity_id UUID,
    
    -- Details
    changes JSONB, -- Before/after values
    metadata JSONB,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- When
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_device_id ON audit_log(device_id);
CREATE INDEX idx_audit_action ON audit_log(action);
CREATE INDEX idx_audit_created_at ON audit_log(created_at DESC);
```

## 🔍 Key Queries & Optimizations

### 1. Get Latest Device Location

```sql
SELECT 
    d.id, d.device_name, ds.current_latitude, ds.current_longitude,
    ds.location_updated_at, ds.battery_level, ds.is_online
FROM devices d
JOIN device_status ds ON d.id = ds.device_id
WHERE d.user_id = $1 AND d.is_active = true
ORDER BY ds.location_updated_at DESC;
```

### 2. Get Security Events Timeline

```sql
SELECT 
    se.id, se.event_type, se.severity, se.description,
    se.latitude, se.longitude, se.photo_url, se.occurred_at
FROM security_events se
WHERE se.device_id = $1
    AND se.occurred_at >= NOW() - INTERVAL '30 days'
ORDER BY se.occurred_at DESC
LIMIT 100;
```

### 3. Get Unread Alerts

```sql
SELECT 
    a.id, a.title, a.message, a.alert_type, a.priority,
    d.device_name, a.created_at
FROM alerts a
LEFT JOIN devices d ON a.device_id = d.id
WHERE a.user_id = $1 
    AND a.is_read = false 
    AND a.dismissed = false
ORDER BY a.priority DESC, a.created_at DESC;
```

### 4. Get Location History (Geospatial)

```sql
-- Find all locations within 1km of a point
SELECT 
    latitude, longitude, recorded_at, activity
FROM location_history
WHERE device_id = $1
    AND recorded_at >= NOW() - INTERVAL '7 days'
    AND earth_box(ll_to_earth($2, $3), 1000) @> ll_to_earth(latitude, longitude)
ORDER BY recorded_at DESC;
```

## 🔄 Migrations Strategy

Using Prisma Migrate:

```bash
# Create new migration
npx prisma migrate dev --name add_user_preferences

# Apply migrations in production
npx prisma migrate deploy

# Reset database (dev only)
npx prisma migrate reset
```

## 📈 Scaling Considerations

### Read Replicas
- Route read queries to replicas
- Use write-through cache for hot data
- Connection pooling with PgBouncer

### Partitioning
- `location_history`: Monthly partitions
- `security_events`: Quarterly partitions
- `audit_log`: Monthly partitions
- Automatic partition creation via cron job

### Archival Strategy
- Move data older than 1 year to cold storage (S3)
- Keep last 90 days in hot database
- Implement data retention policies per user tier

### Indexing Strategy
- B-tree indexes for equality/range queries
- GIN indexes for JSONB columns
- GIST indexes for geospatial queries
- Partial indexes for filtered queries
- Regular ANALYZE and VACUUM

## 🔐 Data Privacy & Compliance

### GDPR Compliance
- **Right to Access**: Export user data endpoint
- **Right to Erasure**: Soft delete with hard delete scheduler
- **Right to Portability**: JSON export functionality
- **Data Minimization**: Only collect necessary data
- **Encryption**: AES-256-GCM for sensitive fields

### Data Retention
- Location history: 1 year (configurable per tier)
- Security events: 2 years
- Audit logs: 7 years
- User accounts: Until deletion requested

---

**Schema Version**: 1.0.0  
**Last Updated**: February 2026
