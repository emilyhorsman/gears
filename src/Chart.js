import { Bar, BarRounded, Line } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Grid } from "@visx/grid";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { localPoint } from "@visx/event";
import { PatternLines } from "@visx/pattern";
import { Text } from "@visx/text";
import { Fragment, useState } from "react";

const xStep = 5;
const blue = "#2E78D2";
const navy = "#112E51";
const lightestBlue = "#C1D7F2";
const barHeight = 10;

function Chart(props) {
  const { gears, bailOutRPM, minRPM, maxRPM, margin, width, height } = props;
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
          stroke={navy}
          strokeWidth={1}
          orientation={["diagonalRightToLeft"]}
        />

        <Group left={margin.left} top={margin.top}>
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
            gears={gears}
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
              gears,
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

function GearRPMSpeedBars({ gears, xScale, yScale, minRPM, maxRPM, curGear }) {
  return (
    <>
      {gears.map((gear, index) => {
        const xClimb = xScale(gear.speedAt1RPM * 50);
        const x0 = xScale(gear.speedAt1RPM * minRPM);
        const x1 = xScale(gear.speedAt1RPM * maxRPM);
        return (
          <Fragment key={`bar-${gear.front}-${gear.rear}`}>
            {index === 0 && (
              <Bar
                x={xClimb}
                y={yScale(gear.gainRatio) - barHeight / 2}
                height={barHeight}
                width={x1 - xClimb}
                fill={lightestBlue}
              />
            )}
            <Bar
              x={x0}
              y={yScale(gear.gainRatio) - barHeight / 2}
              height={barHeight}
              width={x1 - x0}
              fill={gear === curGear ? navy : blue}
            />
          </Fragment>
        );
      })}
    </>
  );
}

function SpinOutGear({ gears, xScale, yScale, maxRPM }) {
  const maxGear = maxBy(gears, ({ ratio }) => ratio);
  const speed = maxGear.speedAt1RPM * maxRPM;
  const x = xScale(speed);
  const y = yScale(maxGear.label) + barHeight;
  const yMax = y + 40;
  return (
    <>
      <Line
        from={{ x, y }}
        to={{ x, y: yMax }}
        stroke="#FF7043"
        strokeDasharray={5}
      />
      <Text
        x={x}
        y={yMax}
        textAnchor="end"
        verticalAnchor="middle"
        fontSize={12}
        dy="-0.1em"
        dx="-0.8em"
      >
        {`At ${maxRPM} RPM you spin out going ${Math.round(speed)} kmh`}
      </Text>
      <circle
        cx={x}
        cy={yMax}
        r={4}
        stroke="#FF7043"
        strokeWidth={2}
        fill="#FFBEA9"
      />
    </>
  );
}

function ClimbingGear({ gears, xScale, yScale, bailOutRPM }) {
  const minGear = minBy(gears, ({ ratio }) => ratio);
  const speed = minGear.speedAt1RPM * bailOutRPM;
  const x = xScale(speed);
  const y = yScale(minGear.label);

  return (
    <>
      <Line
        from={{ x, y }}
        to={{ x, y: -30 }}
        stroke="#FF7043"
        strokeDasharray={5}
      />
      <circle
        cx={x}
        cy={-30}
        r={4}
        stroke="#FF7043"
        strokeWidth={2}
        fill="#FFBEA9"
      />
      <text
        x={x}
        y={-30}
        textAnchor="start"
        fontSize={12}
        dy="0.25em"
        dx="0.8em"
      >
        At 50 RPM you'll climb that hill at {speed.toFixed(1)} kmh
      </text>
    </>
  );
}

function HoverArea({ gear, xScale, yScale, minRPM, maxRPM, yMax }) {
  const minSpeed = gear.speedAt1RPM * minRPM;
  const maxSpeed = gear.speedAt1RPM * maxRPM;
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

function minBy(arr, accessor) {
  return arr.reduce((cur, candidate) => {
    if (cur == null || accessor(candidate) < accessor(cur)) {
      return candidate;
    }
    return cur;
  }, null);
}

function maxBy(arr, accessor) {
  return arr.reduce((cur, candidate) => {
    if (cur == null || accessor(candidate) > accessor(cur)) {
      return candidate;
    }
    return cur;
  }, null);
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
    const x0 = xScale(gear.speedAt1RPM * minRPM);
    const x1 = xScale(gear.speedAt1RPM * maxRPM);
    if (x < x0 || x > x1) {
      return false;
    }
    const y0 = yScale(gear.gainRatio) - barHeight / 2;
    const y1 = y0 + barHeight;
    return y >= y0 && y <= y1;
  });
}

function speedScale({ gears, bailOutRPM, maxRPM, width, margin }) {
  return scaleLinear({
    range: [0, width - margin.left - margin.right],
    domain: [
      Math.floor(
        Math.min(...gears.map((gear) => gear.speedAt1RPM * bailOutRPM)) / xStep
      ) * xStep,
      Math.ceil(
        Math.max(...gears.map((gear) => gear.speedAt1RPM * maxRPM)) / xStep
      ) * xStep,
    ],
  });
}

function gearScale({ gears, height, margin }) {
  return scaleLinear({
    range: [0, height - margin.top - margin.bottom],
    domain: [
      Math.floor(Math.min(...gears.map((gear) => gear.gainRatio)) / 0.75) *
        0.75,
      Math.ceil(Math.max(...gears.map((gear) => gear.gainRatio)) / 0.75) * 0.75,
    ],
  });
}

export default Chart;
