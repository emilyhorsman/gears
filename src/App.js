import "./App.css";
import { BarRounded } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Grid } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { localPoint } from "@visx/event";
import { Annotation, Connector, Label } from "@visx/annotation";
import { useState } from "react";
import { getBestGearPath, getRemainingGears } from "./Gearing";

const HEIGHT = 500;
const WIDTH = 1000;
const MARGIN = { top: 10, right: 10, bottom: 50, left: 60 };
const xMax = WIDTH - MARGIN.left - MARGIN.right;
const yMax = HEIGHT - MARGIN.top - MARGIN.bottom;

function calcs(gear, redundant) {
  const { front, rear, ratio } = gear;
  const development = Math.PI * 0.68 * ratio;
  const speedAt1RPM = (development * 60) / 1000;
  return { ...gear, speedAt1RPM, label: `${front}/${rear}t`, redundant };
}

const minRPM = 85;
const maxRPM = 100;
const chainrings = [30, 46]; // [22, 32, 44].reverse();
const cassette = [11, 13, 15, 17, 19, 22, 25, 28, 32, 36].reverse(); //[11, 13, 15, 17, 20, 23, 26, 32].reverse();
const bestPath = getBestGearPath(chainrings, cassette);
const gears = bestPath
  .map((g) => calcs(g, false))
  .concat(
    getRemainingGears(bestPath, chainrings, cassette).map((g) => calcs(g, true))
  );

const xStep = 5;
const xScale = scaleLinear({
  range: [0, xMax],
  domain: [
    Math.floor(
      Math.min(...gears.map((gear) => gear.speedAt1RPM * minRPM)) / xStep
    ) * xStep,
    Math.ceil(
      Math.max(...gears.map((gear) => gear.speedAt1RPM * maxRPM)) / xStep
    ) * xStep,
  ],
});
const yScale = scaleBand({
  range: [0, yMax],
  domain: gears.map((gear) => gear.label),
  padding: 0.1,
});

const findDatum = (point) => {
  const x = point.x - MARGIN.left;
  const y = point.y - MARGIN.top;
  return gears.find((gear) => {
    const x0 = xScale(gear.speedAt1RPM * minRPM);
    const x1 = xScale(gear.speedAt1RPM * maxRPM);
    if (x < x0 || x > x1) {
      return false;
    }
    const y0 = yScale(gear.label);
    const y1 = y0 + yScale.bandwidth();
    return y >= y0 && y <= y1;
  });
};

const palette = [
  { hover: "#00282E", best: "#26C6DA", redundant: "#26C6DA" },
  { hover: "#00282E", best: "#006C7A", redundant: "#006C7A" },
  { hover: "#00282E", best: "#004851", redundant: "#004851" },
];
const barColors = chainrings.reduce(
  (obj, front, index) => ({
    ...obj,
    [front]: palette[index],
  }),
  {}
);

function LeftTickLabel({ x, y, formattedValue }) {
  return (
    <text dx="-0.25em" dy="0.25em" textAnchor="end" x={x} y={y} fontSize={13}>
      {formattedValue}
    </text>
  );
}

function BottomTickLabel({ x, y, formattedValue }) {
  return (
    <text textAnchor="middle" dy="0.25em" x={x} y={y} fontSize={13}>
      {formattedValue}
    </text>
  );
}

function App() {
  const [hoveredDatum, setHoveredDatum] = useState(null);

  return (
    <>
      <svg width={WIDTH} height={HEIGHT}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          <Grid
            xScale={xScale}
            yScale={yScale}
            width={xMax}
            height={yMax}
            numTicksRows={gears.length}
            numTicksColumns={60 / xStep}
          />
          <AxisBottom
            scale={xScale}
            top={yMax}
            tickComponent={BottomTickLabel}
            label="Speed (kmh)"
            labelProps={{ fontSize: 13 }}
          />
          <AxisLeft
            scale={yScale}
            numTicks={gears.length}
            tickComponent={LeftTickLabel}
          />
          {gears.map((gear) => {
            const x0 = xScale(gear.speedAt1RPM * minRPM);
            const x1 = xScale(gear.speedAt1RPM * maxRPM);
            const isHovered = gear === hoveredDatum;
            const fill = barColors[gear.front];
            return (
              <BarRounded
                key={`bar-${gear.front}-${gear.rear}`}
                x={x0}
                y={yScale(gear.label)}
                height={yScale.bandwidth()}
                radius={5}
                bottomLeft={true}
                topRight={true}
                all={gear.redundant}
                width={x1 - x0}
                fill={
                  isHovered
                    ? fill.hover
                    : gear.redundant
                    ? fill.redundant
                    : fill.best
                }
              />
            );
          })}
        </Group>
        <rect
          width={WIDTH}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={(event) => {
            const point = localPoint(event);
            const datum = findDatum(point);
            setHoveredDatum(datum);
          }}
          onMouseLeave={() => setHoveredDatum(null)}
        />
        {hoveredDatum && (
          <Annotation
            width={WIDTH}
            height={HEIGHT}
            x={xScale(hoveredDatum.speedAt1RPM * minRPM) + MARGIN.left}
            y={yScale(hoveredDatum.label) + MARGIN.top}
            dx={-20}
            dy={-10}
          >
            <Connector stroke="orange" type="elbow" />
            <Label
              backgroundFill="white"
              showAnchorLine={true}
              title={`${hoveredDatum.front}t/${hoveredDatum.rear}t`}
              subtitle={"foo"}
              backgroundProps={{ stroke: "black" }}
            />
          </Annotation>
        )}
      </svg>
    </>
  );
}

export default App;
