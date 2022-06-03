import styles from "./Showcase.module.css";
import Table, { metrics } from "./Table";
import { Fragment, useCallback, useState } from "react";

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
      {drivetrain.byChainring.map((gears) => {
        const frontTeeth = gears[0].params.front;
        return (
          <Fragment key={frontTeeth}>
            <div className={styles.labelFront}>{frontTeeth}t</div>
            {gears.map((gear) => (
              <div key={gear.gainRatio}>{metric.value(gear)}</div>
            ))}
          </Fragment>
        );
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
