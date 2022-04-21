import './App.css';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Grid } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { localPoint } from '@visx/event';
import { useState } from 'react';
import { useTooltip, Tooltip } from '@visx/tooltip';

const HEIGHT = 500;
const WIDTH = 1000;
const MARGIN = { top: 10, right: 10, bottom: 30, left: 50 };
const background = '#eaedff';
const xMax = WIDTH - MARGIN.left - MARGIN.right;
const yMax = HEIGHT - MARGIN.top - MARGIN.bottom;


/*
30/36 = 1.8 meters/revolution = easier
30/32 = 2.0 meters/revolution = harder

cadence_diff = easier * extra_revolutions = harder => extra_revolutions = harder/easier

put a line in the middle of each bar

viz:
1. cadence remains the same, how much speed increase
2. speed remains the same, how much cadence drop?
*/

const chainrings = [30, 46].reverse();
const cassette = [11, 13, 15, 17, 19, 22, 25, 28, 32, 36];
const gears = chainrings.flatMap(chainring => {
  return cassette.map(cog => {
    const gearRatio = chainring / cog;
    const development = Math.PI * 0.68 * gearRatio;
    const speedAt1RPM = development * 60 / 1000;

    return {
      front: chainring,
      rear: cog,
      speedAt1RPM,
      label: `${chainring}t/${cog}t`
    };
  })
});

const minRPM = 80;
const maxRPM = 100;
const xStep = 5;
const xScale = scaleLinear({
  range: [0, xMax],
  domain: [
    Math.floor(Math.min(...gears.map(gear => gear.speedAt1RPM * minRPM)) / xStep) * xStep,
    Math.ceil(Math.max(...gears.map(gear => gear.speedAt1RPM * maxRPM)) / xStep) * xStep
  ]
});
const yScale = scaleBand({
  range: [0, yMax],
  domain: gears.map(gear => gear.label),
  padding: 0.1
})

const findDatum = point => {
  const x = point.x - MARGIN.left;
  const y = point.y - MARGIN.top;
  return gears.find(gear => {
    const x0 = xScale(gear.speedAt1RPM * minRPM);
    const x1 = xScale(gear.speedAt1RPM * maxRPM);
    if (x < x0 || x > x1) {
      return false;
    }
    const y0 = yScale(gear.label);
    const y1 = y0 + yScale.bandwidth();
    return y >= y0 && y <= y1;
  })
}

function App() {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

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
          <AxisBottom scale={xScale} top={yMax} />
          <AxisLeft scale={yScale} numTicks={gears.length} />
          {gears.map(gear => {
            const x0 = xScale(gear.speedAt1RPM * minRPM);
            const x1 = xScale(gear.speedAt1RPM * maxRPM);
            const isHovered = gear.label === tooltipData?.label;
            return (
              <Bar
                key={`bar-${gear.front}-${gear.rear}`}
                x={x0}
                y={yScale(gear.label)}
                height={yScale.bandwidth()}
                width={x1 - x0}
                fill={isHovered ? "blue" : "#000"}
              />
            )
          })}
        </Group>
        <rect width={WIDTH} height={HEIGHT} fill="transparent" onMouseMove={event => {
          const point = localPoint(event);
          const datum = findDatum(point);
          if (!datum) {
            hideTooltip();
            return;
          }
          showTooltip({
            tooltipLeft: event.clientX,
            tooltipTop: event.clientY,
            tooltipData: datum,
          })
        }} onMouseLeave={() => hideTooltip()} />
      </svg>
      {tooltipOpen && <Tooltip top={tooltipTop} left={tooltipLeft}>woo</Tooltip>}
    </>
  );
}

export default App;
