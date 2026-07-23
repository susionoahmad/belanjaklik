import type { ImportDriver, SourceType } from '../types';

class DriverRegistryService {
  private drivers: Map<SourceType, ImportDriver> = new Map();

  registerDriver(driver: ImportDriver): void {
    this.drivers.set(driver.sourceType, driver);
    console.log(`[DriverRegistry] Registered driver for ${driver.sourceType}: ${driver.name}`);
  }

  getDriver(sourceType: SourceType): ImportDriver | undefined {
    return this.drivers.get(sourceType);
  }

  getAllDrivers(): ImportDriver[] {
    return Array.from(this.drivers.values());
  }
}

export const driverRegistry = new DriverRegistryService();
