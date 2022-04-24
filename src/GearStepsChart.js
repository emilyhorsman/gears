import { Bar } from "@visx/shape";
import { range } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { Text } from "@visx/text";
import { Fragment } from "react";
import { PercentageFormatter, RatioFormatter } from "./Utils";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";

function GearStepsChart({ drivetrain }) {
  const gears = drivetrain.gears;
  const xScale = scaleBand()
    .domain(range(1, gears.length))
    .range([40, 400])
    .paddingInner(0.4)
    .paddingOuter(1)
    .align(0.5);
  const yScale = scaleLinear().domain([0.1, 0.2]).range([100, 0]);

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

function barLabel(easier, harder) {
  let label = "";
  if (!easier || easier.params.front !== harder.params.front) {
    label += `${harder.params.front}/`;
  }
  label += `${harder.params.rear}`;
  return label;
}

export default GearStepsChart;
