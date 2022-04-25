import "./App.css";
import { Drivetrain, Meters } from "./Gearing";
import Chart, { Legend } from "./Chart";
import { useEffect, useRef, useState } from "react";
import Table from "./Table";
import GainRatio from "./GainRatio";
import GainRatioChart from "./Chart";
import GainRatioComparisonChart from "./GainRatioComparisonChart";
import GearStepsChart, { GearStepsComparisonChart } from "./GearStepsChart";
import { sum, max } from "d3-array";
import { mean } from "d3-array";
import { deviation } from "d3-array";
import { scaleLinear, scaleLog } from "d3-scale";
import { extent } from "d3-array";
import { variance } from "d3-array";
import GainRatioGrid from "./GainRatioGrid";

const drivetrains = [
  new Drivetrain({
    id: 0,
    fronts: [30, 46],
    rears: [11, 13, 15, 17, 19, 22, 25, 28, 32, 36],
    wheelRadius: Meters(0.34),
    crankLength: Meters(0.17),
    useBestPath: true,
  }),

  new Drivetrain({
    id: 1,
    fronts: [20, 30, 42],
    rears: [11, 13, 15, 18, 21, 24, 28, 32, 36],
    wheelRadius: Meters(0.34),
    crankLength: Meters(0.17),
    useBestPath: true,
  }),

  new Drivetrain({
    id: 2,
    fronts: [28],
    rears: [11, 13, 15, 17, 19, 21, 24, 28, 33, 39, 45, 51],
    wheelRadius: Meters(0.34),
    crankLength: Meters(0.17),
    useBestPath: true,
  }),

  new Drivetrain({
    id: 3,
    fronts: [28],
    //rears: [11, 13, 16, 19, 22, 25, 28, 32, 36, 41, 46, 51],
    rears: [11, 14, 17, 20, 23, 26, 29, 33, 37, 42, 46, 51],
    wheelRadius: Meters(0.34),
    crankLength: Meters(0.17),
    useBestPath: true,
  }),
];

function sd(gears) {
  return variance(gears, (gear, index) => {
    if (index === 0 || gear.gainRatio > 6) {
      return undefined;
    }
    return gear.percentHarderThan(gears[index - 1]);
  });
}

function sumGears(gears) {
  return sum(gears, (gear, index) => {
    if (index === 0) {
      return undefined;
    }
    return gear.percentHarderThan(gears[index - 1]);
  });
}

function App() {
  const [minRPM, setMinRPM] = useState(85);
  const [maxRPM, setMaxRPM] = useState(100);
  const [chainrings, setChainrings] = useState([30, 46]);
  const [cassette, setCassette] = useState([
    11, 13, 15, 17, 19, 22, 25, 28, 32, 36,
  ]);
  const [useBestPath, setUseBestPath] = useState(true);
  const drivetrain = new Drivetrain({
    fronts: chainrings,
    rears: cassette,
    wheelRadius: Meters(0.34),
    crankLength: Meters(0.17),
    useBestPath,
  });

  return (
    <>
      <GainRatioGrid drivetrains={drivetrains} width={600} />
      <GearStepsComparisonChart
        a={drivetrains[3].findBestShifts(sumGears)}
        b={drivetrains[2].findBestShifts(sumGears)}
      />
      <div style={{ display: "flex" }}>
        <GearStepsChart gears={drivetrains[3].gears} />
        <GearStepsChart gears={drivetrains[2].gears} />
      </div>
      {drivetrains.map((drivetrain) => (
        <div key={drivetrain.params.id} style={{ display: "flex" }}>
          <GearStepsChart gears={drivetrain.findBestShifts(sd)} />
          <GearStepsChart gears={drivetrain.findBestShifts(sumGears)} />
        </div>
      ))}
      <Table drivetrains={drivetrains} />
    </>
  );

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
      <div>
        <ArrayInput value={chainrings} onChange={setChainrings} />
        <ArrayInput value={cassette} onChange={setCassette} />
      </div>
      <div>
        <label>
          Exclude redundant gears?
          <input
            type="checkbox"
            checked={useBestPath}
            onChange={(event) => setUseBestPath(event.target.checked)}
          />
        </label>
      </div>

      <Legend drivetrains={drivetrains} />

      <Chart
        drivetrains={drivetrains}
        drivetrain={drivetrain}
        bailOutRPM={50}
        minRPM={minRPM}
        maxRPM={maxRPM}
        margin={{ top: 10, right: 10, bottom: 50, left: 20 }}
        width={1000}
        height={500}
      />
    </>
  );
}

function ArrayInput({ value, onChange }) {
  const [text, setText] = useState(value.join(", "));
  const prevValue = useRef();
  useEffect(() => {
    prevValue.current = value;
  });
  useEffect(() => {
    // Make this component fully controlled but only update the text if the semantic
    // value received from above is different.
    if (!arrayEq(prevValue, value)) {
      setText(value.join(", "));
      prevValue.current = value;
    }
  }, [value]);

  return (
    <input
      type="text"
      value={text}
      onChange={(event) => {
        const newText = event.target.value;
        const candidate = convert(newText);
        setText(newText);
        if (candidate != null) {
          onChange(candidate);
        }
      }}
    />
  );
}

function arrayEq(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function convert(text) {
  const arr = text.split(",").map((x) => Number(x));
  for (let i = 0; i < arr.length; i++) {
    if (Number.isNaN(arr[i]) || (i > 0 && arr[i] <= arr[i - 1])) {
      return null;
    }
  }
  return arr;
}

export default App;
