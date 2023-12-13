import styles from "./Showcase.module.css";
import { metrics } from "./Table";
import { Fragment, useState } from "react";

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
  return (
    <>
      <div className={styles.labelDrivetrain}>{drivetrain.params.label}</div>
      {drivetrain.params.rears
        .slice()
        .reverse()
        .map((rear) => (
          <div key={rear} className={styles.labelRearRow}>
            {rear}t
          </div>
        ))}
      {drivetrain.byChainring.map((byHubRatio) => {
        return byHubRatio.map((gears) => {
          const {front, hubRatio} = gears[0].params;
          return (
            <Fragment key={`${front} ${hubRatio}`}>
              <div className={styles.labelFront}>{front}t</div>
              <div className={styles.labelRatio}>{hubRatio}</div>
              {gears.map((gear) => (
                <div key={gear.gainRatio}>{metric.value(gear)}</div>
              ))}
            </Fragment>
          );
        });
      })}
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
