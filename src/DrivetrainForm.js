import { Drivetrain, Meters } from "./Gearing";
import { range } from "d3-array";
import { useCallback, useEffect, useState, useRef } from "react";

function DrivetrainForm({ value, onChange }) {
  const handleFrontsChange = useCallback(
    (fronts) => {
      return onChange(new Drivetrain({ ...value.params, fronts }));
    },
    [onChange]
  );
  const handleRearsChange = useCallback(
    (rears) => {
      return onChange(new Drivetrain({ ...value.params, rears }));
    },
    [onChange]
  );
  const [crank, setCrank] = useState(value.params.crankLength.mm);
  const [wheelRadius, setWheelRadius] = useState(value.params.wheelRadius.mm);

  return (
    <>
      <label>
        Front Teeth
        <ArrayInput
          value={value.params.fronts}
          onChange={handleFrontsChange}
          className="input-fronts"
        />
      </label>

      <label>
        Rear Teeth
        <ArrayInput
          value={value.params.rears}
          onChange={handleRearsChange}
          className="input-rears"
        />
      </label>
      <label>
        Crank Length (mm)
        <input
          type="number"
          className="input-small"
          min={0}
          value={crank}
          onChange={(event) => setCrank(event.target.value)}
          onBlur={() => {
            if (Number.isNaN(crank)) {
              return;
            }

            onChange(
              new Drivetrain({
                ...value.params,
                crankLength: Meters(crank / 1000),
              })
            );
          }}
        />
      </label>
      <label>
        Wheel Radius (mm)
        <input
          type="number"
          className="input-small"
          min={0}
          value={wheelRadius}
          onChange={(event) => setWheelRadius(event.target.value)}
          onBlur={() => {
            if (Number.isNaN(wheelRadius)) {
              return;
            }

            onChange(
              new Drivetrain({
                ...value.params,
                wheelRadius: Meters(wheelRadius / 1000),
              })
            );
          }}
        />
      </label>
    </>
  );
}

function ArrayInput({ value, onChange, ...props }) {
  const [text, setText] = useState(value.join(", "));
  const prevValue = useRef();
  useEffect(() => {
    prevValue.current = value;
  });
  useEffect(() => {
    // Make this component fully controlled but only update the text if the semantic
    // value received from above is different.
    if (!arrayEq(prevValue.current, value)) {
      setText(value.join(", "));
      prevValue.current = value;
    }
  }, [value]);

  return (
    <input
      type="text"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={(event) => {
        const candidate = convert(text);
        if (candidate != null) {
          onChange(candidate);
        }
      }}
      {...props}
    />
  );
}

function arrayEq(a, b) {
  if (a.length !== b.length) {
    return false;
  }
  return range(0, a.length).every((i) => a[i] === b[i]);
}

function convert(text) {
  const arr = text.match(/\d+/g).map((x) => Number(x));
  for (let i = 0; i < arr.length; i++) {
    if (Number.isNaN(arr[i]) || (i > 0 && arr[i] <= arr[i - 1])) {
      return null;
    }
  }
  return arr;
}

export default DrivetrainForm;
