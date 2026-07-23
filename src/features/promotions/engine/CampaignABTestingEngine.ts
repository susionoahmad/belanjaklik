import type { ABTestExperiment } from '../types/enterpriseTypes';

export class CampaignABTestingEngine {
  static evaluateExperiment(test: ABTestExperiment): ABTestExperiment {
    const ctrA = test.impressions_a > 0 ? (test.clicks_a / test.impressions_a) * 100 : 0;
    const ctrB = test.impressions_b > 0 ? (test.clicks_b / test.impressions_b) * 100 : 0;

    let winner: 'VARIANT_A' | 'VARIANT_B' | undefined = undefined;
    let reason = 'Memerlukan lebih banyak sampel tayangan/klik.';

    if (test.impressions_a + test.impressions_b >= 100) {
      if (ctrA > ctrB * 1.15) {
        winner = 'VARIANT_A';
        reason = `Varian A (${test.variant_a_name}) menghasilkan CTR lebih tinggi (${Math.round(ctrA * 10) / 10}% vs ${Math.round(ctrB * 10) / 10}%).`;
      } else if (ctrB > ctrA * 1.15) {
        winner = 'VARIANT_B';
        reason = `Varian B (${test.variant_b_name}) menghasilkan CTR lebih tinggi (${Math.round(ctrB * 10) / 10}% vs ${Math.round(ctrA * 10) / 10}%).`;
      } else {
        reason = 'Performa kedua varian relatif seimbang (Perbedaan < 15%).';
      }
    }

    return {
      ...test,
      ctr_a: Math.round(ctrA * 10) / 10,
      ctr_b: Math.round(ctrB * 10) / 10,
      winner_variant: winner,
      recommendation_reason: reason
    };
  }

  /**
   * Deterministically returns Variant A or Variant B for 50/50 A/B testing
   */
  static selectVariantForUser(test: ABTestExperiment, userId: string = 'guest'): 'A' | 'B' {
    const charCode = userId.charCodeAt(0) || 0;
    return charCode % 2 === 0 ? 'A' : 'B';
  }
}
