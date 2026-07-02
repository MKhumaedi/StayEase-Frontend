export interface PricingBreakdown {
  nightlyRate: number;
  nights: number;
  subtotal: number;
  cleaningFee: number;
  serviceFee: number;
  tax: number;
  taxes: number; // For compatibility
  seasonalAdjustment: number;
  total: number;
}

export function getDatesBetween(startDateStr: string, endDateStr: string): string[] {
  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
    return [startDateStr];
  }
  const dates: string[] = [];
  const curr = new Date(start);
  while (curr < end) {
    const yyyy = curr.getFullYear();
    const mm = String(curr.getMonth() + 1).padStart(2, '0');
    const dd = String(curr.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

export const PricingService = {
  calculateQuote(
    property: {
      basePrice?: number | string;
      cleaningFee?: number | string;
      serviceFee?: number | string;
      peakSeasonRates?: Array<{
        startDate: string;
        endDate: string;
        rateMultiplier: number | string;
        roomId?: string | null;
        adjustmentType?: string;
        adjustmentValue?: number | string;
      }>;
    },
    room: {
      id?: string;
      basePrice?: number | string;
      availabilities?: Array<{
        date: string;
        priceOverride?: number | null;
        isBlocked?: boolean;
      }>;
    } | null | undefined,
    startDateStr: string,
    endDateStr: string
  ): PricingBreakdown {
    const baseNightlyRate = room
      ? Number(room.basePrice || 0)
      : Number(property.basePrice || 0);

    const dates = getDatesBetween(startDateStr, endDateStr);
    const nights = dates.length;

    const overrides = room?.availabilities || [];
    const peakRates = property.peakSeasonRates || [];

    let subtotal = 0;
    let seasonalAdjustment = 0;

    for (const dateStr of dates) {
      let nightRate = baseNightlyRate;

      // 1. Check availability overrides
      const override = overrides.find((o) => o.date === dateStr);
      if (override?.priceOverride !== null && override?.priceOverride !== undefined) {
        nightRate = Number(override.priceOverride);
      } else {
        // 2. Check peak rates
        const matchingPeaks = peakRates.filter((p) => dateStr >= p.startDate && dateStr <= p.endDate);
        if (matchingPeaks.length > 0) {
          const roomPeak = room?.id ? matchingPeaks.find((p) => p.roomId === room.id) : null;
          const defaultPeak = matchingPeaks.find((p) => !p.roomId);
          const chosenPeak = roomPeak || defaultPeak || matchingPeaks[0];

          if (chosenPeak) {
            if (chosenPeak.adjustmentType === 'FIXED_AMOUNT_INCREASE') {
              nightRate = baseNightlyRate + Number(chosenPeak.adjustmentValue);
            } else {
              nightRate = Math.round(baseNightlyRate * Number(chosenPeak.rateMultiplier));
            }
          }
        }
      }

      subtotal += nightRate;
      seasonalAdjustment += nightRate - baseNightlyRate;
    }

    const cleaningFee = property.cleaningFee !== undefined ? Number(property.cleaningFee) : 0;
    const serviceFee = property.serviceFee !== undefined ? Number(property.serviceFee) : 0;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + cleaningFee + serviceFee + tax;

    return {
      nightlyRate: baseNightlyRate,
      nights,
      subtotal,
      cleaningFee,
      serviceFee,
      tax,
      taxes: tax,
      seasonalAdjustment,
      total,
    };
  },
};
