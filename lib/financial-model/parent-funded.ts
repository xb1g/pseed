export type ParentFundedAssumptions = {
  completedFreePlans: number;
  freeToTrialRate: number;
  trialToSprintRate: number;
  sprintRepeatRate: number;
  trialPrice: number;
  sprintPrice: number;
  returningSprintPrice: number;
  trialDirectCost: number;
  sprintDirectCost: number;
  paidTrialCac: number;
  monthlyFixedBusinessCost: number;
  monthlyFounderDraw: number;
  cohortSize: number;
};

export type ParentFundedModel = {
  assumptions: ParentFundedAssumptions;
  funnel: {
    completedFreePlans: number;
    paidTrials: number;
    firstSprintSeats: number;
    repeatSprintSeats: number;
  };
  revenue: {
    trials: number;
    firstSprintUpgrades: number;
    repeatSprints: number;
    total: number;
  };
  costs: {
    trialDelivery: number;
    firstSprintDelivery: number;
    repeatSprintDelivery: number;
    directDelivery: number;
    acquisition: number;
    annualFixedBusiness: number;
    annualFounderDraw: number;
  };
  grossContribution: number;
  grossContributionMargin: number;
  contributionAfterAcquisition: number;
  operatingResult: number;
  unitEconomics: {
    trialContribution: number;
    sprintContribution: number;
    revenuePerPaidTrialFamily: number;
    breakEvenSprintSeatsPerMonth: number;
    averageSprintSeatsPerMonth: number;
    cohortRevenue: number;
    cohortDirectCost: number;
    cohortContribution: number;
  };
};

export const DEFAULT_PARENT_FUNDED_ASSUMPTIONS: ParentFundedAssumptions = {
  completedFreePlans: 20_000,
  freeToTrialRate: 3,
  trialToSprintRate: 30,
  sprintRepeatRate: 30,
  trialPrice: 1_490,
  sprintPrice: 5_900,
  returningSprintPrice: 4_900,
  trialDirectCost: 450,
  sprintDirectCost: 2_100,
  paidTrialCac: 600,
  monthlyFixedBusinessCost: 35_000,
  monthlyFounderDraw: 40_000,
  cohortSize: 20,
};

function finiteNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizedRate(value: number): number {
  return Math.min(100, finiteNonNegative(value));
}

export function normalizeParentFundedAssumptions(
  assumptions: ParentFundedAssumptions,
): ParentFundedAssumptions {
  return {
    completedFreePlans: finiteNonNegative(assumptions.completedFreePlans),
    freeToTrialRate: normalizedRate(assumptions.freeToTrialRate),
    trialToSprintRate: normalizedRate(assumptions.trialToSprintRate),
    sprintRepeatRate: normalizedRate(assumptions.sprintRepeatRate),
    trialPrice: finiteNonNegative(assumptions.trialPrice),
    sprintPrice: finiteNonNegative(assumptions.sprintPrice),
    returningSprintPrice: finiteNonNegative(assumptions.returningSprintPrice),
    trialDirectCost: finiteNonNegative(assumptions.trialDirectCost),
    sprintDirectCost: finiteNonNegative(assumptions.sprintDirectCost),
    paidTrialCac: finiteNonNegative(assumptions.paidTrialCac),
    monthlyFixedBusinessCost: finiteNonNegative(assumptions.monthlyFixedBusinessCost),
    monthlyFounderDraw: finiteNonNegative(assumptions.monthlyFounderDraw),
    cohortSize: Math.max(1, Math.round(finiteNonNegative(assumptions.cohortSize))),
  };
}

function percentageOf(value: number, rate: number): number {
  return Math.round(value * (rate / 100));
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export function calculateParentFundedModel(
  rawAssumptions: ParentFundedAssumptions,
): ParentFundedModel {
  const assumptions = normalizeParentFundedAssumptions(rawAssumptions);
  const paidTrials = percentageOf(
    assumptions.completedFreePlans,
    assumptions.freeToTrialRate,
  );
  const firstSprintSeats = percentageOf(paidTrials, assumptions.trialToSprintRate);
  const repeatSprintSeats = percentageOf(firstSprintSeats, assumptions.sprintRepeatRate);

  const trialsRevenue = paidTrials * assumptions.trialPrice;
  const firstSprintUpgradeRevenue =
    firstSprintSeats * Math.max(0, assumptions.sprintPrice - assumptions.trialPrice);
  const repeatSprintRevenue = repeatSprintSeats * assumptions.returningSprintPrice;
  const totalRevenue = trialsRevenue + firstSprintUpgradeRevenue + repeatSprintRevenue;

  const trialDelivery = paidTrials * assumptions.trialDirectCost;
  const firstSprintDelivery =
    firstSprintSeats *
    Math.max(0, assumptions.sprintDirectCost - assumptions.trialDirectCost);
  const repeatSprintDelivery = repeatSprintSeats * assumptions.sprintDirectCost;
  const directDelivery = trialDelivery + firstSprintDelivery + repeatSprintDelivery;
  const acquisition = paidTrials * assumptions.paidTrialCac;
  const annualFixedBusiness = assumptions.monthlyFixedBusinessCost * 12;
  const annualFounderDraw = assumptions.monthlyFounderDraw * 12;

  const grossContribution = totalRevenue - directDelivery;
  const contributionAfterAcquisition = grossContribution - acquisition;
  const operatingResult =
    contributionAfterAcquisition - annualFixedBusiness - annualFounderDraw;
  const sprintContribution = assumptions.sprintPrice - assumptions.sprintDirectCost;
  const monthlyFixedBurn =
    assumptions.monthlyFixedBusinessCost + assumptions.monthlyFounderDraw;

  return {
    assumptions,
    funnel: {
      completedFreePlans: Math.round(assumptions.completedFreePlans),
      paidTrials,
      firstSprintSeats,
      repeatSprintSeats,
    },
    revenue: {
      trials: trialsRevenue,
      firstSprintUpgrades: firstSprintUpgradeRevenue,
      repeatSprints: repeatSprintRevenue,
      total: totalRevenue,
    },
    costs: {
      trialDelivery,
      firstSprintDelivery,
      repeatSprintDelivery,
      directDelivery,
      acquisition,
      annualFixedBusiness,
      annualFounderDraw,
    },
    grossContribution,
    grossContributionMargin: safeRatio(grossContribution, totalRevenue) * 100,
    contributionAfterAcquisition,
    operatingResult,
    unitEconomics: {
      trialContribution: assumptions.trialPrice - assumptions.trialDirectCost,
      sprintContribution,
      revenuePerPaidTrialFamily: safeRatio(totalRevenue, paidTrials),
      breakEvenSprintSeatsPerMonth:
        sprintContribution > 0 ? Math.ceil(monthlyFixedBurn / sprintContribution) : 0,
      averageSprintSeatsPerMonth: (firstSprintSeats + repeatSprintSeats) / 12,
      cohortRevenue: assumptions.sprintPrice * assumptions.cohortSize,
      cohortDirectCost: assumptions.sprintDirectCost * assumptions.cohortSize,
      cohortContribution: sprintContribution * assumptions.cohortSize,
    },
  };
}

const currencyFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const countFormatter = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatThaiCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCount(value: number): string {
  return countFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}
