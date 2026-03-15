/**
 * Structured Agent Logger
 * 
 * Produces agent_log.json conforming to the DevSpot Agent specification.
 * Logs all decisions, tool calls, retries, failures, and outputs
 * for full verifiability of autonomous operation.
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface LogEntry {
  timestamp: string;
  type: 'decision' | 'tool_call' | 'error' | 'safety_check' | 'execution' | 'verification';
  action: string;
  data: Record<string, any>;
  durationMs?: number;
}

interface AgentLogFile {
  agent: {
    name: string;
    version: string;
    erc8004: string;
    startedAt: string;
  };
  summary: {
    totalDecisions: number;
    totalToolCalls: number;
    totalErrors: number;
    totalTradesExecuted: number;
    totalTradesRejected: number;
    totalValueMovedUsd: number;
    uptimeMs: number;
  };
  entries: LogEntry[];
}

export class AgentLog {
  private logFile: AgentLogFile;
  private outputPath: string;
  private startTime: number;

  constructor(outputDir: string = '.') {
    this.startTime = Date.now();
    this.outputPath = join(outputDir, 'agent_log.json');

    // Load existing log or create new one
    if (existsSync(this.outputPath)) {
      try {
        const existing = JSON.parse(readFileSync(this.outputPath, 'utf-8'));
        this.logFile = existing;
        this.startTime = new Date(existing.agent.startedAt).getTime();
      } catch {
        this.logFile = this.createNewLog();
      }
    } else {
      this.logFile = this.createNewLog();
    }
  }

  private createNewLog(): AgentLogFile {
    return {
      agent: {
        name: 'Ghost Protocol',
        version: '1.0.0',
        erc8004: '040f2f50c2e942808ee11f25a3bb8996',
        startedAt: new Date().toISOString(),
      },
      summary: {
        totalDecisions: 0,
        totalToolCalls: 0,
        totalErrors: 0,
        totalTradesExecuted: 0,
        totalTradesRejected: 0,
        totalValueMovedUsd: 0,
        uptimeMs: 0,
      },
      entries: [],
    };
  }

  private addEntry(entry: LogEntry): void {
    this.logFile.entries.push(entry);
    this.logFile.summary.uptimeMs = Date.now() - this.startTime;
    this.save();
  }

  logDecision(action: string, data: Record<string, any>): void {
    this.logFile.summary.totalDecisions++;
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'decision',
      action,
      data,
    });
  }

  logToolCall(tool: string, data: Record<string, any>, durationMs?: number): void {
    this.logFile.summary.totalToolCalls++;
    if (data.error) {
      this.logFile.summary.totalErrors++;
    }
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'tool_call',
      action: tool,
      data,
      durationMs,
    });
  }

  logExecution(action: string, data: Record<string, any> & { 
    txHash?: string; 
    valueUsd?: number;
    success: boolean;
  }): void {
    if (data.success) {
      this.logFile.summary.totalTradesExecuted++;
      if (data.valueUsd) {
        this.logFile.summary.totalValueMovedUsd += data.valueUsd;
      }
    } else {
      this.logFile.summary.totalTradesRejected++;
    }
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'execution',
      action,
      data,
    });
  }

  logSafetyCheck(action: string, data: Record<string, any>): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'safety_check',
      action,
      data,
    });
  }

  logVerification(action: string, data: Record<string, any>): void {
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'verification',
      action,
      data,
    });
  }

  logError(action: string, error: Error | string, data?: Record<string, any>): void {
    this.logFile.summary.totalErrors++;
    this.addEntry({
      timestamp: new Date().toISOString(),
      type: 'error',
      action,
      data: {
        ...data,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
  }

  getSummary(): AgentLogFile['summary'] {
    return { ...this.logFile.summary };
  }

  getEntryCount(): number {
    return this.logFile.entries.length;
  }

  private save(): void {
    try {
      writeFileSync(this.outputPath, JSON.stringify(this.logFile, null, 2));
    } catch (error) {
      console.error('Failed to save agent log:', error);
    }
  }
}
