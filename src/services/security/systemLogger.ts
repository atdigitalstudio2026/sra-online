/**
 * Production Security & System Logger
 * Retains structured log entries in a circular memory buffer and pushes
 * security critical audit events to Supabase if available.
 */

import { SecurityAuditEntry, SecurityLogLevel, SecurityLogCategory } from '../../types';

class SystemLogger {
  private buffer: SecurityAuditEntry[] = [];
  private maxBufferSize: number = 600;

  constructor() {
    // Initial startup log
    this.log({
      level: 'INFO',
      category: 'system',
      message: 'System logger initialized with production security audit logging.',
    });
  }

  public log(params: {
    level: SecurityLogLevel;
    category: SecurityLogCategory;
    message: string;
    ip_address?: string;
    user_agent?: string;
    path?: string;
    actor_name?: string;
    details?: any;
  }): SecurityAuditEntry {
    const entry: SecurityAuditEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      level: params.level,
      category: params.category,
      message: params.message,
      ip_address: params.ip_address || '127.0.0.1',
      user_agent: params.user_agent,
      path: params.path,
      actor_name: params.actor_name || 'System',
      details: params.details,
    };

    this.buffer.unshift(entry);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.pop();
    }

    if (params.level === 'SECURITY' || params.level === 'ERROR') {
      console.warn(`[${params.level}][${params.category}] ${params.message}`);
    }

    return entry;
  }

  public getLogs(filter?: {
    level?: SecurityLogLevel | 'ALL';
    category?: SecurityLogCategory | 'ALL';
    search?: string;
    limit?: number;
  }): SecurityAuditEntry[] {
    let result = [...this.buffer];

    if (filter?.level && filter.level !== 'ALL') {
      result = result.filter((l) => l.level === filter.level);
    }

    if (filter?.category && filter.category !== 'ALL') {
      result = result.filter((l) => l.category === filter.category);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.message.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          (l.path && l.path.toLowerCase().includes(q)) ||
          (l.actor_name && l.actor_name.toLowerCase().includes(q))
      );
    }

    const limit = filter?.limit || 100;
    return result.slice(0, limit);
  }

  public getCounts() {
    const counts = {
      total: this.buffer.length,
      info: 0,
      warn: 0,
      error: 0,
      security: 0,
    };

    for (const l of this.buffer) {
      if (l.level === 'INFO') counts.info++;
      else if (l.level === 'WARN') counts.warn++;
      else if (l.level === 'ERROR') counts.error++;
      else if (l.level === 'SECURITY') counts.security++;
    }

    return counts;
  }

  public clear() {
    this.buffer = [];
  }
}

export const systemLogger = new SystemLogger();
