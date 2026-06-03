# Line Graph / Graphify

Use this rule when you need to animate a line chart or graph in Remotion.

## Reference asset

The reference implementation is in `skills/remotion/rules/assets/charts-line-graph.tsx`.

## Key patterns

### Drawing the line progressively

Use a `spring()` driving a `progress` value (0 → 1), then slice the data array to only the drawn portion and interpolate the last segment for smooth drawing:

```tsx
const drawProgress = spring({
  frame: frame - 10,
  fps,
  config: {damping: 200, stiffness: 40, mass: 1},
  durationInFrames: 90,
});
```

Compute `drawn = progress * (data.length - 1)`, take `Math.floor(drawn)` full segments, and lerp the final partial segment.

### SVG coordinate helpers

```tsx
const scaleX = (index: number, total: number, chartWidth: number) =>
  (index / (total - 1)) * chartWidth;

const scaleY = (value: number, min: number, max: number, chartHeight: number) =>
  chartHeight - ((value - min) / (max - min)) * chartHeight;
```

### Filled area under the line

Close the path back to the bottom corners after the line path to create a filled area:

```tsx
const areaPath = `${linePath} L ${endX} ${chartHeight} L 0 ${chartHeight} Z`;
```

Use a low-opacity fill (e.g. `rgba(79,142,247,0.15)`) for subtlety.

### Animated dots

Pop each dot in with its own spring, staggered by index:

```tsx
const dotProgress = spring({
  frame: frame - 10 - (i / (data.length - 1)) * 90,
  fps,
  config: {damping: 14, stiffness: 200},
});
const r = 8 * dotProgress;
```

### Layout

Use explicit `PADDING` constants (`top`, `right`, `bottom`, `left`) and an SVG `<g transform="translate(...)">` to keep chart content inside the axes. Render axis lines, grid lines, and labels in the SVG. Place the title as an HTML overlay with `position: absolute`.
