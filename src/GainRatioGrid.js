import { Group } from "@visx/group";
import { range, sum, extent } from "d3-array";
import { scaleLog, scaleQuantize } from "d3-scale";
import { Fragment } from "react";

function GainRatioGrid({ drivetrains, width }) {
  const rowPositions = drivetrains.map(
    (drivetrain) => drivetrain.byChainring.length
  );
  const numRows = sum(rowPositions) + (drivetrains.length - 1) * 2;
  const ratioExtent = extent(
    drivetrains.flatMap(({ gears }) => gears.map(({ gainRatio }) => gainRatio))
  );
  const percentStep = 1.1;
  const numCols = Math.ceil(
    Math.log(Math.ceil(ratioExtent[1])) / Math.log(percentStep)
  );
  const length = Math.floor(width / (numCols + 1));

  const xScale = scaleLog().base(percentStep).domain(ratioExtent).range([0, 1]);
  const quantize = scaleQuantize()
    .domain(xScale.range())
    .range(range(0, width, length));

  const height = numRows * length;
  const stroke = "#E8EFF2";

  return (
    <svg width={width + 2} height={height + 2}>
      <Group left={1} top={1}>
        {drivetrains.map((drivetrain, index) => {
          const y = sum(rowPositions.slice(0, index)) + index * 2;
          return (
            <Cells
              drivetrain={drivetrain}
              key={drivetrain.params.id}
              y={y}
              length={length}
              xScale={(x) => quantize(xScale(x))}
            />
          );
        })}
        {quantize
          .range()
          .concat([width])
          .map((pos) => {
            return (
              <Fragment key={pos}>
                <line x1={pos} x2={pos} y1={0} y2={height} stroke={stroke} />
                <line x1={0} x2={width} y1={pos} y2={pos} stroke={stroke} />
              </Fragment>
            );
          })}
      </Group>
    </svg>
  );
}

function Cells({ drivetrain, y, length, xScale }) {
  return (
    <>
      {drivetrain.byChainring.flatMap((gears, frontPos) => {
        return gears.map((gear) => {
          return (
            <rect
              key={`${y}-${frontPos}-${gear.gainRatio}`}
              x={xScale(gear.gainRatio)}
              y={(y + frontPos) * length}
              width={length}
              height={length}
              fill="rgba(0, 108, 122, 0.7)"
            />
          );
        });
      })}
    </>
  );
}

export default GainRatioGrid;
