import './App.css';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Grid } from '@visx/grid';
import { AxisBottom, AxisLeft } from '@visx/axis';

const HEIGHT = 500;
const WIDTH = 1000;
const MARGIN = {top: 10, right: 10, bottom: 30, left: 50};
const background = '#eaedff';
const xMax = WIDTH - MARGIN.left - MARGIN.right;
const yMax = HEIGHT - MARGIN.top - MARGIN.bottom;


const chainrings = [30, 46];
const cassette = [11, 13, 15, 17, 19, 22, 25, 28, 32, 36];
const gears = chainrings.flatMap(chainring => {
  return cassette.map(cog => {
    const gearRatio = chainring / cog;
    const development = Math.PI * 0.68 * gearRatio;

    return {
      front: chainring,
      rear: cog,
      speeds: [development * 60 * 80 / 1000, development * 60 * 100 / 1000],
      label: `${chainring}t/${cog}t`
    };
  })
})

const xScale = scaleLinear({
  range: [0, xMax],
  domain: [0, Math.ceil(Math.max(...gears.map(gear => gear.speeds[1])) / 5) * 5]
});
const yScale = scaleBand({
  range: [0, yMax],
  domain: gears.map(gear => gear.label),
  padding: 0.1
})
console.log(gears)

function App() {
  return (
    <svg width={WIDTH} height={HEIGHT}>
      <Group left={MARGIN.left} top={MARGIN.top}>
        <Grid
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={yMax}
          numTicksRows={gears.length}
          numTicksColumns={60 / 5}
        />
        <AxisBottom scale={xScale} top={yMax} />
        <AxisLeft scale={yScale} numTicks={gears.length} />
        {gears.map(gear => {
          const x0 = xScale(gear.speeds[0]);
          const x1 = xScale(gear.speeds[1]);
          return (
            <Bar
              key={`bar-${gear.front}-${gear.rear}`}
              x={x0}
              y={yScale(gear.label)}
              height={yScale.bandwidth()}
              width={x1 - x0}
              fill="#000"
            />
          )
        })}
      </Group>
    </svg>
  );
}

export default App;
