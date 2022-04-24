export const RatioFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const SpeedFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer-per-hour",
  maximumFractionDigits: 1,
});

export const PercentageFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});
