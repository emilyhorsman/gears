import "./App.css";
import { Drivetrain, Meters } from "./Gearing";
import { useEffect, useRef, useState } from "react";
import * as React from "react";
import DrivetrainForm from "./DrivetrainForm";
import { parse, stringify } from "urlon";
import { usePrevious } from "./Utils";
import Showcase from "./Showcase";

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
      <Showcase drivetrains={drivetrains} />
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

    const prevSerialized = serialize(prevValue);
    if (serialized === prevSerialized) {
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
  }, [onChange]);
}

export default App;
