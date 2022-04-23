import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { createContext, useContext, Fragment, useState } from "react";
import { AxisBottom, AxisTop } from "@visx/axis";
import { extent } from "d3-array";
import { Brush } from "@visx/brush";
import { Text } from "@visx/text";
import { GridColumns } from "@visx/grid";
import { Line } from "@visx/shape";

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

function FaintLine(props) {
  return (
    <Line {...props} stroke="#999" strokeWidth={1} strokeLinecap="round" />
  );
}

function Label({ text, x0, x1, y, textWidth = 40 }) {
  const middle = (x0 + x1) / 2;
  const lineWidth = Math.max(0, x1 - x0 - textWidth) / 2;

  return (
    <>
      <FaintLine from={{ x: x0, y }} to={{ x: x0 + lineWidth, y }} />
      <FaintLine
        from={{
          x: x1 - lineWidth,
          y,
        }}
        to={{ x: x1, y }}
      />
      <Text
        fontSize={13}
        x={middle}
        y={y}
        verticalAnchor="middle"
        textAnchor="middle"
      >
        {text}
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
        const topY = yScale(drivetrain.title) + yScale.bandwidth() / 2 - 35;
        return (
          <Fragment key={drivetrain.title}>
            {drivetrain.byChainring.map((gears) => {
              const best = gears.filter(({ inBestPath, gainRatio }) => {
                return (
                  inBestPath &&
                  gainRatio >= selectedDomain[0] &&
                  gainRatio <= selectedDomain[1]
                );
              });
              if (!best.length) {
                return null;
              }
              const x0 = xScale(best[0].gainRatio) - 6;
              const x1 = xScale(best[best.length - 1].gainRatio) + 6;
              const text = `${best[0].params.front}t`;
              return <Label key={text} x0={x0} x1={x1} y={topY} text={text} />;
            })}

            <Points drivetrain={drivetrain} xScale={xScale} yScale={yScale}>
              {(x, y, gear) => (
                <>
                  <circle cx={x} cy={y} r={6} fill={palette[index]} />
                  <Text
                    y={y - 3}
                    x={x}
                    fontSize={12}
                    dy="-2em"
                    fill="black"
                    verticalAnchor="middle"
                    textAnchor="middle"
                  >
                    {gear.params.rear}
                  </Text>
                  <Text
                    y={y - 3}
                    x={x}
                    fontSize={12}
                    dy="-1em"
                    fill="black"
                    verticalAnchor="middle"
                    textAnchor="middle"
                  >
                    {gear.gainRatio.toFixed(2)}
                  </Text>
                </>
              )}
            </Points>
          </Fragment>
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
      {drivetrain.gears.map((gear) => {
        const x = xScale(gear.gainRatio);
        const y = yScale(drivetrain.title) + yScale.bandwidth() / 2;
        return <Fragment key={gear.gainRatio}>{children(x, y, gear)}</Fragment>;
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
