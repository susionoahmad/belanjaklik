import { offlineDb } from '../../shared/db/offlineDb';
import type { ImportJob, ImportSession } from '../types';

class QueueWorkerManager {
  private activeJobs: Map<string, ImportJob> = new Map();

  async createSession(sourceType: any, fileNames: string[]): Promise<ImportSession> {
    const session: ImportSession = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      source_type: sourceType,
      uploaded_files: fileNames,
      total_products: 0,
      duplicated_products: 0,
      imported_products: 0,
      processing_status: 'Processing',
      created_at: new Date().toISOString()
    };

    const existingSessions = (await offlineDb.getItem<ImportSession[]>('psa_import_sessions')) || [];
    existingSessions.unshift(session);
    await offlineDb.setItem('psa_import_sessions', existingSessions);

    return session;
  }

  async createJob(sessionId: string): Promise<ImportJob> {
    const job: ImportJob = {
      id: `job_${Date.now()}`,
      session_id: sessionId,
      status: 'Processing',
      current_stage: 'Initializing Pipeline',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.activeJobs.set(job.id, job);
    const existingJobs = (await offlineDb.getItem<ImportJob[]>('psa_import_jobs')) || [];
    existingJobs.unshift(job);
    await offlineDb.setItem('psa_import_jobs', existingJobs);

    return job;
  }

  async updateJobStage(jobId: string, stageName: string, status: ImportJob['status'] = 'Processing'): Promise<void> {
    const jobs = (await offlineDb.getItem<ImportJob[]>('psa_import_jobs')) || [];
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx !== -1) {
      jobs[idx].current_stage = stageName;
      jobs[idx].status = status;
      jobs[idx].updated_at = new Date().toISOString();
      await offlineDb.setItem('psa_import_jobs', jobs);
    }
  }

  async finishSession(sessionId: string, total: number, duplicates: number, imported: number): Promise<void> {
    const sessions = (await offlineDb.getItem<ImportSession[]>('psa_import_sessions')) || [];
    const idx = sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) {
      sessions[idx].total_products = total;
      sessions[idx].duplicated_products = duplicates;
      sessions[idx].imported_products = imported;
      sessions[idx].processing_status = 'Completed';
      await offlineDb.setItem('psa_import_sessions', sessions);
    }
  }

  async getSessions(): Promise<ImportSession[]> {
    return (await offlineDb.getItem<ImportSession[]>('psa_import_sessions')) || [];
  }
}

export const queueWorker = new QueueWorkerManager();
