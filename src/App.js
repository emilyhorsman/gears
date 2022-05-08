import "./App.css";
import { Drivetrain, Meters } from "./Gearing";
import Chart, { Legend } from "./Chart";
import { Fragment, useEffect, useRef, useState } from "react";
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
import DrivetrainForm from "./DrivetrainForm";
import { parse, stringify } from "urlon";
import { usePrevious } from "./Utils";
import GearStepsGradient, {
  GearStepsGradientLegend,
} from "./GearStepsGradient";

const SAMPLE_DRIVETRAIN = new Drivetrain({
  id: 0,
  label: "Bike 0",
  fronts: [30, 46],
  rears: [11, 13, 15, 17, 19, 22, 25, 28, 32, 36],
  beadSeatDiameter: Meters(0.584),
  tireWidth: Meters(0.048),
  crankLength: Meters(0.17),
  useBestPath: true,
});

function sd(gears) {
  return variance(gears, (gear, index) => {
    if (index === 0 || gear.gainRatio > 6) {
      return undefined;
    }
    return gear.percentHarderThan(gears[index - 1]);
  });
}

function sumGears(gears) {
  return (
    sum(gears, (gear, index) => {
      if (index === 0) {
        return undefined;
      }
      return gear.percentHarderThan(gears[index - 1]);
    }) / gears.length
  );
}

function serialize(drivetrains) {
  const query = stringify(
    drivetrains.map((drivetrain) => drivetrain.urlSerialize)
  );
  const url = new URL(window.location);
  url.search = query;
  return url;
}

function deserialize(url) {
  try {
    const drivetrains = parse(url.search.slice(1));
    return drivetrains.map((x) => Drivetrain.urlDeserialize(x));
  } catch {
    return null;
  }
}

function App() {
  const defaultDrivetrains = deserialize(window.location) ?? [
    SAMPLE_DRIVETRAIN,
  ];
  const [drivetrains, setDrivetrains] = useState(defaultDrivetrains);
  useQueryState(drivetrains, setDrivetrains);

  return (
    <>
      <DrivetrainForm value={drivetrains} onChange={setDrivetrains} />

      <div className="flex-row">
        <Table drivetrains={drivetrains} />
        <div style={{ marginLeft: 20 }}>
          <div style={{ marginBottom: 10, fontSize: 13 }}>
            Percent Harder Shift Steps
          </div>
          <div className="flex-row">
            <GearStepsGradientLegend />
            {drivetrains.map((drivetrain) => (
              <GearStepsGradient
                key={drivetrain.params.id}
                id={drivetrain.params.id}
                gears={drivetrain.findBestShifts(sumGears)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function useQueryState(value, onChange) {
  const pageRef = useRef(0);
  const prevValue = usePrevious(value);

  useEffect(() => {
    const serialized = serialize(value);

    if (prevValue == null) {
      window.history.replaceState({ page: pageRef.current }, "", serialized);
      return;
    }

    if (prevValue === value) {
      return;
    }

    const page = window.history.state?.page ?? 0;
    if (page < pageRef.current) {
      return;
    }

    window.history.pushState({ page: ++pageRef.current }, "", serialized);
  }, [prevValue, value]);

  useEffect(() => {
    function handle(event) {
      onChange(deserialize(event.target.location));
    }
    window.addEventListener("popstate", handle);
    return () => {
      window.removeEventListener("popstate", handle);
    };
  }, []);
}

export default App;
