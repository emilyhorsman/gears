import { Line, LinePath } from "@visx/shape";
import { Text } from "@visx/text";
import { curveLinear } from "d3-shape";
import { Brush } from "@visx/brush";

import {
  Grid,
  GlyphSeries,
  LineSeries,
  XYChart,
  Axis,
  DataContext,
} from "@visx/xychart";
import { useState, useContext, Fragment } from "react";

const accessors = {
  xAccessor: (gear) => gear.gainRatio,
  yAccessor: (gear) => gear.drivetrainFrontKey,
};

function GainRatio({ drivetrains, width, height }) {
  const [selectedDomain, setSelectedDomain] = useState([1, 4]);

  const yDomain = drivetrains
    .flatMap((drivetrain) => {
      return drivetrain.params.fronts.map((front) => {
        return `${drivetrain.params.id} ${front}`;
      });
    })
    .reverse();

  return (
    <>
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
      <GlyphSeries
        dataKey="ratios"
        data={drivetrains.flatMap(
          ({ gearsGroupedByChainring }) => gearsGroupedByChainring
        )}
        {...accessors}
      />
      <Selector
        selectedDomain={selectedDomain}
        setSelectedDomain={setSelectedDomain}
      />
    </XYChart>
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
