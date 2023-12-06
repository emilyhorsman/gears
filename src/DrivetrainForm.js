import { Drivetrain, Meters } from "./Gearing";
import { range } from "d3-array";
import { useCallback, useEffect, useState, useRef } from "react";
import styles from "./DrivetrainForm.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone, faTrashCan } from "@fortawesome/free-regular-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { offset, shift, useFloating, arrow } from "@floating-ui/react-dom";

const DEFAULT_PARAMS = {
  fronts: [34, 50],
  rears: [11, 12, 13, 15, 17, 19, 22, 25, 28, 32],
  hubRatios: null,
  beadSeatDiameter: Meters(0.584),
  tireWidth: Meters(0.048),
  crankLength: Meters(0.17),
};

function getNewId(value) {
  return range(0, value.length + 1).find((id) => {
    return value.every((drivetrain) => drivetrain.params.id !== id);
  });
}

function DrivetrainForm({ value, onChange }) {
  const handleAddDrivetrain = useCallback(() => {
    const newId = getNewId(value);
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

  const handleCopyDrivetrain = (drivetrain) => {
    const newId = getNewId(value);
    onChange(
      value.concat([
        new Drivetrain({
          ...drivetrain.params,
          id: newId,
          label: `Bike ${newId}`,
        }),
      ])
    );
  };

  return (
    <div className={styles.grid}>
      <Header>Name</Header>
      <Header>Front</Header>
      <Header>Rear</Header>
      <Header>Hub Ratios</Header>
      <Header tooltip="Crank Length (mm)">Crank</Header>
      <Header tooltip="Bead Seat Diameter">BSD</Header>
      <Header tooltip="Tire Width">Tire</Header>
      <div />
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
            onCopy={() => handleCopyDrivetrain(drivetrain)}
          />
        );
      })}
      <div className={styles.footer}>
        <button
          type="button"
          onClick={handleAddDrivetrain}
          className="icon-button"
          title="Compare Another Drivetrain"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
    </div>
  );
}

function Header({ children, tooltip }) {
  const arrowRef = useRef(null);
  const {
    x,
    y,
    reference,
    floating,
    strategy,
    middlewareData: { arrow: { x: arrowX } = {} },
  } = useFloating({
    placement: "bottom",
    strategy: "fixed",
    middleware: [
      offset(5),
      shift({ padding: 5 }),
      arrow({ element: arrowRef }),
    ],
  });
  const [isActive, setIsActive] = useState(false);

  return (
    <div
      className={styles.header}
      ref={reference}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
    >
      {children}
      {tooltip && (
        <span
          className={styles.tooltip}
          ref={floating}
          style={{
            position: strategy,
            left: x,
            top: y,
            visibility: isActive ? "visible" : "hidden",
          }}
          role="tooltip"
        >
          {tooltip}
          <div
            className={styles.arrow}
            ref={arrowRef}
            style={{ top: -8, left: arrowX }}
          />
        </span>
      )}
    </div>
  );
}

function useStateWithSyncedDefault(upstream) {
  const [value, onChange] = useState(upstream);
  useEffect(() => {
    if (value !== upstream) {
      onChange(upstream);
    }
  }, [upstream]);

  return [value, onChange];
}

function DrivetrainRowForm({ value, onChange, canRemove, onCopy }) {
  const handleFrontsChange = useCallback(
    (fronts) => {
      return onChange(new Drivetrain({ ...value.params, fronts }));
    },
    [onChange, value.params]
  );
  const handleRearsChange = useCallback(
    (rears) => {
      return onChange(new Drivetrain({ ...value.params, rears }));
    },
    [onChange, value.params]
  );
  const handleHubRatiosChange = useCallback(
    (hubRatios) => {
      return onChange(new Drivetrain({ ...value.params, hubRatios }));
    },
    [onChange, value.params]
  );
  const [label, setLabel] = useStateWithSyncedDefault(value.params.label);
  const [crank, setCrank] = useStateWithSyncedDefault(
    value.params.crankLength.mm
  );
  const [bsd, setBsd] = useStateWithSyncedDefault(
    value.params.beadSeatDiameter.mm
  );
  const [tire, setTire] = useStateWithSyncedDefault(value.params.tireWidth.mm);

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
      <ArrayInput value={value.params.hubRatios} onChange={handleHubRatiosChange} />
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
      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCopy}
          className="icon-button"
          title="Duplicate"
        >
          <FontAwesomeIcon icon={faClone} />
        </button>
        <button
          type="button"
          disabled={!canRemove}
          onClick={() => onChange(null)}
          className="icon-button"
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrashCan} />
        </button>
      </div>
    </>
  );
}

function ArrayInput({ value, onChange, ...props }) {
  const [text, setText] = useState(value == null ? "" : value.join(", "));
  useEffect(() => {
    const newText = value == null ? "" : value.join(", ");
    const oldText = convert(text) ?? "";
    // Make this component fully controlled but only update the text if the semantic
    // value received from above is different.
    if (oldText != newText) {
      setText(newText);
    }
  }, [value]);

  return (
    <input
      type="text"
      value={text}
      onChange={(event) => setText(event.target.value)}
      onBlur={(event) => {
        const candidate = convert(text);
        console.log({candidate, text})
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
  if (!text) {
    return null;
  }

  const arr = text.match(/(\d(\.\d+)?)+/g).map((x) => Number(x));
  for (let i = 0; i < arr.length; i++) {
    if (Number.isNaN(arr[i]) || (i > 0 && arr[i] <= arr[i - 1])) {
      return null;
    }
  }
  return arr;
}

export default DrivetrainForm;
