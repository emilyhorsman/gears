import { Brush } from "@visx/brush";

import { GlyphSeries, XYChart, Axis, DataContext } from "@visx/xychart";
import { useState, useContext, Fragment } from "react";

const accessors = {
  xAccessor: (gear) => gear.gainRatio,
  yAccessor: (gear) => gear.drivetrainFrontKey,
};

function GainRatio({ drivetrains, width, height }) {
  const [selectedDomain, setSelectedDomain] = useState([1, 3]);

  const yDomain = drivetrains
    .flatMap((drivetrain) => {
      return drivetrain.params.fronts.map((front) => {
        return `${drivetrain.params.id} ${front}`;
      });
    })
    .reverse();

  return (
    <>
      <SelectedView
        drivetrains={drivetrains}
        width={width}
        height={height}
        selectedDomain={selectedDomain}
        yDomain={yDomain}
      />
      <SelectionView
        drivetrains={drivetrains}
        width={width}
        yDomain={yDomain}
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
      />
    </>
  );
}

function SelectedView({ drivetrains, width, height, selectedDomain, yDomain }) {
  const data = drivetrains
    .flatMap(({ gearsGroupedByChainring }) => gearsGroupedByChainring)
    .filter(
      (gear) =>
        gear.gainRatio >= selectedDomain[0] &&
        gear.gainRatio <= selectedDomain[1]
    );
  return (
    <XYChart
      height={height}
      width={width}
      xScale={{
        type: "linear",
        nice: true,
        zero: false,
        domain: selectedDomain,
      }}
      yScale={{ type: "point", domain: yDomain, padding: 0.2, align: 0 }}
    >
      <Axis orientation="bottom" />
      <Axis orientation="left" />
      <GlyphSeries dataKey="ratios" data={data} {...accessors} />
    </XYChart>
  );
}

function SelectionView({
  drivetrains,
  width,
  selectedDomain,
  setSelectedDomain,
  yDomain,
}) {
  return (
    <XYChart
      height={200}
      width={width}
      xScale={{ type: "linear", nice: true, zero: false }}
      yScale={{ type: "point", domain: yDomain, padding: 0.2, align: 0 }}
      margin={{ top: 10, bottom: 20, left: 10, right: 10 }}
      captureEvents={false}
    >
      <Axis orientation="bottom" />
      <Plot drivetrains={drivetrains} />
      <Selector
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
      />
    </XYChart>
  );
}

function Plot({ drivetrains }) {
  return (
    <GlyphSeries
      dataKey="ratios"
      data={drivetrains.flatMap(
        ({ gearsGroupedByChainring }) => gearsGroupedByChainring
      )}
      {...accessors}
    />
  );
}

function Selector({ selectedDomain, setSelectedDomain }) {
  const { xScale, yScale, width, height, margin } = useContext(DataContext);
  if (!xScale || !yScale) {
    return null;
  }

  return (
    <Brush
      xScale={xScale}
      yScale={yScale}
      width={width}
      height={height - margin.bottom}
      brushDirection="horizontal"
      initialBrushPosition={{
        start: { x: xScale(selectedDomain[0]) },
        end: { x: xScale(selectedDomain[1]) },
      }}
      onChange={(domain) => {
        if (!domain) {
          return;
        }
        const { x0, x1 } = domain;
        setSelectedDomain([
          Math.max(x0, xScale.domain()[0]),
          Math.min(x1, xScale.domain()[1]),
        ]);
      }}
      useWindowMoveEvents
    />
  );
}

export default GainRatio;
