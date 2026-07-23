import { offlineDb } from '../../shared/db/offlineDb';
import type { AuditRecord } from '../types';

class AuditTrailManager {
  private records: AuditRecord[] = [];

  async logStage(sessionId: string, stageName: string, inputState: any, outputState: any): Promise<AuditRecord> {
    const record: AuditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      session_id: sessionId,
      stage_name: stageName,
      input_state: JSON.parse(JSON.stringify(inputState)),
      output_state: JSON.parse(JSON.stringify(outputState)),
      timestamp: new Date().toISOString()
    };

    this.records.unshift(record);
    const existing = (await offlineDb.getItem<AuditRecord[]>('psa_import_audit')) || [];
    existing.unshift(record);
    await offlineDb.setItem('psa_import_audit', existing.slice(0, 200)); // Keep recent 200 records

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
