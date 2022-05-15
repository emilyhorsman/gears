import { RatioFormatter, GearInchesFormatter } from "./Utils";

export const metrics = [
  {
    label: "Gain Ratio",
    value: (gear) => RatioFormatter.format(gear.gainRatio),
  },
  {
    label: "Gear Inches",
    value: (gear) => GearInchesFormatter.format(gear.gearInches),
  },
];

function Table({ drivetrain, valueFunc = metrics[0].value }) {
  return (
    <table>
      <thead>
        <tr>
          <th />
          {drivetrain.params.rears
            .slice()
            .reverse()
            .map((rear) => (
              <th key={rear}>{rear}t</th>
            ))}
        </tr>
      </thead>
      <tbody>
        {drivetrain.byChainring.map((gears) => {
          const frontTeeth = gears[0].params.front;
          return (
            <tr key={`${drivetrain.id}-${frontTeeth}`}>
              <th style={{ gridColumn: 1 }} className="front">
                {frontTeeth}t
              </th>
              {gears.map((gear) => (
                <td key={gear.gainRatio}>{valueFunc(gear)}</td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default Table;
