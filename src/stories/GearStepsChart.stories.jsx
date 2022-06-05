import React from "react";
import GearStepsChart from "../GearStepsChart";
import {Drivetrain, Meters} from "../Gearing";

export default {
  title: "GearStepsChart",
  component: GearStepsChart,
};

const Template = (args) => <GearStepsChart {...args} gears={(
  new Drivetrain({
    id: 0,
    label: "Bike 0",
    fronts: [30, 46],
    rears: [11, 13, 15, 17, 19, 22, 25, 28, 32, 36],
    beadSeatDiameter: Meters(0.584),
    tireWidth: Meters(0.048),
    crankLength: Meters(0.17),
    useBestPath: true,
  })).gears} />;

export const Primary = Template.bind({});
Primary.args = {
};
