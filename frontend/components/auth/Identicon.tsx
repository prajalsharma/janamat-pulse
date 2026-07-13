/**
 * Neutral identicon for the YOUR-wallet identity slot. Decorative: the address is
 * the accessible label, so the svg is aria-hidden.
 */
import { identiconCells, identiconHue } from '@/lib/identicon';

export function Identicon({
  address,
  size = 22,
  className = '',
}: {
  address: string;
  size?: number;
  className?: string;
}) {
  const hue = identiconHue(address);
  const cells = identiconCells(address);
  const bg = `hsl(${hue} 18% 20%)`;
  const fg = `hsl(${hue} 30% 66%)`;
  const cell = 100 / 5;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={`shrink-0 rounded-[5px] ${className}`}
      style={{ background: bg }}
    >
      {cells.flatMap((row, y) =>
        row.map((on, x) =>
          on ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell}
              y={y * cell}
              width={cell}
              height={cell}
              fill={fg}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
