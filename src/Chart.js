import { Bar, Line } from "@visx/shape";
import { Group } from "@visx/group";
import { scaleBand, scaleLog, scaleLinear } from "@visx/scale";
import { GridColumns } from "@visx/grid";
import { AxisBottom } from "@visx/axis";
import { localPoint } from "@visx/event";
import { PatternLines } from "@visx/pattern";
import { Text } from "@visx/text";
import { Fragment, useState } from "react";
import { GlyphCircle, GlyphCross, GlyphWye } from "@visx/glyph";

const barHeight = 10;
const glyphs = [GlyphCircle, GlyphWye, GlyphCross];
const palette = ["#2E78D2", "#FF7043", "#26C6DA", "#4B636E"];

function GainRatioChart(props) {
  const { drivetrains, margin, width } = props;
  const height = 300;
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const ratios = drivetrains.flatMap((drivetrain) => {
    return [drivetrain.easiestGear.gainRatio, drivetrain.hardestGear.gainRatio];
  });
  const xScale = scaleLog({
    range: [0, xMax],
    domain: [Math.min(...ratios), Math.max(...ratios)],
    nice: true,
    base: 2,
  });
  const yScale = scaleBand({
    range: [0, yMax],
    domain: drivetrains.map((drivetrain) => drivetrain.title),
    paddingOuter: 0.2,
    align: 0,
  });

  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        <AxisBottom
          scale={xScale}
          top={yMax}
          tickComponent={BottomTickLabel}
          label="Gain Ratio"
          labelProps={{ fontSize: 13 }}
        />
        <GridColumns scale={xScale} width={xMax} height={yMax} />

        {drivetrains.map((drivetrain, index) => (
          <Fragment key={drivetrain.title}>
            {drivetrain.gears.map((gear) => {
              const x = xScale(gear.gainRatio);
              const y = yScale(drivetrain.title) + yScale.bandwidth() / 2;
              return (
                <Fragment key={gear.gainRatio}>
                  <circle cx={x} cy={y} r={6} fill={palette[index]} />
                  <Text
                    y={y + 6}
                    x={x}
                    fontSize={12}
                    dy="0.25em"
                    fill="black"
                    verticalAnchor="start"
                    textAnchor="middle"
                  >
                    {gear.gainRatio.toFixed(2)}
                  </Text>
                  <Text
                    y={y + 6}
                    x={x}
                    fontSize={12}
                    dy="1.25em"
                    fill="black"
                    verticalAnchor="start"
                    textAnchor="middle"
                  >
                    {gear.params.rear}
                  </Text>
                </Fragment>
              );
            })}
          </Fragment>
        ))}
      </Group>
    </svg>
  );
}

export function Chart(props) {
  const { drivetrains, minRPM, maxRPM, margin, width, height } = props;
  const xScale = speedScale(props);
  const yScales = gearScales(props);
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const [curGear, setCurGear] = useState(null);

  return (
    <>
      <Legend drivetrains={drivetrains} />
      <GainRatioChart {...props} />
      <br />
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
          <GridColumns scale={xScale} width={xMax} height={yMax} />
          <AxisBottom
            scale={xScale}
            top={yMax}
            tickComponent={BottomTickLabel}
            label="Speed (kmh)"
            labelProps={{ fontSize: 13 }}
          />

          {drivetrains.map((drivetrain, index) => {
            const yScale = yScales[index];
            return (
              <Fragment key={index}>
                {curGear && (
                  <HoverArea
                    gear={curGear}
                    {...{ xScale, yScale, minRPM, maxRPM, yMax }}
                  />
                )}
                <GearRPMSpeedBars
                  gears={drivetrain.gears}
                  xScale={xScale}
                  yScale={yScale}
                  minRPM={minRPM}
                  maxRPM={maxRPM}
                  curGear={curGear}
                  color={palette[index]}
                  GlyphComponent={glyphs[index]}
                />
              </Fragment>
            );
          })}
        </Group>
        <rect
          width={width}
          height={height}
          fill="transparent"
          onMouseMove={(event) => {
            const point = localPoint(event);
            const datum = null; /*findDatum(point, {
              gears,
              xScale,
              yScale,
              minRPM,
              maxRPM,
              margin,
            });*/
            setCurGear(datum);
          }}
          onMouseLeave={() => setCurGear(null)}
        />
      </svg>
    </>
  );
}

function GearRPMSpeedBars({
  gears,
  xScale,
  yScale,
  minRPM,
  maxRPM,
  curGear,
  color,
}) {
  return (
    <>
      {gears.map((gear) => {
        const x0 = xScale(gear.perHourSpeedAtRPM(minRPM).km);
        const x1 = xScale(gear.perHourSpeedAtRPM(maxRPM).km);
        const y = yScale(gear.gainRatio);
        const GlyphComponent = glyphs[gear.params.frontPos];

        return (
          <Fragment key={`${gear.params.frontPos}-${gear.params.rearPos}`}>
            <Line
              from={{ x: x0, y }}
              to={{ x: x1, y }}
              stroke={color}
              strokeWidth={3}
              strokeLinecap="round"
            />
            <GlyphComponent
              left={(x0 + x1) / 2}
              top={y}
              size={50}
              fill={color}
              strokeWidth={2}
              stroke="black"
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

const LeftTickLabel = (margin) => ({ x, y, formattedValue }) => {
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

function gearScales({ drivetrains, height, margin }) {
  const chartHeight = height - margin.top - margin.bottom;
  const gap = 0.15;
  const base = 1 - (drivetrains.length - 1) * gap;
  const ratios = drivetrains.flatMap((drivetrain) => {
    return [drivetrain.easiestGear.gainRatio, drivetrain.hardestGear.gainRatio];
  });
  const globalDomain = domain(ratios, 0.75);

  return drivetrains.map((drivetrain, index) => {
    const y0 = chartHeight * gap * index;
    const y1 = y0 + chartHeight * base;

    return scaleLinear({
      range: [y0, y1],
      domain: globalDomain,
    });
  });
}

function domain(values, step) {
  return [
    Math.floor(Math.min(...values) / step) * step,
    Math.ceil(Math.max(...values) / step) * step,
  ];
}

export function Legend({ drivetrains }) {
  return (
    <div className="legend">
      {drivetrains.map((drivetrain, index) => {
        return (
          <div key={index} className="legend-item">
            <span
              className="legend-chip"
              style={{ backgroundColor: palette[index] }}
              role="presentation"
            />
            <span>{drivetrain.title}</span>
          </div>
        );
      })}
    </div>
  );
}

export default GainRatioChart;
