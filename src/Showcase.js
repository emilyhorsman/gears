import styles from "./Showcase.module.css";
import { metrics } from "./Table";
import { Fragment, useState } from "react";
import { PercentageFormatter, SpeedFormatter } from "./Utils";

export default function Showcase({ drivetrains }) {
  const [metric, setMetric] = useState(metrics[0]);
  const [hover, setHover] = useState(null);

  return (
    <>
      <MetricSelector value={metric} onChange={setMetric} setHover={setHover} />

      <div className={styles.container}>
        {drivetrains.map((drivetrain) => (
          <Drivetrain
            key={drivetrain.params.id}
            drivetrain={drivetrain}
            metric={hover ?? metric}
          />
        ))}
      </div>
    </>
  );
}

function Drivetrain({ drivetrain, metric }) {
  const rows = drivetrain.byChainring.flatMap((byHubRatio) => {
    return byHubRatio.map((gears) => {
      return {
        label: gears[0].rowLabel,
        gears: gears.map((gear) => metric.value(gear)),
      };
    });
  });
  const firstColWidth = Math.max(...rows.map((row) => row.label.length));
  const cogColWidth = Math.max(
    ...rows.flatMap((row) => row.gears.map((gear) => gear.length))
  );
  const rearCogs = drivetrain.params.rears
    .slice()
    .reverse()
    .map((cog) => `${cog}t`.padStart(cogColWidth, " "));

  return (
    <>
      <div>
        {drivetrain.params.label} —{" "}
        {PercentageFormatter.format(drivetrain.rangePercentage)} range,{" "}
        {SpeedFormatter.format(drivetrain.easiestGear.perHourSpeedAtRPM(60).km)}{" "}
        to{" "}
        {SpeedFormatter.format(drivetrain.hardestGear.perHourSpeedAtRPM(90).km)}
      </div>
      <div>
        {" ".repeat(firstColWidth)} {rearCogs.join(" ")}
      </div>
      {rows.map((row) => (
        <div key={row.label}>
          {row.label.padEnd(firstColWidth, " ")}{" "}
          {row.gears.map((gear) => gear.padStart(cogColWidth, " ")).join(" ")}
        </div>
      ))}
      <br />
      {drivetrain.byChainring.flatMap((byHubRatio) =>
        byHubRatio.map((gears) =>
          gears.map((gear) => {
            const minSpeed = gear.perHourSpeedAtRPM(60).km;
            const maxSpeed = gear.perHourSpeedAtRPM(90).km;
            return (
              <div key={gear.key} className={styles.cell}>
                {" ".repeat(Math.floor(minSpeed))}
                {"▨".repeat(Math.round(maxSpeed - minSpeed))}
              </div>
            );
          })
        )
      )}
      <br />
    </>
  );
}

function MetricSelector({ value, onChange, setHover }) {
  return (
    <div className={styles.metricSelector}>
      {metrics.map((metric) => (
        <label
          key={metric.label}
          onMouseEnter={() => setHover(metric)}
          onMouseLeave={() => setHover(null)}
        >
          <input
            type="radio"
            value={metric.label}
            checked={value === metric}
            onChange={() => onChange(metric)}
          />{" "}
          {metric.label}
        </label>
      ))}
    </div>
  );
}
