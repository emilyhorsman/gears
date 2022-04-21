import { getBestGearPath } from "./Gearing";
import Chart from "./Chart";
import { useEffect, useRef, useState } from "react";

function calcs(gear, redundant) {
  const { front, rear, ratio } = gear;
  const development = Math.PI * 0.68 * ratio;
  const speedAt1RPM = (development * 60) / 1000;
  return { ...gear, speedAt1RPM, label: `${front}/${rear}t`, redundant };
}

function App() {
  const [minRPM, setMinRPM] = useState(85);
  const [maxRPM, setMaxRPM] = useState(100);
  const [chainrings, setChainrings] = useState([30, 46]);
  const [cassette, setCassette] = useState([
    11, 13, 15, 17, 19, 22, 25, 28, 32, 36,
  ]);
  const bestPath = getBestGearPath(chainrings, cassette);
  const gears = bestPath.map((g) => calcs(g, false));

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
        Gear Range:{" "}
        {Math.round((100 * gears[gears.length - 1].ratio) / gears[0].ratio)}%
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

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

function arrayEq(a, b) {
  if (a.length != b.length) {
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
