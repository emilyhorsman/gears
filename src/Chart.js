import { Bar, Line } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleLinear } from "@visx/scale";
import { Grid } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { localPoint } from "@visx/event";
import { PatternLines } from "@visx/pattern";
import { Text } from "@visx/text";
import { Fragment, useState } from "react";

const xStep = 5;
const barHeight = 10;

const palette = ["#2E78D2", "#FF7043", "#26C6DA"];

function Chart(props) {
  const { drivetrain, minRPM, maxRPM, margin, width, height } = props;
  const xScale = speedScale(props);
  const yScale = gearScale(props);
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const LeftTickLabelComponent = LeftTickLabel(margin);
  const [curGear, setCurGear] = useState(null);

  return (
    <>
      <svg width={width} height={height}>
        <PatternLines
          id="lines"
          height={8}
          width={8}
          stroke="black"
          strokeWidth={1}
          orientation={["diagonalRightToLeft"]}
        />

        <Group left={margin.left} top={margin.top}>
          <Grid xScale={xScale} yScale={yScale} width={xMax} height={yMax} />
          <AxisBottom
            scale={xScale}
            top={yMax}
            tickComponent={BottomTickLabel}
            label="Speed (kmh)"
            labelProps={{ fontSize: 13 }}
          />
          <AxisLeft
            scale={yScale}
            tickComponent={LeftTickLabelComponent}
            label="Gain Ratio"
            labelProps={{ fontSize: 13 }}
          />
          {curGear && (
            <HoverArea
              gear={curGear}
              {...{ xScale, yScale, minRPM, maxRPM, yMax }}
            />
          )}
          <GearRPMSpeedBars
            drivetrain={drivetrain}
            xScale={xScale}
            yScale={yScale}
            minRPM={minRPM}
            maxRPM={maxRPM}
            curGear={curGear}
          />
        </Group>
        <rect
          width={width}
          height={height}
          fill="transparent"
          onMouseMove={(event) => {
            const point = localPoint(event);
            const datum = findDatum(point, {
              gears: drivetrain.gears,
              xScale,
              yScale,
              minRPM,
              maxRPM,
              margin,
            });
            setCurGear(datum);
          }}
          onMouseLeave={() => setCurGear(null)}
        />
      </svg>
    </>
  );
}

function GearRPMSpeedBars({
  drivetrain,
  xScale,
  yScale,
  minRPM,
  maxRPM,
  curGear,
}) {
  return (
    <>
      {drivetrain.gears.map((gear) => {
        const x0 = xScale(gear.perHourSpeedAtRPM(minRPM).km);
        const x1 = xScale(gear.perHourSpeedAtRPM(maxRPM).km);
        const y = yScale(gear.gainRatio);
        return (
          <Fragment key={`${gear.params.frontPos}-${gear.params.rearPos}`}>
            <Line
              from={{ x: x0, y }}
              to={{ x: x1, y }}
              stroke={palette[gear.params.frontPos]}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle
              cx={(x0 + x1) / 2}
              cy={y}
              r={4}
              stroke="black"
              strokeWidth={2}
              fill={palette[gear.params.frontPos]}
            />
          </Fragment>
        );
      })}
    </>
  );
}

function HoverArea({ gear, xScale, yScale, minRPM, maxRPM, yMax }) {
  const minSpeed = gear.perHourSpeedAtRPM(minRPM).km;
  const maxSpeed = gear.perHourSpeedAtRPM(maxRPM).km;
  const x0 = xScale(minSpeed);
  const x1 = xScale(maxSpeed);
  const y = yScale.range()[0];
  const height = yScale.range()[1] - y;
  return (
    <>
      <Bar x={x0} y={y} height={height} width={x1 - x0} fill="url('#lines')" />
      <Text
        x={x0 + (x1 - x0) / 2}
        y={y - 15}
        verticalAnchor="start"
        textAnchor="middle"
        dx="0.25em"
        fontSize={13}
      >
        {`${gear.gainRatio.toFixed(2)} ${minSpeed.toFixed(
          1
        )} – ${maxSpeed.toFixed(1)} kmh`}
      </Text>
    </>
  );
}

const LeftTickLabel =
  (margin) =>
  ({ x, y, formattedValue }) => {
    return (
      <Text
        dx="-0.25em"
        dy="-0.1em"
        textAnchor="end"
        x={x}
        y={y}
        fontSize={13}
        verticalAnchor="middle"
        width={margin.left - 20}
      >
        {formattedValue}
      </Text>
    );
  };

function BottomTickLabel({ x, y, formattedValue }) {
  return (
    <text textAnchor="middle" dy="0.25em" x={x} y={y} fontSize={13}>
      {formattedValue}
    </text>
  );
}

function findDatum(point, { gears, xScale, yScale, minRPM, maxRPM, margin }) {
  const x = point.x - margin.left;
  const y = point.y - margin.top;
  return gears.find((gear) => {
    const x0 = xScale(gear.perHourSpeedAtRPM(minRPM).km);
    const x1 = xScale(gear.perHourSpeedAtRPM(maxRPM).km);
    if (x < x0 || x > x1) {
      return false;
    }
    const y0 = yScale(gear.gainRatio) - barHeight / 2;
    const y1 = y0 + barHeight;
    return y >= y0 && y <= y1;
  });
}

function speedScale({ drivetrains, minRPM, maxRPM, width, margin }) {
  const speeds = drivetrains.flatMap((drivetrain) => {
    return [
      drivetrain.easiestGear.perHourSpeedAtRPM(minRPM).km,
      drivetrain.hardestGear.perHourSpeedAtRPM(maxRPM).km,
    ];
  });

  return scaleLinear({
    range: [0, width - margin.left - margin.right],
    domain: domain(speeds, 5),
  });
}

function gearScale({ drivetrains, height, margin }) {
  const ratios = drivetrains.flatMap((drivetrain) => {
    return [drivetrain.easiestGear.gainRatio, drivetrain.hardestGear.gainRatio];
  });
  return scaleLinear({
    range: [0, height - margin.top - margin.bottom],
    domain: domain(ratios, 0.75),
  });
}

function domain(values, step) {
  return [
    Math.floor(Math.min(...values) / step) * step,
    Math.ceil(Math.max(...values) / step) * step,
  ];
}

export default Chart;
