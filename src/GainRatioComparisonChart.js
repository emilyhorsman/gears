import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { createContext, useContext, Fragment, useState } from "react";
import { AxisBottom, AxisTop } from "@visx/axis";
import { extent } from "d3-array";
import { Brush } from "@visx/brush";
import { Text } from "@visx/text";
import { GridColumns } from "@visx/grid";
import { Line } from "@visx/shape";
import { scaleLog, scaleSequential } from "d3-scale";
import { interpolateLab } from "d3-interpolate";

const ChartContext = createContext({});
const palette = ["#2E78D2", "#FF7043", "#26C6DA", "#4B636E"];

const margin = {
  top: 40,
  bottom: 30,
  right: 15,
  left: 15,
};

function GainRatioComparisonChart({ drivetrains, width, height }) {
  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;
  const [selectedDomain, setSelectedDomain] = useState([1, 4]);
  const ratios = drivetrains.flatMap(({ gears }) =>
    gears.map(({ gainRatio }) => gainRatio)
  );
  const globalDomain = extent(ratios);
  const brushHeight = 50;
  const brushGap = 50;

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

const teethScale = scaleLinear({
  domain: [9, 52],
  range: [8, 20],
  clamp: true,
});

function GearGlyph({ x, y, prevGear, curGear, color, xScale }) {
  const {
    gainRatio,
    params: { front, rear },
  } = curGear;
  const increase =
    prevGear == null ? null : curGear.percentHarderThan(prevGear);
  const prevX = prevGear == null ? null : xScale(prevGear.gainRatio);
  const midX = (x + prevX) / 2;

  return (
    <>
      {increase && (
        <>
          <Line
            from={{ x: midX - 20, y }}
            to={{ x: midX + 20, y }}
            strokeWidth={3}
            strokeLinecap="round"
          />
          <Text
            y={y}
            x={midX}
            fontSize={12}
            dy="-1.25em"
            fill="black"
            verticalAnchor="middle"
            textAnchor="middle"
          >
            {`${increase.toFixed(1)}%`}
          </Text>
        </>
      )}
      <circle cx={x} cy={y} fill={color} r={8} />
      <Text
        y={y}
        x={x}
        fontSize={12}
        dy="1.25em"
        fill="black"
        verticalAnchor="middle"
        textAnchor="middle"
      >
        {gainRatio.toFixed(2)}
      </Text>
    </>
  );
}

function ZoomedView({ drivetrains, endY, selectedDomain }) {
  const { xMax } = useContext(ChartContext);

  const xScale = scaleLinear({
    range: [0, xMax],
    domain: selectedDomain,
  });
  const numTicks = Math.floor(selectedDomain[1] - selectedDomain[0]) * 2;
  const yScale = scaleBand({
    range: [0, endY - 50],
    domain: drivetrains.map((drivetrain) => drivetrain.title),
  });

  return (
    <>
      <AxisTop
        scale={xScale}
        top={0}
        tickComponent={TickLabel}
        numTicks={numTicks}
      />
      <GridColumns
        scale={xScale}
        width={xMax}
        height={endY - 50}
        numTicks={numTicks}
      />

      {drivetrains.map((drivetrain, index) => {
        return (
          <Points
            drivetrain={drivetrain}
            xScale={xScale}
            yScale={yScale}
            key={drivetrain.title}
          >
            {(x, y, curGear, prevGear, xScale) => (
              <GearGlyph
                xScale={xScale}
                x={x}
                y={y}
                curGear={curGear}
                prevGear={prevGear}
                color={palette[index]}
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
    range: [0, height],
    domain: drivetrains.map((drivetrain) => drivetrain.title),
    padding: 0.1,
  });

  return (
    <Group top={yMax - height}>
      <GridColumns scale={xScale} width={xMax} height={height} />

      {drivetrains.map((drivetrain, index) => {
        return (
          <Points
            key={drivetrain.title}
            drivetrain={drivetrain}
            xScale={xScale}
            yScale={yScale}
          >
            {(x, y) => <circle cx={x} cy={y} r={3} fill={palette[index]} />}
          </Points>
        );
      })}

      <AxisBottom scale={xScale} top={height} tickComponent={TickLabel} />

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
    </Group>
  );
}

function Points({ drivetrain, xScale, yScale, children }) {
  return (
    <>
      {drivetrain.gears.map((gear, index) => {
        const x = xScale(gear.gainRatio);
        const y = yScale(drivetrain.title) + yScale.bandwidth() / 2;
        return (
          <Fragment key={gear.gainRatio}>
            {children(x, y, gear, drivetrain.gears[index - 1], xScale)}
          </Fragment>
        );
      })}
    </>
  );
}

function ChartShell({ children }) {
  const { width, height } = useContext(ChartContext);
  return (
    <svg width={width} height={height}>
      <Group left={margin.left} top={margin.top}>
        {children}
      </Group>
    </svg>
  );
}

function TickLabel({ dy, x, y, textAnchor, formattedValue }) {
  return (
    <Text x={x} y={y} dy={dy} fontSize={13} textAnchor={textAnchor}>
      {formattedValue}
    </Text>
  );
}

export default GainRatioComparisonChart;
