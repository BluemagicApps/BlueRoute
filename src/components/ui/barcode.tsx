import { code128Bars } from "@/lib/barcode";

/** Crisp SVG Code 128 barcode with the value printed underneath. */
export function Barcode({
  value,
  height = 64,
  moduleWidth = 2,
}: {
  value: string;
  height?: number;
  moduleWidth?: number;
}) {
  const bars = code128Bars(value);
  const totalModules = bars.reduce((a, b) => a + b, 0);
  const quiet = 10; // quiet zone, modules
  const width = (totalModules + quiet * 2) * moduleWidth;

  let x = quiet * moduleWidth;
  const rects: { x: number; w: number }[] = [];
  bars.forEach((w, i) => {
    const wpx = w * moduleWidth;
    if (i % 2 === 0) rects.push({ x, w: wpx }); // even indices are bars
    x += wpx;
  });

  return (
    <figure className="inline-flex flex-col items-center" aria-label={`Barcode ${value}`}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        className="max-w-full"
        shapeRendering="crispEdges"
      >
        <rect width={width} height={height} fill="#ffffff" />
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={0} width={r.w} height={height} fill="#0b1b2b" />
        ))}
      </svg>
      <figcaption className="mt-2 font-mono text-sm tracking-[0.35em] text-foam">
        {value}
      </figcaption>
    </figure>
  );
}
