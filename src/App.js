import { getBestGearPath } from "./Gearing";
import Chart from "./Chart";

function calcs(gear, redundant) {
  const { front, rear, ratio } = gear;
  const development = Math.PI * 0.68 * ratio;
  const speedAt1RPM = (development * 60) / 1000;
  return { ...gear, speedAt1RPM, label: `${front}/${rear}t`, redundant };
}

const chainrings = [30, 46]; // [22, 32, 44].reverse();
const cassette = [11, 13, 15, 17, 19, 22, 25, 28, 32, 36].reverse(); //[11, 13, 15, 17, 20, 23, 26, 32].reverse();
const bestPath = getBestGearPath(chainrings, cassette);
const gears = bestPath.map((g) => calcs(g, false));

function App() {
  return (
    <Chart
      gears={gears}
      bailOutRPM={50}
      minRPM={85}
      maxRPM={100}
      margin={{ top: 40, right: 10, bottom: 50, left: 60 }}
      width={1000}
      height={500}
    />
  );
}

export default App;
