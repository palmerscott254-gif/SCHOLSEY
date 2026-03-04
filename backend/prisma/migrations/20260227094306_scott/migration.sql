-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone_number" VARCHAR(20),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" VARCHAR(32),
    "backup_codes" TEXT[],
    "failed_login_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP,
    "last_login_at" TIMESTAMP,
    "last_login_ip" INET,
    "subscription_tier" VARCHAR(20) NOT NULL DEFAULT 'free',
    "subscription_expires_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_hash" VARCHAR(255) NOT NULL,
    "device_fingerprint" VARCHAR(255),
    "user_agent" TEXT,
    "ip_address" INET,
    "expires_at" TIMESTAMP NOT NULL,
    "revoked_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devices" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_name" VARCHAR(100) NOT NULL,
    "device_type" VARCHAR(20) NOT NULL,
    "os_version" VARCHAR(50),
    "app_version" VARCHAR(20),
    "device_model" VARCHAR(100),
    "device_uuid" VARCHAR(255) NOT NULL,
    "push_token" TEXT,
    "pairing_code" VARCHAR(6),
    "pairing_expires_at" TIMESTAMP,
    "paired_at" TIMESTAMP,
    "public_key" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_tracking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "stealth_mode" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,
    "deleted_at" TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_status" (
    "device_id" UUID NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP,
    "connection_quality" VARCHAR(20),
    "battery_level" INTEGER,
    "is_charging" BOOLEAN,
    "network_type" VARCHAR(20),
    "carrier_name" VARCHAR(100),
    "sim_status" VARCHAR(20),
    "airplane_mode" BOOLEAN NOT NULL DEFAULT false,
    "location_services_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_rooted_jailbroken" BOOLEAN NOT NULL DEFAULT false,
    "screen_locked" BOOLEAN,
    "current_latitude" DECIMAL(10,8),
    "current_longitude" DECIMAL(11,8),
    "current_accuracy" DECIMAL(10,2),
    "location_updated_at" TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "device_status_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "location_history" (
    "id" BIGSERIAL NOT NULL,
    "device_id" UUID NOT NULL,
    "latitude" DECIMAL(10,8) NOT NULL,
    "longitude" DECIMAL(11,8) NOT NULL,
    "accuracy" DECIMAL(10,2),
    "altitude" DECIMAL(10,2),
    "speed" DECIMAL(10,2),
    "heading" DECIMAL(5,2),
    "activity" VARCHAR(20),
    "battery_level" INTEGER,
    "recorded_at" TIMESTAMP NOT NULL,
    "synced_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_events" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "event_type" VARCHAR(50) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "accuracy" DECIMAL(10,2),
    "photo_url" TEXT,
    "audio_url" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP,
    "acknowledged_by" UUID,
    "occurred_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "device_id" UUID,
    "security_event_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "alert_type" VARCHAR(50) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "sent_push" BOOLEAN NOT NULL DEFAULT false,
    "sent_email" BOOLEAN NOT NULL DEFAULT false,
    "sent_sms" BOOLEAN NOT NULL DEFAULT false,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissed_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "remote_actions" (
    "id" UUID NOT NULL,
    "device_id" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "action_type" VARCHAR(50) NOT NULL,
    "parameters" JSONB,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "result" JSONB,
    "error_message" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP,
    "executed_at" TIMESTAMP,
    "expires_at" TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),

    CONSTRAINT "remote_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "image_hash" VARCHAR(64),
    "file_size_bytes" BIGINT,
    "is_ai_generated" BOOLEAN,
    "ai_probability" DECIMAL(5,4),
    "is_edited" BOOLEAN,
    "edit_probability" DECIMAL(5,4),
    "metadata_anomalies" JSONB,
    "lighting_inconsistencies" JSONB,
    "compression_artifacts" JSONB,
    "authenticity_score" DECIMAL(5,4),
    "confidence_level" VARCHAR(20),
    "explanation" TEXT,
    "detailed_report" JSONB,
    "processing_time_ms" INTEGER,
    "model_version" VARCHAR(20),
    "analyzed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "device_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "changes" JSONB,
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_refresh_token_hash_key" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_refresh_token_hash_idx" ON "user_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "devices_device_uuid_key" ON "devices"("device_uuid");

-- CreateIndex
CREATE INDEX "devices_user_id_idx" ON "devices"("user_id");

-- CreateIndex
CREATE INDEX "devices_device_uuid_idx" ON "devices"("device_uuid");

-- CreateIndex
CREATE INDEX "devices_is_active_idx" ON "devices"("is_active");

-- CreateIndex
CREATE INDEX "device_status_last_seen_at_idx" ON "device_status"("last_seen_at" DESC);

-- CreateIndex
CREATE INDEX "device_status_is_online_idx" ON "device_status"("is_online");

-- CreateIndex
CREATE INDEX "location_history_device_id_recorded_at_idx" ON "location_history"("device_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "security_events_device_id_idx" ON "security_events"("device_id");

-- CreateIndex
CREATE INDEX "security_events_event_type_idx" ON "security_events"("event_type");

-- CreateIndex
CREATE INDEX "security_events_severity_idx" ON "security_events"("severity");

-- CreateIndex
CREATE INDEX "security_events_occurred_at_idx" ON "security_events"("occurred_at" DESC);

-- CreateIndex
CREATE INDEX "security_events_acknowledged_idx" ON "security_events"("acknowledged");

-- CreateIndex
CREATE INDEX "alerts_user_id_idx" ON "alerts"("user_id");

-- CreateIndex
CREATE INDEX "alerts_device_id_idx" ON "alerts"("device_id");

-- CreateIndex
CREATE INDEX "alerts_created_at_idx" ON "alerts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "alerts_user_id_is_read_idx" ON "alerts"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "remote_actions_device_id_idx" ON "remote_actions"("device_id");

-- CreateIndex
CREATE INDEX "remote_actions_status_idx" ON "remote_actions"("status");

-- CreateIndex
CREATE INDEX "remote_actions_created_at_idx" ON "remote_actions"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ai_analysis_image_hash_key" ON "ai_analysis"("image_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_user_id_idx" ON "ai_analysis"("user_id");

-- CreateIndex
CREATE INDEX "ai_analysis_image_hash_idx" ON "ai_analysis"("image_hash");

-- CreateIndex
CREATE INDEX "ai_analysis_created_at_idx" ON "ai_analysis"("created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "audit_log_device_id_idx" ON "audit_log"("device_id");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "audit_log"("created_at" DESC);

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_status" ADD CONSTRAINT "device_status_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_history" ADD CONSTRAINT "location_history_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_events" ADD CONSTRAINT "security_events_acknowledged_by_fkey" FOREIGN KEY ("acknowledged_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_security_event_id_fkey" FOREIGN KEY ("security_event_id") REFERENCES "security_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_actions" ADD CONSTRAINT "remote_actions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "remote_actions" ADD CONSTRAINT "remote_actions_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
