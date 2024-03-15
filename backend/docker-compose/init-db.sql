-- Initialize database for AI Assistant
-- GDPR-compliant conversation logging with anonymization

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enhanced conversations table with error tracking and analytics
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    user_message_hash VARCHAR(255), -- Hashed version of user message for privacy
    user_language VARCHAR(10) NOT NULL DEFAULT 'en',
    bot_response TEXT NOT NULL,
    response_language VARCHAR(10) NOT NULL DEFAULT 'en',
    has_voice_input BOOLEAN DEFAULT FALSE,
    has_voice_output BOOLEAN DEFAULT FALSE,
    processing_time_ms INTEGER,
    knowledge_base_hits INTEGER DEFAULT 0,
    ecommerce_api_called BOOLEAN DEFAULT FALSE,

    -- Enhanced analytics fields (as suggested)
    response_length INTEGER,
    error_type VARCHAR(100),
    error_message TEXT,

    -- API usage tracking
    api_provider VARCHAR(50) DEFAULT 'gemini',
    model_used VARCHAR(100) DEFAULT 'gemini-1.5-flash',
    tokens_used INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    anonymized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_conversations_session_id ON conversations(session_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);
CREATE INDEX idx_conversations_language ON conversations(user_language);
CREATE INDEX idx_conversations_error_type ON conversations(error_type);
CREATE INDEX idx_conversations_api_provider ON conversations(api_provider);

-- User sessions table (minimal data for GDPR compliance)
CREATE TABLE user_sessions (
    session_id VARCHAR(255) PRIMARY KEY,
    user_agent_hash VARCHAR(255), -- Hashed user agent for basic analytics
    preferred_language VARCHAR(10) DEFAULT 'en',
    consent_given BOOLEAN DEFAULT FALSE,
    consent_timestamp TIMESTAMP WITH TIME ZONE,
    first_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    total_messages INTEGER DEFAULT 0,
    
    -- Auto-cleanup after 30 days for GDPR compliance
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

-- Knowledge base metrics
CREATE TABLE knowledge_base_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_hash VARCHAR(255) NOT NULL, -- Hashed query for privacy
    query_language VARCHAR(10) NOT NULL,
    results_count INTEGER DEFAULT 0,
    avg_similarity_score DECIMAL(5,4),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_kb_queries_created_at (created_at),
    INDEX idx_kb_queries_language (query_language)
);

-- E-commerce API usage tracking
CREATE TABLE ecommerce_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) NOT NULL,
    query_type VARCHAR(50) NOT NULL, -- 'product_search', 'stock_check', 'price_query'
    product_category VARCHAR(100),
    api_response_code INTEGER,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_ecommerce_session (session_id),
    INDEX idx_ecommerce_type (query_type),
    INDEX idx_ecommerce_created_at (created_at)
);

-- System metrics and health
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metric_unit VARCHAR(20),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_metrics_name_time (metric_name, recorded_at)
);

-- Function to anonymize old data (GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_old_conversations()
RETURNS void AS $$
BEGIN
    -- Remove detailed conversation data older than 7 days
    UPDATE conversations 
    SET user_message_hash = 'ANONYMIZED',
        bot_response = 'ANONYMIZED'
    WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '7 days')
    AND user_message_hash != 'ANONYMIZED';
    
    -- Delete sessions older than 30 days
    DELETE FROM user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up old metrics (keep only last 30 days)
    DELETE FROM system_metrics 
    WHERE recorded_at < (CURRENT_TIMESTAMP - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run anonymization (requires pg_cron extension)
-- This would typically be set up separately or via cron job
-- SELECT cron.schedule('anonymize-data', '0 2 * * *', 'SELECT anonymize_old_conversations();');

-- Insert initial system metrics
INSERT INTO system_metrics (metric_name, metric_value, metric_unit) VALUES
('database_initialized', 1, 'boolean'),
('schema_version', 1.0, 'version');

-- Grant permissions to n8n user (adjust as needed)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ai_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ai_user;
