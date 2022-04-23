import "./Table.css";
import { Fragment } from "react";

function Table({ drivetrains, columns = 20 }) {
  const ratios = drivetrains.flatMap(({ ratioExtent }) => ratioExtent);
  const minRatio = Math.min(...ratios);
  const maxRatio = Math.min(...ratios);

  return (
    <div className="table">
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
          <div key={rear} style={{ gridColumn: index + 2 }}>
            {rear}t
          </div>
        ))}
      {drivetrain.byChainring.map((gears) => {
        const frontTeeth = gears[0].params.front;
        return (
          <Fragment key={frontTeeth}>
            <div style={{ gridColumn: 1 }}>{frontTeeth}t</div>
            {gears.map((gear) => (
              <div key={gear.params.rearPos}>
                {RatioFormatter.format(gear.gainRatio)}
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
