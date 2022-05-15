import styles from "./Showcase.module.css";
import Table, { metrics } from "./Table";
import { useCallback, useState } from "react";

export default function Showcase({ drivetrains }) {
  const [metric, setMetric] = useState(metrics[0]);

  return (
    <>
      <MetricSelector value={metric} onChange={setMetric} />

      <div className={styles.container}>
        {drivetrains.map((drivetrain) => (
          <Drivetrain
            key={drivetrain.params.id}
            drivetrain={drivetrain}
            metric={metric}
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

function MetricSelector({ value, onChange }) {
  return (
    <div>
      {metrics.map((metric) => (
        <label key={metric.label}>
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
