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
            numTicks={gears.length}
            tickComponent={LeftTickLabelComponent}
          />
          {curGear && (
            <HoverArea
              gear={curGear}
              {...{ xScale, yScale, minRPM, maxRPM, yMax }}
            />
          )}
          {gears.map((gear, index) => {
            const xClimb = xScale(gear.speedAt1RPM * 50);
            const x0 = xScale(gear.speedAt1RPM * minRPM);
            const x1 = xScale(gear.speedAt1RPM * maxRPM);
            return (
              <Fragment key={`bar-${gear.front}-${gear.rear}`}>
                {index === 0 && (
                  <BarRounded
                    x={xClimb}
                    y={yScale(gear.label)}
                    height={yScale.bandwidth()}
                    radius={5}
                    bottomLeft={true}
                    topRight={true}
                    all={gear.redundant}
                    width={x1 - xClimb}
                    fill="#6BEFF9"
                  />
                )}
                <BarRounded
                  x={x0}
                  y={yScale(gear.label)}
                  height={yScale.bandwidth()}
                  radius={5}
                  bottomLeft={true}
                  topRight={true}
                  all={gear.redundant}
                  width={x1 - x0}
                  fill={gear === curGear ? navy : blue}
                />
              </Fragment>
            );
          })}
          <SpinOutGear
            gears={gears}
            xScale={xScale}
            yScale={yScale}
            maxRPM={maxRPM}
          />
          <ClimbingGear
            gears={gears}
            xScale={xScale}
            yScale={yScale}
            bailOutRPM={bailOutRPM}
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

function SpinOutGear({ gears, xScale, yScale, maxRPM }) {
  const maxGear = maxBy(gears, ({ ratio }) => ratio);
  const speed = maxGear.speedAt1RPM * maxRPM;
  const x = xScale(speed);
  const y = yScale(maxGear.label);
  const yMax = y - yScale.bandwidth() * 1.5;
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
        to={{ x, y: -20 }}
        stroke="#FF7043"
        strokeDasharray={5}
      />
      <circle
        cx={x}
        cy={-20}
        r={4}
        stroke="#FF7043"
        strokeWidth={2}
        fill="#FFBEA9"
      />
      <text
        x={x}
        y={-20}
        textAnchor="start"
        fontSize={12}
        dy="1.25em"
        dx="0.5em"
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
      <Text x={x1} y={y} verticalAnchor="start" dx="0.25em" fontSize={13}>
        {`${minSpeed.toFixed(1)} – ${maxSpeed.toFixed(1)} kmh`}
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
        scaleToFit={true}
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
    const y0 = yScale(gear.label);
    const y1 = y0 + yScale.bandwidth();
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
  return scaleBand({
    range: [0, height - margin.top - margin.bottom],
    domain: gears.map((gear) => gear.label),
    padding: 0.1,
  });
}

export default Chart;
