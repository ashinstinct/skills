import {loadFont} from '@remotion/google-fonts/Inter';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

const {fontFamily} = loadFont();

const COLOR_LINE = '#4F8EF7';
const COLOR_DOT = '#ffffff';
const COLOR_DOT_BORDER = '#4F8EF7';
const COLOR_AREA = 'rgba(79,142,247,0.15)';
const COLOR_TEXT = '#ffffff';
const COLOR_MUTED = '#888888';
const COLOR_BG = '#0a0a0a';
const COLOR_AXIS = '#333333';
const COLOR_GRID = '#1a1a1a';

// Ideal composition size: 1280x720

const PADDING = {top: 80, right: 60, bottom: 100, left: 80};

type DataPoint = {label: string; value: number};

const scaleY = (
	value: number,
	min: number,
	max: number,
	chartHeight: number,
) => {
	return chartHeight - ((value - min) / (max - min)) * chartHeight;
};

const scaleX = (index: number, total: number, chartWidth: number) => {
	return (index / (total - 1)) * chartWidth;
};

const buildLinePath = (
	data: DataPoint[],
	min: number,
	max: number,
	chartWidth: number,
	chartHeight: number,
	progress: number,
) => {
	const totalLength = data.length - 1;
	const drawn = progress * totalLength;
	const drawnInt = Math.floor(drawn);
	const drawnFrac = drawn - drawnInt;

	const points = data.slice(0, drawnInt + 2).map((d, i) => ({
		x: scaleX(i, data.length, chartWidth),
		y: scaleY(d.value, min, max, chartHeight),
	}));

	if (points.length < 2) return '';

	let d = `M ${points[0].x} ${points[0].y}`;
	for (let i = 1; i < points.length - 1; i++) {
		d += ` L ${points[i].x} ${points[i].y}`;
	}

	const last = points[points.length - 1];
	const prev = points[points.length - 2];
	const cx = prev.x + (last.x - prev.x) * drawnFrac;
	const cy = prev.y + (last.y - prev.y) * drawnFrac;
	d += ` L ${cx} ${cy}`;

	return d;
};

const buildAreaPath = (
	linePath: string,
	chartWidth: number,
	chartHeight: number,
	data: DataPoint[],
	progress: number,
) => {
	if (!linePath) return '';
	const totalLength = data.length - 1;
	const drawn = progress * totalLength;
	const drawnInt = Math.floor(drawn);
	const drawnFrac = drawn - drawnInt;

	const endX =
		scaleX(drawnInt, data.length, chartWidth) +
		(scaleX(drawnInt + 1, data.length, chartWidth) -
			scaleX(drawnInt, data.length, chartWidth)) *
			drawnFrac;

	return `${linePath} L ${endX} ${chartHeight} L 0 ${chartHeight} Z`;
};

export const MyAnimation = () => {
	const frame = useCurrentFrame();
	const {fps, width, height} = useVideoConfig();

	const data: DataPoint[] = [
		{label: 'Jan', value: 420},
		{label: 'Feb', value: 580},
		{label: 'Mar', value: 510},
		{label: 'Apr', value: 720},
		{label: 'May', value: 690},
		{label: 'Jun', value: 850},
		{label: 'Jul', value: 940},
	];

	const minVal = 300;
	const maxVal = 1000;

	const chartWidth = width - PADDING.left - PADDING.right;
	const chartHeight = height - PADDING.top - PADDING.bottom;

	const drawProgress = spring({
		frame: frame - 10,
		fps,
		config: {damping: 200, stiffness: 40, mass: 1},
		durationInFrames: 90,
	});

	const linePath = buildLinePath(
		data,
		minVal,
		maxVal,
		chartWidth,
		chartHeight,
		drawProgress,
	);
	const areaPath = buildAreaPath(
		linePath,
		chartWidth,
		chartHeight,
		data,
		drawProgress,
	);

	const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{backgroundColor: COLOR_BG, fontFamily}}
		>
			<div
				style={{
					position: 'absolute',
					top: 24,
					left: 0,
					right: 0,
					textAlign: 'center',
					color: COLOR_TEXT,
					fontSize: 40,
					fontWeight: 600,
					opacity: titleOpacity,
				}}
			>
				Monthly Revenue 2024
			</div>

			<svg
				width={chartWidth + PADDING.left + PADDING.right}
				height={chartHeight + PADDING.top + PADDING.bottom}
				style={{position: 'absolute', top: 0, left: 0}}
			>
				<g transform={`translate(${PADDING.left}, ${PADDING.top})`}>
					{[0, 0.25, 0.5, 0.75, 1].map((t) => {
						const y = t * chartHeight;
						const val = Math.round(maxVal - t * (maxVal - minVal));
						return (
							<g key={t}>
								<line
									x1={0}
									y1={y}
									x2={chartWidth}
									y2={y}
									stroke={COLOR_GRID}
									strokeWidth={1}
								/>
								<text
									x={-12}
									y={y + 6}
									textAnchor="end"
									fill={COLOR_MUTED}
									fontSize={18}
								>
									{val.toLocaleString()}
								</text>
							</g>
						);
					})}

					<line
						x1={0}
						y1={0}
						x2={0}
						y2={chartHeight}
						stroke={COLOR_AXIS}
						strokeWidth={2}
					/>
					<line
						x1={0}
						y1={chartHeight}
						x2={chartWidth}
						y2={chartHeight}
						stroke={COLOR_AXIS}
						strokeWidth={2}
					/>

					{areaPath && (
						<path d={areaPath} fill={COLOR_AREA} strokeWidth={0} />
					)}

					{linePath && (
						<path
							d={linePath}
							fill="none"
							stroke={COLOR_LINE}
							strokeWidth={3}
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					)}

					{data.map((d, i) => {
						const dotProgress = spring({
							frame: frame - 10 - (i / (data.length - 1)) * 90,
							fps,
							config: {damping: 14, stiffness: 200},
						});
						const x = scaleX(i, data.length, chartWidth);
						const y = scaleY(d.value, minVal, maxVal, chartHeight);
						const r = 8 * dotProgress;

						return (
							<g key={d.label}>
								<circle
									cx={x}
									cy={y}
									r={r}
									fill={COLOR_DOT}
									stroke={COLOR_DOT_BORDER}
									strokeWidth={2.5}
								/>
								<text
									x={x}
									y={chartHeight + 32}
									textAnchor="middle"
									fill={COLOR_MUTED}
									fontSize={20}
									opacity={dotProgress}
								>
									{d.label}
								</text>
							</g>
						);
					})}
				</g>
			</svg>
		</AbsoluteFill>
	);
};
