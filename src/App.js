import { getBestGearPath } from "./Gearing";
import Chart from "./Chart";
import { useState } from "react";

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
  const [minRPM, setMinRPM] = useState(85);
  const [maxRPM, setMaxRPM] = useState(100);
  return (
    <>
      <div>
        RPM:
        <input
          type="number"
          value={minRPM}
          onChange={(event) => {
            setMinRPM(event.target.value);
          }}
          min={50}
          max={maxRPM}
          step={1}
        />
        <input
          type="number"
          value={maxRPM}
          onChange={(event) => {
            setMaxRPM(event.target.value);
          }}
          min={minRPM + 5}
          max={120}
          step={1}
        />
      </div>
      <Chart
        gears={gears}
        bailOutRPM={50}
        minRPM={minRPM}
        maxRPM={maxRPM}
        margin={{ top: 40, right: 10, bottom: 50, left: 60 }}
        width={1000}
        height={400}
      />
    </>
  );
}

export default App;
