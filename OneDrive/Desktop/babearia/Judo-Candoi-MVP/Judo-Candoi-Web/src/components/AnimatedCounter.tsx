import { useCountUp } from "../hooks/useCountUp";

interface AnimatedCounterProps {
  label: string;
  value: string;
}

export function AnimatedCounter({ label, value }: AnimatedCounterProps) {
  const animatedValue = useCountUp(value);

  return (
    <article className="counter-card">
      <span className="counter-value">{animatedValue}</span>
      <span className="counter-label">{label}</span>
    </article>
  );
}
