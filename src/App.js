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
import DrivetrainForm from "./DrivetrainForm";
import { parse, stringify } from "urlon";

const sampleDrivetrains = [
  new Drivetrain({
    id: 0,
    label: "Marin Nicasio 2",
    fronts: [30, 46],
    rears: [11, 13, 15, 17, 19, 22, 25, 28, 32, 36],
    beadSeatDiameter: Meters(0.584),
    tireWidth: Meters(0.048),
    crankLength: Meters(0.17),
    useBestPath: true,
  }),

  /*
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
  }),*/
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

function serialize(drivetrains) {
  const query = stringify(
    drivetrains.map((drivetrain) => drivetrain.urlSerialize)
  );
  const url = new URL(window.location);
  url.search = query;
  return url;
}

function deserialize(url) {
  const drivetrains = parse(url.search.slice(1));
  return drivetrains.map((x) => Drivetrain.urlDeserialize(x));
}

function App() {
  const defaultDrivetrains = deserialize(window.location);
  const [drivetrains, setDrivetrains] = useState(
    defaultDrivetrains.length === 0
      ? [sampleDrivetrains[0]]
      : defaultDrivetrains
  );
  useEffect(() => {
    window.history.pushState({}, "", serialize(drivetrains));
  }, [drivetrains]);
  useEffect(() => {
    function handle(event) {
      setDrivetrains(deserialize(event.target.location));
    }
    window.addEventListener("popstate", handle);
    return () => {
      window.removeEventListener("popstate", handle);
    };
  }, []);

  return (
    <>
      <DrivetrainForm value={drivetrains} onChange={setDrivetrains} />
      <Table drivetrains={drivetrains} />
    </>
  );
}

export default App;
