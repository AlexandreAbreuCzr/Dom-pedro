import { useEffect, useMemo, useState } from "react";

interface ParsedValue {
  hasNumericValue: boolean;
  prefix: string;
  target: number;
}

function parseCounterValue(value: string): ParsedValue {
  const hasNumericValue = /\d/.test(value);

  if (!hasNumericValue) {
    return {
      hasNumericValue: false,
      prefix: "",
      target: 0
    };
  }

  const prefix = value.trim().startsWith("+") ? "+" : "";
  const target = Number.parseInt(value.replace(/\D/g, ""), 10);

  return {
    hasNumericValue: true,
    prefix,
    target: Number.isNaN(target) ? 0 : target
  };
}

export function useCountUp(value: string, duration = 1600): string {
  const parsedValue = useMemo(() => parseCounterValue(value), [value]);
  const [currentValue, setCurrentValue] = useState(parsedValue.target);

  useEffect(() => {
    if (!parsedValue.hasNumericValue) {
      return;
    }

    const start = performance.now();
    let frame = 0;

    const animate = (timestamp: number): void => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentValue(Math.round(eased * parsedValue.target));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [duration, parsedValue]);

  if (!parsedValue.hasNumericValue) {
    return value;
  }

  return `${parsedValue.prefix}${currentValue.toLocaleString("pt-BR")}`;
}
