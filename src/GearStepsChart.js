import { Bar, Line } from "@visx/shape";
import { range } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { Text } from "@visx/text";
import { Fragment } from "react";
import { PercentageFormatter } from "./Utils";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { GridRows } from "@visx/grid";

function GearStepsChart({ gears }) {
  const xScale = scaleBand()
    .domain(range(1, gears.length))
    .range([40, 400])
    .paddingInner(0.4)
    .paddingOuter(0.4)
    .align(0.3);
  const yScale = scaleLinear().domain([0.05, 0.2]).range([100, 0]);

  return (
    <svg width={400} height={150} style={{ display: "block", margin: 10 }}>
      <Group top={20}>
        <AxisLeft
          scale={yScale}
          left={40}
          tickFormat={PercentageFormatter.format}
          tickComponent={TickLabel}
          numTicks={3}
        />
        <AxisBottom
          scale={xScale}
          top={100}
          hideTicks={true}
          tickFormat={() => null}
        />
        <GridRows scale={yScale} numTicks={3} width={400} left={41} />
        {gears.map((gear, index) => {
          if (index === 0) {
            const x = xScale(1) - xScale.step() * xScale.paddingInner();
            return (
              <Label key={gear.key} x={x} y={100}>
                {barLabel(null, gear)}
              </Label>
            );
          }
          const text = barLabel(gears[index - 1], gear);
          const step = index > 0 && gear.percentHarderThan(gears[index - 1]);
          const y = yScale(step);
          const x = xScale(index);
          const width = xScale.bandwidth();
          return (
            <Fragment key={gear.key}>
              <Bar x={x} y={y} height={100 - y} width={width} />
              <Label x={x + width} y={100}>
                {text}
              </Label>
            </Fragment>
          );
        })}
      </Group>
    </svg>
  );
}

export function GearStepsComparisonChart({ a, b }) {
  const n = Math.min(a.length, b.length);
  const xScale = scaleBand()
    .domain(range(1, n))
    .range([40, 400])
    .paddingInner(0.4)
    .paddingOuter(1)
    .align(0.5);
  const yScale = scaleLinear().domain([0.08, 0.25]).range([200, 0]);

  return (
    <div>
      <svg width={400} height={230} style={{ display: "block", margin: 10 }}>
        <Group top={20}>
          <AxisLeft
            scale={yScale}
            left={40}
            tickFormat={PercentageFormatter.format}
            tickComponent={TickLabel}
            numTicks={3}
          />
          <AxisBottom
            scale={xScale}
            top={200}
            hideTicks={true}
            tickFormat={() => null}
          />
          {range(1, n).map((i) => {
            const x = xScale(i);
            const aStep = a[i].percentHarderThan(a[i - 1]);
            const bStep = b[i].percentHarderThan(b[i - 1]);
            const aY = yScale(aStep);
            const bY = yScale(bStep);
            const width = xScale.bandwidth();
            return (
              <Fragment key={i}>
                <Bar
                  x={x}
                  y={Math.min(aY, bY)}
                  height={Math.abs(aY - bY)}
                  width={width}
                  fill={aY > bY ? "#26C6DA" : "#FFBEA9"}
                />
                <Line
                  from={{ x, y: aY }}
                  to={{ x: x + width, y: aY }}
                  stroke="black"
                  strokeWidth={2}
                />
                <Line
                  from={{ x, y: bY }}
                  to={{ x: x + width, y: bY }}
                  stroke="#666"
                  strokeWidth={2}
                  strokeDasharray={4}
                />
              </Fragment>
            );
          })}
        </Group>
      </svg>
    </div>
  );
}

function TickLabel({ x, y, dx, dy, formattedValue }) {
  return (
    <Text fontSize={12} x={x} y={y} dx={dx} dy={dy} textAnchor="end">
      {formattedValue}
    </Text>
  );
}

function Label(props) {
  return <Text fontSize={11} angle={30} dx="-0.25em" dy="1em" {...props} />;
}

export function barLabel(easier, harder) {
  let label = "";
  if (!easier || easier.params.front !== harder.params.front) {
    label += `${harder.params.front}/`;
  }
  label += `${harder.params.rear}`;
  return label;
}

export default GearStepsChart;
