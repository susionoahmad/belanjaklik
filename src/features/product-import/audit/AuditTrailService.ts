import { offlineDb } from '../../shared/db/offlineDb';
import type { AuditRecord } from '../types';

class AuditTrailManager {
  private records: AuditRecord[] = [];

  async logStage(sessionId: string, stageName: string, inputState: any, outputState: any): Promise<AuditRecord> {
    let safeInput = {};
    let safeOutput = {};
    try { safeInput = JSON.parse(JSON.stringify(inputState)); } catch { safeInput = { summary: String(inputState) }; }
    try { safeOutput = JSON.parse(JSON.stringify(outputState)); } catch { safeOutput = { summary: String(outputState) }; }

    const record: AuditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      session_id: sessionId,
      stage_name: stageName,
      input_state: safeInput,
      output_state: safeOutput,
      timestamp: new Date().toISOString()
    };

    this.records.unshift(record);
    try {
      const existing = (await offlineDb.getItem<AuditRecord[]>('psa_import_audit')) || [];
      existing.unshift(record);
      await offlineDb.setItem('psa_import_audit', existing.slice(0, 200)); // Keep recent 200 records
    } catch (err) {}

    return record;
  }

  async getSessionAuditTrail(sessionId: string): Promise<AuditRecord[]> {
    const existing = (await offlineDb.getItem<AuditRecord[]>('psa_import_audit')) || [];
    return existing.filter(r => r.session_id === sessionId);
  }

  async getAllAuditRecords(): Promise<AuditRecord[]> {
    return (await offlineDb.getItem<AuditRecord[]>('psa_import_audit')) || [];
  }
}

export const auditTrailService = new AuditTrailManager();
