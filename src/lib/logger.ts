import { db } from '@/lib/db';

export interface LogEntry {
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: 'BOT' | 'OBS' | 'DATABASE' | 'API' | 'SYSTEM' | 'WEBSOCKET';
  message: string;
  details?: any;
  userId?: number;
  sessionId?: string;
}

export class Logger {
  private static instance: Logger;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async log(entry: LogEntry): Promise<void> {
    try {
      await db.applicationLog.create({
        data: {
          level: entry.level,
          component: entry.component,
          message: entry.message,
          details: entry.details ? JSON.stringify(entry.details) : null,
          userId: entry.userId,
          sessionId: entry.sessionId || this.sessionId
        }
      });
    } catch (error) {
      // If database logging fails, at least log to console
      console.error('Failed to log to database:', error);
      console.log(`[${entry.level}] [${entry.component}] ${entry.message}`, entry.details || '');
    }
  }

  async debug(component: LogEntry['component'], message: string, details?: any, userId?: number): Promise<void> {
    await this.log({ level: 'DEBUG', component, message, details, userId });
  }

  async info(component: LogEntry['component'], message: string, details?: any, userId?: number): Promise<void> {
    await this.log({ level: 'INFO', component, message, details, userId });
  }

  async warn(component: LogEntry['component'], message: string, details?: any, userId?: number): Promise<void> {
    await this.log({ level: 'WARN', component, message, details, userId });
  }

  async error(component: LogEntry['component'], message: string, details?: any, userId?: number): Promise<void> {
    await this.log({ level: 'ERROR', component, message, details, userId });
  }

  async getLogs(options: {
    level?: LogEntry['level'];
    component?: LogEntry['component'];
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    userId?: number;
  } = {}): Promise<any[]> {
    const {
      level,
      component,
      limit = 100,
      offset = 0,
      startDate,
      endDate,
      userId
    } = options;

    const where: any = {};
    
    if (level) where.level = level;
    if (component) where.component = component;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    try {
      const logs = await db.applicationLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset
      });

      return logs.map(log => ({
        ...log,
        details: log.details ? JSON.parse(log.details) : null
      }));
    } catch (error) {
      console.error('Failed to retrieve logs:', error);
      return [];
    }
  }

  async getLogStats(): Promise<{
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByComponent: Record<string, number>;
    recentErrors: any[];
  }> {
    try {
      const [totalLogs, logsByLevel, logsByComponent, recentErrors] = await Promise.all([
        db.applicationLog.count(),
        db.applicationLog.groupBy({
          by: ['level'],
          _count: { level: true }
        }),
        db.applicationLog.groupBy({
          by: ['component'],
          _count: { component: true }
        }),
        db.applicationLog.findMany({
          where: { level: 'ERROR' },
          orderBy: { created_at: 'desc' },
          take: 10
        })
      ]);

      return {
        totalLogs,
        logsByLevel: logsByLevel.reduce((acc, item) => {
          acc[item.level] = item._count.level;
          return acc;
        }, {} as Record<string, number>),
        logsByComponent: logsByComponent.reduce((acc, item) => {
          acc[item.component] = item._count.component;
          return acc;
        }, {} as Record<string, number>),
        recentErrors: recentErrors.map(log => ({
          ...log,
          details: log.details ? JSON.parse(log.details) : null
        }))
      };
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return {
        totalLogs: 0,
        logsByLevel: {},
        logsByComponent: {},
        recentErrors: []
      };
    }
  }

  async clearLogs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db.applicationLog.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate
          }
        }
      });

      return result.count;
    } catch (error) {
      console.error('Failed to clear logs:', error);
      return 0;
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const logger = Logger.getInstance();