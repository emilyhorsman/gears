import styles from "./Showcase.module.css";
import Table from "./Table";

export default function Showcase({ drivetrains }) {
  return (
    <div className={styles.container}>
      {drivetrains.map((drivetrain) => (
        <Drivetrain key={drivetrain.params.id} drivetrain={drivetrain} />
      ))}
    </div>
  );
}

function Drivetrain({ drivetrain }) {
  return (
    <div>
      <h2>{drivetrain.params.label}</h2>
      <div>
        <Table drivetrain={drivetrain} />
      </div>
    </div>
  );
}
