import { dataService } from '../../shared/db/dataService';
import { offlineDb } from '../../shared/db/offlineDb';
import type { CatalogVersion } from '../types';
import type { Product } from '../../shared/types';
import { ImportEventBus } from '../events/ImportEventBus';

class CatalogVersioningManager {
  async createSnapshot(description: string, createdBy = 'Admin'): Promise<CatalogVersion> {
    const currentProducts = await dataService.fetchProducts();
    const existingVersions = (await offlineDb.getItem<CatalogVersion[]>('psa_catalog_versions')) || [];
    const nextVersionNumber = existingVersions.length > 0 ? Math.max(...existingVersions.map(v => v.version_number)) + 1 : 1;

    const version: CatalogVersion = {
      id: `ver_${Date.now()}`,
      version_number: nextVersionNumber,
      description,
      snapshot_data: JSON.parse(JSON.stringify(currentProducts)),
      created_by: createdBy,
      created_at: new Date().toISOString()
    };

    existingVersions.unshift(version);
    await offlineDb.setItem('psa_catalog_versions', existingVersions);

    return version;
  }

  async getVersions(): Promise<CatalogVersion[]> {
    return (await offlineDb.getItem<CatalogVersion[]>('psa_catalog_versions')) || [];
  }

  async rollbackToVersion(versionId: string): Promise<boolean> {
    const versions = await this.getVersions();
    const targetVersion = versions.find(v => v.id === versionId);

    if (!targetVersion) {
      console.error(`[CatalogVersioning] Version ${versionId} not found`);
      return false;
    }

    // Save current catalog state to offlineDb products table
    await offlineDb.setProducts(targetVersion.snapshot_data);
    ImportEventBus.emit('CatalogRollback', { version: targetVersion });
    ImportEventBus.emit('CatalogUpdated', { source: 'rollback', count: targetVersion.snapshot_data.length });

    return true;
  }
}

export const catalogVersioningService = new CatalogVersioningManager();
