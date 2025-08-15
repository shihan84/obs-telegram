import { PrismaClient } from '@prisma/client';

// Create a Prisma client with specific configuration to avoid prepared statement issues
const prisma = new PrismaClient({
  log: ['error', 'warn'],
  // Disable prepared statements to avoid the "already exists" issue
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL!
    }
  }
});

// Wrapper functions that use raw queries to avoid prepared statement issues
export const dbRaw = {
  // Bot configuration
  async getBotConfig() {
    try {
      const result = await prisma.$queryRaw`
        SELECT id, bot_token, bot_username, webhook_url, is_webhook_enabled, 
               welcome_message, admin_only_commands, created_at, updated_at
        FROM bot_configurations 
        LIMIT 1
      `;
      return result[0] || null;
    } catch (error) {
      console.error('Error getting bot config:', error);
      return null;
    }
  },

  async upsertBotConfig(data: { bot_token: string; bot_username?: string; welcome_message?: string }) {
    try {
      await prisma.$queryRaw`
        INSERT INTO bot_configurations (id, bot_token, bot_username, welcome_message, admin_only_commands, created_at, updated_at)
        VALUES (1, ${data.bot_token}, ${data.bot_username || null}, ${data.welcome_message || null}, true, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          bot_token = EXCLUDED.bot_token,
          bot_username = EXCLUDED.bot_username,
          welcome_message = EXCLUDED.welcome_message,
          updated_at = NOW()
      `;
      return true;
    } catch (error) {
      console.error('Error upserting bot config:', error);
      return false;
    }
  },

  // OBS Connections
  async getOBSConnections() {
    try {
      const result = await prisma.$queryRaw`
        SELECT id, name, host, port, password, is_connected, last_connected_at, created_at, updated_at
        FROM obs_connections 
        ORDER BY created_at DESC
      `;
      return result;
    } catch (error) {
      console.error('Error getting OBS connections:', error);
      return [];
    }
  },

  async createOBSConnection(data: { name: string; host: string; port: number; password?: string }) {
    try {
      const result = await prisma.$queryRaw`
        INSERT INTO obs_connections (name, host, port, password, is_connected, created_at, updated_at)
        VALUES (${data.name}, ${data.host}, ${data.port}, ${data.password || null}, false, NOW(), NOW())
        RETURNING id
      `;
      return result[0]?.id;
    } catch (error) {
      console.error('Error creating OBS connection:', error);
      return null;
    }
  },

  // Users
  async getUserCount() {
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM telegram_users`;
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  },

  async getActiveUserCount() {
    try {
      const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM telegram_users WHERE is_active = true`;
      return parseInt(result[0]?.count || '0');
    } catch (error) {
      console.error('Error getting active user count:', error);
      return 0;
    }
  },

  // General cleanup
  async disconnect() {
    await prisma.$disconnect();
  }
};

export { prisma };