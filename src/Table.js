import "./Table.css";
import { RatioFormatter, GearInchesFormatter } from "./Utils";
import { Fragment } from "react";

function Table({ drivetrains }) {
  const maxRearGears = Math.max(
    ...drivetrains.map(({ params: { rears } }) => rears.length)
  );

  return (
    <div
      className="table"
      style={{
        gridTemplateColumns: `repeat(${maxRearGears + 1}, max-content)`,
      }}
    >
      {drivetrains.map((drivetrain) => (
        <Drivetrain drivetrain={drivetrain} key={drivetrain.params.id} />
      ))}
    </div>
  );
}

function Drivetrain({ drivetrain }) {
  return (
    <>
      <div className="title">{drivetrain.title}</div>
      {drivetrain.params.rears
        .slice()
        .reverse()
        .map((rear, index) => (
          <div key={rear} style={{ gridColumn: index + 2 }} className="rear">
            {rear}t
          </div>
        ))}
      {drivetrain.byChainring.map((gears) => {
        const frontTeeth = gears[0].params.front;
        return (
          <Fragment key={`${drivetrain.id}-${frontTeeth}`}>
            <div style={{ gridColumn: 1 }} className="front">
              {frontTeeth}t
            </div>
            {gears.map((gear) => (
              <div key={gear.gainRatio}>
                {RatioFormatter.format(gear.gainRatio)}
                <br />
                {GearInchesFormatter.format(gear.gearInches)}"
                <br />
                {GearInchesFormatter.format(gear.development.m)} m
              </div>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

export default Table;
