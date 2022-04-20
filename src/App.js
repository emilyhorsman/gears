import './App.css';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { Grid } from '@visx/grid';

const HEIGHT = 500;
const WIDTH = 1000;


const chainrings = [30, 46];
const cassette = [11, 13, 15, 17, 19, 22, 25, 28, 32, 36];
const gears = chainrings.flatMap(chainring => {
  return cassette.map(cog => {
    const gearRatio = chainring / cog;
    const development = Math.PI * 0.68 * gearRatio;

    return {
      front: chainring,
      rear: cog,
      speeds: [development * 60 * 60 / 1000, development * 60 * 90 / 1000],
      label: `${chainring}t/${cog}t`
    };
  })
})

console.log(gears)

const xScale = scaleLinear({ range: [0, WIDTH], domain: [0, 60] });
const yScale = scaleBand({ range: [0, HEIGHT], domain: gears.map(gear => gear.label), padding: 0.5 })


function App() {
  return (
    <svg width={WIDTH} height={HEIGHT}>
      <Group>
        <Grid
          xScale={xScale}
          yScale={yScale}
          width={WIDTH}
          height={HEIGHT}
          numTicksRows={gears.length}
          numTicksColumns={60 / 5}
        />
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
