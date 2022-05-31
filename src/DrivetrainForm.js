import { Drivetrain, Meters } from "./Gearing";
import { range } from "d3-array";
import { useCallback, useEffect, useState, useRef } from "react";
import styles from "./DrivetrainForm.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone, faTrashCan } from "@fortawesome/free-regular-svg-icons";

const DEFAULT_PARAMS = {
  fronts: [34, 50],
  rears: [11, 12, 13, 15, 17, 19, 22, 25, 28, 32],
  beadSeatDiameter: Meters(0.584),
  tireWidth: Meters(0.048),
  crankLength: Meters(0.17),
};

function DrivetrainForm({ value, onChange }) {
  const handleAddDrivetrain = useCallback(() => {
    const newId = range(0, value.length + 1).find((id) => {
      return value.every((drivetrain) => drivetrain.params.id !== id);
    });
    onChange(
      value.concat([
        new Drivetrain({
          ...DEFAULT_PARAMS,
          id: newId,
          label: `Bike ${newId}`,
        }),
      ])
    );
  }, [value, onChange]);

  return (
    <div className={styles.grid}>
      {value.map((drivetrain) => {
        return (
          <DrivetrainRowForm
            key={drivetrain.params.id}
            value={drivetrain}
            canRemove={value.length > 1}
            onChange={(newDrivetrain) => {
              if (newDrivetrain === null) {
                onChange(
                  value.filter((d) => d.params.id !== drivetrain.params.id)
                );
                return;
              }

              onChange(
                value.map((d) => {
                  if (d.params.id !== drivetrain.params.id) {
                    return d;
                  }
                  return newDrivetrain;
                })
              );
            }}
          />
        );
      })}
      <div className="footer">
        <button type="button" onClick={handleAddDrivetrain}>
          Compare Another Drivetrain
        </button>
      </div>
    </div>
  );
}

function DrivetrainRowForm({ value, onChange, canRemove }) {
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
      <input
        type="text"
        maxLength={20}
        value={label}
        onChange={(event) => setLabel(event.target.value)}
        onBlur={() => {
          onChange(
            new Drivetrain({
              ...value.params,
              label,
            })
          );
        }}
      />
      <ArrayInput value={value.params.fronts} onChange={handleFrontsChange} />
      <ArrayInput value={value.params.rears} onChange={handleRearsChange} />
      <input
        type="number"
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
      <input
        type="number"
        min={0}
        value={bsd}
        onChange={(event) => setBsd(event.target.value)}
        onBlur={() => {
          if (Number.isNaN(bsd)) {
            return;
          }

          onChange(
            new Drivetrain({
              ...value.params,
              beadSeatDiameter: Meters(bsd / 1000),
            })
          );
        }}
      />
      <input
        type="number"
        min={0}
        value={tire}
        onChange={(event) => setTire(event.target.value)}
        onBlur={() => {
          if (Number.isNaN(tire)) {
            return;
          }

          onChange(
            new Drivetrain({
              ...value.params,
              tireWidth: Meters(tire / 1000),
            })
          );
        }}
      />
      <div>
        <button
          type="button"
          disabled={!canRemove}
          onClick={() => onChange(null)}
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
        <button type="button">
          <FontAwesomeIcon icon={faClone} />
        </button>
      </div>
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
