import { Bar, Line } from "@visx/shape";
import { range } from "d3-array";
import { scaleBand, scaleLinear } from "d3-scale";
import { Text } from "@visx/text";
import { Fragment } from "react";
import { PercentageFormatter, RatioFormatter, SpeedFormatter } from "./Utils";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { mean } from "d3-array";
import { sum } from "d3-array";

function GearStepsChart({ gears }) {
  const xScale = scaleBand()
    .domain(range(1, gears.length))
    .range([40, 400])
    .paddingInner(0.4)
    .paddingOuter(1)
    .align(0.5);
  const yScale = scaleLinear().domain([0.05, 0.2]).range([100, 0]);
  const meanStep = mean(
    range(1, gears.length).map((index) =>
      gears[index].percentHarderThan(gears[index - 1])
    )
  );

  return (
    <div>
      <table style={{ fontSize: 11 }}>
        <tbody>
          <tr>
            {gears.map((gear, index) => (
              <td key={index}>{gear.params.front}</td>
            ))}
          </tr>
          <tr>
            {gears.map((gear, index) => (
              <td key={index}>{gear.params.rear}</td>
            ))}
          </tr>
          <tr>
            {gears.map((gear, index) => (
              <td key={index}>{RatioFormatter.format(gear.gainRatio)}</td>
            ))}
          </tr>
          <tr>
            {gears.map((gear, index) => (
              <td key={index}>
                {SpeedFormatter.format(gear.perHourSpeedAtRPM(90).km)}
              </td>
            ))}
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="10">
              sum=
              {RatioFormatter.format(
                sum(gears.map((gear) => gear.gainRatio))
              )}{" "}
              mean={RatioFormatter.format(meanStep)}
            </td>
          </tr>
        </tfoot>
      </table>
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
          <Line
            from={{ x: 40, y: yScale(meanStep) }}
            to={{ x: 400, y: yScale(meanStep) }}
            stroke="black"
            strokeDasharray={4}
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

function barLabel(easier, harder) {
  let label = "";
  if (!easier || easier.params.front !== harder.params.front) {
    label += `${harder.params.front}/`;
  }
  label += `${harder.params.rear}`;
  return label;
}

export default GearStepsChart;
