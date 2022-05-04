import { Group } from "@visx/group";
import { Line } from "@visx/shape";
import { Text } from "@visx/text";
import { interpolateCubehelix } from "d3-interpolate";
import { scaleSequential } from "d3-scale";
import { Fragment } from "react";
import { barLabel } from "./GearStepsChart";
import { PercentageFormatter } from "./Utils";

const interpolator = interpolateCubehelix.gamma(3)("#FFE4DC", "#C25432");
const colorScale = scaleSequential(interpolator)
  .domain([0.07, 0.2])
  .clamp(true);
const secondary = "#222C31";
const tertiary = "#364850";

export function GearStepsGradientLegend() {
  const height = 100;
  const legendWidth = 20;
  const width = 70;
  const legendX = width - legendWidth;
  return (
    <svg width={width + 20} height={height}>
      <defs>
        <linearGradient
          id="gear-steps-gradient-legend"
          gradientTransform="rotate(90)"
        >
          <stop offset="0%" stopColor={interpolator(0)} />
          <stop offset="100%" stopColor={interpolator(1)} />
        </linearGradient>
      </defs>
      <rect
        x={legendX}
        y={0}
        height={height}
        width={legendWidth}
        rx={4}
        fill="url('#gear-steps-gradient-legend')"
      />
      <Text
        x={legendX}
        y={5}
        fill="black"
        textAnchor="end"
        verticalAnchor="start"
        dx="-0.25em"
        fontSize={13}
        fill={secondary}
      >
        Easier
      </Text>
      <Text
        x={legendX}
        y={height - 5}
        fill="black"
        textAnchor="end"
        verticalAnchor="end"
        dx="-0.25em"
        fontSize={13}
        fill={secondary}
      >
        Harder
      </Text>
    </svg>
  );
}

export default function GearStepsGradient({
  gears,
  id,
  width = 200,
  height = 400,
}) {
  const step = 100 / (gears.length - 1);

  const marginTop = 5;
  const marginBottom = 5;
  const barHeight = height - marginTop - marginBottom;
  const barOffsetLeft = 60;
  const barOffsetRight = 90;
  const barWidth = width - barOffsetLeft - barOffsetRight;

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={`${id}-grad`} gradientTransform="rotate(90)">
          {gears.map((gear, index) => {
            if (index === 0) {
              return null;
            }

            const color = colorScale(
              gears[index].percentHarderThan(gears[index - 1])
            );
            return (
              <stop
                key={index}
                offset={`${step / 2 + step * (index - 1)}%`}
                stopColor={color}
              />
            );
          })}
        </linearGradient>
      </defs>

      <Group top={marginTop}>
        {gears.map((gear, index) => {
          const offset =
            index === 0 ? 0.5 : index === gears.length - 1 ? -0.5 : 0;
          const y = (barHeight / (gears.length - 1)) * index + offset;
          return (
            <Fragment key={gear.key}>
              <Line
                from={{ x: barOffsetLeft, y }}
                to={{ x: barOffsetLeft - 10, y }}
                stroke={tertiary}
                strokeWidth={1}
              />
              <Text
                fontSize={14}
                fill={secondary}
                x={barOffsetLeft - 10}
                dx="-0.25em"
                y={y}
                textAnchor="end"
                verticalAnchor="middle"
              >
                {`${barLabel(gears[index - 1], gear)}t`}
              </Text>
            </Fragment>
          );
        })}
      </Group>

      <Group top={marginTop} left={barOffsetLeft + barWidth}>
        {gears.map((gear, index) => {
          if (index === 0) {
            return null;
          }
          const yStep = (step / 100) * barHeight;
          const y = yStep / 2 + yStep * (index - 1);
          return (
            <Fragment key={gear.key}>
              <Line
                from={{ x: 0, y }}
                to={{ x: 10, y }}
                stroke={tertiary}
                strokeWidth={1}
              />
              <Text
                fontSize={14}
                fill={secondary}
                x={10}
                dx="0.25em"
                y={y}
                textAnchor="start"
                verticalAnchor="middle"
              >
                {PercentageFormatter.format(
                  gear.percentHarderThan(gears[index - 1])
                )}
              </Text>
            </Fragment>
          );
        })}
      </Group>

      <Group left={barOffsetLeft} top={marginTop}>
        <rect width={barWidth} height={barHeight} fill={`url('#${id}-grad')`} />
        <Line
          from={{ x: 0, y: 0 }}
          to={{ x: 0, y: barHeight }}
          stroke={tertiary}
          strokeWidth={1}
        />
        <Line
          from={{ x: barWidth, y: 0 }}
          to={{ x: barWidth, y: barHeight }}
          stroke={tertiary}
          strokeWidth={1}
        />
      </Group>
    </svg>
  );
}
