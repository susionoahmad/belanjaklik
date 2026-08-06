import { reactive } from 'vue';
import type { FeatureFlags } from '../types';

class FeatureFlagManager {
  public flags = reactive<FeatureFlags>({
    geminiVision: true,
    googleVision: false,
    embeddingMatcher: true,
    autoCategory: true,
    translationPlugin: false,
    backgroundRemoval: true,
    autoDeduplication: true
  });

  setFlag(key: keyof FeatureFlags, value: boolean): void {
    this.flags[key] = value;
    console.log(`[FeatureFlagService] ${key} updated to ${value}`);
  }

  is(key: keyof FeatureFlags): boolean {
    return !!this.flags[key];
  }
}

export const featureFlagService = new FeatureFlagManager();
