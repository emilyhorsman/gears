import "./Table.css";
import { Fragment } from "react";

function Table({ drivetrains }) {
  const maxRearGears = Math.max(
    ...drivetrains.map(({ params: { rears } }) => rears.length)
  );

  return (
    <div
      className="table"
      style={{
        gridTemplateColumns: `repeat(${maxRearGears + 1}, min-content)`,
      }}
    >
      {drivetrains.map((drivetrain) => (
        <Drivetrain drivetrain={drivetrain} key={drivetrain.title} />
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
          <Fragment key={frontTeeth}>
            <div style={{ gridColumn: 1 }} className="front">
              {frontTeeth}t
            </div>
            {gears.map((gear, index) => (
              <div
                key={gear.params.rearPos}
                className={gear.inBestPath ? "best gear" : "gear"}
              >
                <div>{RatioFormatter.format(gear.gainRatio)}</div>
                {index > 0 && (
                  <div>
                    {PercentageFormatter.format(
                      gear.percentHarderThan(gears[index - 1])
                    )}
                  </div>
                )}
              </div>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

const RatioFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const SpeedFormatter = new Intl.NumberFormat(undefined, {
  style: "unit",
  unit: "kilometer-per-hour",
  maximumFractionDigits: 1,
});
const PercentageFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1,
});

export default Table;
