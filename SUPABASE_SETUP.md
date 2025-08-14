# Supabase Database Setup Guide

## Current Issue
The automatic database schema push is failing due to IPv6 connectivity issues in the current environment. You'll need to manually set up the database schema in your Supabase dashboard.

## Manual Setup Steps

### 1. Access Your Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in with your account
3. Select your project: `omxmgdmzdukhlnceqock`

### 2. Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New query"** to create a new SQL script

### 3. Create Database Schema
Copy and paste the following SQL code into the SQL Editor and click **"Run"**:

```sql
-- Create telegram_users table
CREATE TABLE telegram_users (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_bot BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bot_configurations table
CREATE TABLE bot_configurations (
    id SERIAL PRIMARY KEY,
    bot_token VARCHAR(500) UNIQUE NOT NULL,
    bot_username VARCHAR(255),
    webhook_url TEXT,
    is_webhook_enabled BOOLEAN DEFAULT false,
    welcome_message TEXT DEFAULT 'Welcome to OBS Control Bot! Use /help to see available commands.',
    admin_only_commands BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create obs_connections table
CREATE TABLE obs_connections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) DEFAULT 'localhost',
    port INTEGER DEFAULT 4455,
    password VARCHAR(255),
    is_connected BOOLEAN DEFAULT false,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scenes table
CREATE TABLE scenes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scene_id VARCHAR(255),
    obs_connection_id INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (obs_connection_id) REFERENCES obs_connections(id) ON DELETE CASCADE,
    UNIQUE(name, obs_connection_id)
);

-- Create sources table
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_id VARCHAR(255),
    source_type VARCHAR(255),
    scene_id INTEGER,
    obs_connection_id INTEGER NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    is_enabled BOOLEAN DEFAULT true,
    muted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (obs_connection_id) REFERENCES obs_connections(id) ON DELETE CASCADE,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE SET NULL,
    UNIQUE(name, obs_connection_id)
);

-- Create command_histories table
CREATE TABLE command_histories (
    id SERIAL PRIMARY KEY,
    command VARCHAR(255) NOT NULL,
    parameters TEXT,
    response TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    telegram_user_id INTEGER,
    execution_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (telegram_user_id) REFERENCES telegram_users(id) ON DELETE SET NULL
);

-- Create stream_sessions table
CREATE TABLE stream_sessions (
    id SERIAL PRIMARY KEY,
    stream_key VARCHAR(500),
    stream_url TEXT,
    is_streaming BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER,
    telegram_user_id INTEGER,
    obs_connection_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (telegram_user_id) REFERENCES telegram_users(id) ON DELETE SET NULL,
    FOREIGN KEY (obs_connection_id) REFERENCES obs_connections(id) ON DELETE CASCADE
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_telegram_users_updated_at BEFORE UPDATE ON telegram_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_configurations_updated_at BEFORE UPDATE ON bot_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_obs_connections_updated_at BEFORE UPDATE ON obs_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scenes_updated_at BEFORE UPDATE ON scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stream_sessions_updated_at BEFORE UPDATE ON stream_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_telegram_users_telegram_id ON telegram_users(telegram_id);
CREATE INDEX idx_telegram_users_is_active ON telegram_users(is_active);
CREATE INDEX idx_obs_connections_is_connected ON obs_connections(is_connected);
CREATE INDEX idx_scenes_obs_connection_id ON scenes(obs_connection_id);
CREATE INDEX idx_scenes_is_active ON scenes(is_active);
CREATE INDEX idx_sources_obs_connection_id ON sources(obs_connection_id);
CREATE INDEX idx_sources_scene_id ON sources(scene_id);
CREATE INDEX idx_sources_is_visible ON sources(is_visible);
CREATE INDEX idx_command_histories_status ON command_histories(status);
CREATE INDEX idx_command_histories_telegram_user_id ON command_histories(telegram_user_id);
CREATE INDEX idx_stream_sessions_is_streaming ON stream_sessions(is_streaming);
CREATE INDEX idx_stream_sessions_telegram_user_id ON stream_sessions(telegram_user_id);
CREATE INDEX idx_stream_sessions_obs_connection_id ON stream_sessions(obs_connection_id);

-- Insert default bot configuration
INSERT INTO bot_configurations (bot_token, bot_username, is_webhook_enabled) 
VALUES ('your_telegram_bot_token_here', 'your_bot_username_here', false);

-- Create RLS (Row Level Security) policies (optional, for production security)
ALTER TABLE telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE obs_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON telegram_users FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON telegram_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON telegram_users FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON bot_configurations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON bot_configurations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON bot_configurations FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON obs_connections FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON obs_connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON obs_connections FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON scenes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON scenes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON scenes FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON sources FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sources FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sources FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON command_histories FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON command_histories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON command_histories FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON stream_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON stream_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON stream_sessions FOR UPDATE USING (true);
```

### 4. Verify Schema Creation
After running the SQL script, you should see a success message. To verify the tables were created correctly:

1. In the left sidebar, click on **"Table Editor"**
2. You should see the following tables:
   - `telegram_users`
   - `bot_configurations`
   - `obs_connections`
   - `scenes`
   - `sources`
   - `command_histories`
   - `stream_sessions`

### 5. Update Environment File
Your `.env` file should already be configured with:
```
DATABASE_URL=postgresql://postgres:wJxY2fQO2foE96MQ@omxmgdmzdukhlnceqock.aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 6. Test the Connection
After setting up the schema, try to restart the development server to test the connection:

```bash
npm run dev
```

The server should now be able to connect to your Supabase database.

### 7. Update Bot Configuration
Once the database is set up, you'll need to:

1. Go to the web interface (usually http://localhost:3000)
2. Navigate to the **Bot Configuration** tab
3. Enter your Telegram bot token
4. Save the configuration

### 8. Troubleshooting

If you encounter any issues:

1. **Connection Errors**: Double-check your database URL in the `.env` file
2. **Permission Errors**: Ensure your database user has the necessary permissions
3. **Table Not Found**: Verify all tables were created successfully in the Table Editor
4. **SSL Issues**: Try adding `&sslmode=no-verify` to your database URL if you encounter SSL certificate issues

### 9. Alternative Connection URL Formats

If the current connection URL doesn't work, try these alternatives:

```
# Direct connection (if IPv6 is available)
DATABASE_URL=postgresql://postgres:wJxY2fQO2foE96MQ@db.omxmgdmzdukhlnceqock.supabase.co:5432/postgres?sslmode=require

# Connection pooler with different SSL settings
DATABASE_URL=postgresql://postgres:wJxY2fQO2foE96MQ@omxmgdmzdukhlnceqock.aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=no-verify

# Connection pooler without SSL (not recommended for production)
DATABASE_URL=postgresql://postgres:wJxY2fQO2foE96MQ@omxmgdmzdukhlnceqock.aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Next Steps

After successfully setting up the database schema:

1. Test the web interface functionality
2. Configure your Telegram bot token
3. Set up OBS connections
4. Test the OBS connection diagnostics
5. Deploy to production when ready

If you need any assistance with the setup process, please refer to the main documentation or check the diagnostic tools in the web interface.