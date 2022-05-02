import "./DrivetrainForm.css";
import { Drivetrain, Meters } from "./Gearing";
import { range } from "d3-array";
import { useCallback, useEffect, useState, useRef, Fragment } from "react";
import Table from "./Table";
import { RatioFormatter, SpeedFormatter } from "./Utils";
import { scaleSequential } from "d3-scale";
import { interpolateLab } from "d3-interpolate";

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
  const [label, setLabel] = useState(value.params.label);
  const [crank, setCrank] = useState(value.params.crankLength.mm);
  const [bsd, setBsd] = useState(value.params.beadSeatDiameter.mm);
  const [tire, setTire] = useState(value.params.tireWidth.mm);

  return (
    <>
      <Cells drivetrain={value} />
    </>
  );
}

function Cells({ drivetrain }) {
  return (
    <table className="cells" border="1">
      <tbody>
        {drivetrain.byChainring.map((gears, index) => (
          <Fragment key={index}>
            <tr>
              <th scope="row" rowspan={4}>
                {gears[0].params.front}t
              </th>
              {gears.map((gear) => (
                <td key={gear.key}>{gear.params.rear}t</td>
              ))}
              <th />
            </tr>
            <tr>
              {gears.map((gear) => (
                <td key={gear.key}>{RatioFormatter.format(gear.gainRatio)}</td>
              ))}
              <th scope="row">Gain Ratio</th>
            </tr>
            <tr>
              {gears.map((gear) => (
                <td key={gear.key}>
                  {SpeedFormatter.format(gear.perHourSpeedAtRPM(85).km)}
                </td>
              ))}
              <th scope="row">85 RPM km/h</th>
            </tr>
            <tr>
              {gears.map((gear) => (
                <td key={gear.key}>
                  {SpeedFormatter.format(gear.perHourSpeedAtRPM(95).km)}
                </td>
              ))}
              <th scope="row">95 RPM km/h</th>
            </tr>
          </Fragment>
        ))}
      </tbody>
    </table>
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
