import type { PromotionRule } from '../types/enterpriseTypes';

export interface PromotionRuleEvaluationResult {
  isEligible: boolean;
  reason?: string;
  failedRules: string[];
}

export interface RuleEvaluationContext {
  cartSubtotal: number;
  isMember: boolean;
  userRegion?: string;
  paymentMethod?: string;
  customerSegment?: string;
  redemptionCount?: number;
  currentHHMM?: string;
}

export class PromotionRulesEngine {
  static evaluateRules(
    rule: Partial<PromotionRule>,
    context: RuleEvaluationContext
  ): PromotionRuleEvaluationResult {
    const failedRules: string[] = [];

    // 1. Minimum Purchase Amount Check
    if (rule.min_purchase_amount && context.cartSubtotal < rule.min_purchase_amount) {
      failedRules.push(`Minimal belanja Rp ${rule.min_purchase_amount.toLocaleString('id-ID')} (Subtotal Anda: Rp ${context.cartSubtotal.toLocaleString('id-ID')})`);
    }

    // 2. Member Only Check
    if (rule.member_only && !context.isMember) {
      failedRules.push('Khusus untuk member terdaftar Toko Saya');
    }

    // 3. Allowed Regions Check
    if (rule.allowed_regions && rule.allowed_regions.length > 0 && context.userRegion) {
      if (!rule.allowed_regions.includes(context.userRegion)) {
        failedRules.push(`Hanya berlaku untuk area ${rule.allowed_regions.join(', ')}`);
      }
    }

    // 4. Payment Methods Check
    if (rule.payment_methods && rule.payment_methods.length > 0 && context.paymentMethod) {
      if (!rule.payment_methods.includes(context.paymentMethod)) {
        failedRules.push(`Hanya berlaku untuk metode pembayaran ${rule.payment_methods.join(', ')}`);
      }
    }

    // 5. Customer Segment Check
    if (rule.customer_segments && rule.customer_segments.length > 0 && context.customerSegment) {
      if (!rule.customer_segments.includes(context.customerSegment)) {
        failedRules.push(`Hanya berlaku untuk segmen pelanggan ${rule.customer_segments.join(', ')}`);
      }
    }

    // 6. Time Window (Happy Hour) Check
    if (rule.time_window_start && rule.time_window_end && context.currentHHMM) {
      if (context.currentHHMM < rule.time_window_start || context.currentHHMM > rule.time_window_end) {
        failedRules.push(`Promo jam khusus hanya berlaku antara pukul ${rule.time_window_start} - ${rule.time_window_end}`);
      }
    }

    // 7. Maximum Redemptions Limit Check
    if (
      rule.max_redemptions !== undefined &&
      rule.max_redemptions > 0 &&
      rule.current_redemptions !== undefined &&
      rule.current_redemptions >= rule.max_redemptions
    ) {
      failedRules.push('Kuota voucher promo telah habis');
    }

    // 8. Per Customer Limit Check
    if (
      rule.per_customer_limit !== undefined &&
      context.redemptionCount !== undefined &&
      context.redemptionCount >= rule.per_customer_limit
    ) {
      failedRules.push(`Batas maksimal penggunaan per pelanggan (${rule.per_customer_limit}x) telah tercapai`);
    }

    const isEligible = failedRules.length === 0;
    return {
      isEligible,
      reason: isEligible ? undefined : failedRules.join(' • '),
      failedRules
    };
  }
}

