import React from "react";
import {Chart} from "../Chart";
import {Drivetrain, Meters} from "../Gearing";

export default {
  title: "Chart",
  component: Chart,
};

const Template = (args) => <Chart {...args} drivetrains={[
  new Drivetrain({
    id: 0,
    label: "Bike 0",
    fronts: [30, 46],
    rears: [11, 13, 15, 17, 19, 22, 25, 28, 32, 36],
    beadSeatDiameter: Meters(0.584),
    tireWidth: Meters(0.048),
    crankLength: Meters(0.17),
    useBestPath: true,
  }),
  new Drivetrain({
    id: 0,
    label: "Bike 1",
    fronts: [32],
    rears: [11, 13, 15, 17, 19, 21, 24, 28, 33, 39, 45, 51],
    beadSeatDiameter: Meters(0.584),
    tireWidth: Meters(0.048),
    crankLength: Meters(0.17),
    useBestPath: true,
  })
]} />;

export const Primary = Template.bind({});
Primary.args = {
  width: 600,
  height: 400,
  margin: { top: 10, bottom: 50, left: 10, right: 10 },
  minRPM: 80,
  maxRPM: 90
};
