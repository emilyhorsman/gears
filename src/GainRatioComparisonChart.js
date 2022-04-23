import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { createContext, useContext, Fragment, useState } from "react";
import { AxisBottom, AxisTop } from "@visx/axis";
import { extent } from "d3-array";
import { PatternLines } from "@visx/pattern";
import { Brush } from "@visx/brush";

const ChartContext = createContext({});

const margin = {
  top: 40,
  bottom: 30,
  right: 10,
  left: 10,
};

function GainRatioComparisonChart({ drivetrains, width, height }) {
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const [selectedDomain, setSelectedDomain] = useState([1, 4]);
  const ratios = drivetrains.flatMap(({ gears }) =>
    gears.map(({ gainRatio }) => gainRatio)
  );
  const globalDomain = extent(ratios);
  const brushHeight = 60;
  const brushGap = 30;

  return (
    <ChartContext.Provider value={{ width, height, xMax, yMax }}>
      <ChartShell>
        <ZoomedView
          drivetrains={drivetrains}
          endY={height - brushHeight - brushGap}
          selectedDomain={selectedDomain}
        />
        <GlobalView
          drivetrains={drivetrains}
          height={brushHeight}
          globalDomain={globalDomain}
          selectedDomain={selectedDomain}
          setSelectedDomain={setSelectedDomain}
        />
      </ChartShell>
    </ChartContext.Provider>
  );
}

function ZoomedView({ drivetrains, endY, selectedDomain }) {
  const { xMax } = useContext(ChartContext);

  const xScale = scaleLinear({
    range: [0, xMax],
    domain: selectedDomain,
  });
  const yScale = scaleBand({
    range: [0, endY - 50],
    domain: drivetrains.map((drivetrain) => drivetrain.title),
  });

  return (
    <>
      <AxisTop scale={xScale} top={0} label="Gain Ratio" />

      {drivetrains.map((drivetrain) => {
        return (
          <Points
            key={drivetrain.title}
            drivetrain={drivetrain}
            xScale={xScale}
            yScale={yScale}
          >
            {(x, y) => (
              <circle
                cx={x}
                cy={y + yScale.bandwidth() / 2}
                r={6}
                fill="black"
              />
            )}
          </Points>
        );
      })}
    </>
  );
}

function GlobalView({
  drivetrains,
  height,
  globalDomain,
  selectedDomain,
  setSelectedDomain,
}) {
  const { xMax, yMax } = useContext(ChartContext);

  const xScale = scaleLinear({
    range: [0, xMax],
    domain: globalDomain,
    nice: true,
  });
  const yScale = scaleBand({
    range: [yMax - height, yMax],
    domain: drivetrains.map((drivetrain) => drivetrain.title),
    padding: 0.1,
  });

  return (
    <>
      {drivetrains.map((drivetrain) => {
        return (
          <Points
            key={drivetrain.title}
            drivetrain={drivetrain}
            xScale={xScale}
            yScale={yScale}
          >
            {(x, y) => (
              <circle
                cx={x}
                cy={y + yScale.bandwidth() / 2}
                r={3}
                fill="black"
              />
            )}
          </Points>
        );
      })}

      <AxisBottom scale={xScale} top={yMax} />

      <PatternLines
        id="brush"
        height={8}
        width={8}
        stroke="black"
        strokeWidth={1}
        orientation={["diagonal"]}
      />
      <Group top={yMax - height}>
        <Brush
          xScale={xScale}
          yScale={yScale}
          width={xMax}
          height={height}
          brushDirection="horizontal"
          initialBrushPosition={{
            start: { x: xScale(selectedDomain[0]) },
            end: { x: xScale(selectedDomain[1]) },
          }}
          selectedBoxStyle={{ fill: "url(#brush)", stroke: "magenta" }}
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
          //useWindowMoveEvents
        />
      </Group>
    </>
  );
}

function Points({ drivetrain, xScale, yScale, children }) {
  return (
    <>
      {drivetrain.gears.map((gear) => {
        const x = xScale(gear.gainRatio);
        const y = yScale(drivetrain.title);
        return <Fragment key={gear.gainRatio}>{children(x, y)}</Fragment>;
      })}
    </>
  );
}

function ChartShell({ children }) {
  const { width, height } = useContext(ChartContext);
  return (
    <svg width={width} height={height} style={{ border: "1px solid black" }}>
      <Group left={margin.left} top={margin.top}>
        {children}
      </Group>
    </svg>
  );
}

export default GainRatioComparisonChart;
