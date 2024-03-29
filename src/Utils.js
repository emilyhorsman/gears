import { useEffect, useRef } from "react";

export const RatioFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const GearInchesFormatter = new Intl.NumberFormat(undefined, {
  maximumSignificantDigits: 3,
  minimumSignificantDigits: 3,
});

export const SpeedFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer-per-hour",
  maximumFractionDigits: 1,
});

export const PercentageFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 0,
});

export function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
