import styles from "./Showcase.module.css";
import Table, { metrics } from "./Table";
import { useCallback, useState } from "react";

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
    <div>
      <h2>{drivetrain.params.label}</h2>
      <div>
        <Table drivetrain={drivetrain} valueFunc={metric.value} />
      </div>
    </div>
  );
}

function MetricSelector({ value, onChange, setHover }) {
  return (
    <div>
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
