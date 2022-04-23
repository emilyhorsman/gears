import { scaleLog } from "d3-scale";

export function Meters(meters) {
  return {
    m: meters,
    km: meters / 1000,
  };
}

export class Gear {
  constructor(params) {
    this.params = params;
    const { front, rear, wheelRadius, crankLength } = params;

    const radiusRatio = wheelRadius.m / crankLength.m;
    const gearRatio = front / rear;
    this.gainRatio = radiusRatio * gearRatio;
    // The gain ratio describes how much the bike travels per unit of travel around the crank orbit.
    const crankOrbitCircumference = Meters(Math.PI * 2 * crankLength.m);
    this.travelPerRevolution = Meters(
      crankOrbitCircumference.m * this.gainRatio
    );
  }

  perHourSpeedAtRPM(rpm) {
    return Meters(this.travelPerRevolution.m * rpm * 60);
  }

  compare(other) {
    return this.gainRatio - other.gainRatio;
  }

  multipleHarderThan(other) {
    return this.gainRatio / other.gainRatio;
  }

  percentHarderThan(other) {
    return (Math.abs(this.gainRatio - other.gainRatio) / this.gainRatio) * 100;
  }

  isHarderThan(other, threshold = 1.05) {
    return this.multipleHarderThan(other) > threshold;
  }

  get multipleHarderThanEasiest() {
    return this.multipleHarderThan(this.params.drivetrain.easiestGear);
  }

  get label() {
    const { front, rear } = this.params;
    return `${front}/${rear}t`;
  }
}

export class Drivetrain {
  constructor(params) {
    const { fronts, rears, wheelRadius, crankLength } = params;
    this.params = params;
    this.rearSize = rears.length;
    this.byChainring = fronts
      .slice()
      .sort()
      .map((front, frontPos) => {
        return rears
          .slice()
          .sort()
          .reverse()
          .map((rear, rearPos) => {
            const gear = new Gear({
              front,
              rear,
              wheelRadius,
              crankLength,
              frontPos,
              rearPos,
              drivetrain: this,
            });
            gear.inBestPath = false;
            return gear;
          });
      });

    this._computeBestPath().forEach((gear) => {
      gear.inBestPath = true;
    });
  }

  get gearsGroupedByChainring() {
    return this.byChainring.flat();
  }

  get sortedGears() {
    return this.gearsGroupedByChainring.sort((a, b) => a.compare(b));
  }

  get easiestGear() {
    return this.sortedGears[0];
  }

  get hardestGear() {
    return this.sortedGears[this.sortedGears.length - 1];
  }

  get gears() {
    if (this.params.useBestPath) {
      return this.sortedGears.filter((gear) => gear.inBestPath);
    }
    return this.gearsGroupedByChainring;
  }

  get hardestGearRelativeDifficulty() {
    return this.hardestGear.percentHarderThan(this.easiestGear);
  }

  get title() {
    const { fronts, rears } = this.params;
    return `${fronts.length}x${rears.length} ${fronts.join("/")}t ${rears[0]}-${
      rears[rears.length - 1]
    }`;
  }

  _computeBestPath() {
    return this.byChainring.reduce((path, gears) => {
      const bestShiftPos = computeBestShiftPos(path, gears);
      return joinPathAt(path, gears, bestShiftPos);
    });
  }
}

function joinPathAt(easierGears, harderGears, pos) {
  const preShift = easierGears.slice(0, pos);
  const postShift = harderGears.filter((gear) => {
    return gear.isHarderThan(preShift[preShift.length - 1]);
  });
  return preShift.concat(postShift);
}

function computeBestShiftPos(
  easierGears,
  harderGears,
  statFunc = stddev,
  statCmpFunc = (a, b) => a < b
) {
  const best = { pos: null, stat: null };
  for (
    let pos = easierGears.length - harderGears.length + 1;
    pos <= easierGears.length;
    pos++
  ) {
    const candidatePath = joinPathAt(easierGears, harderGears, pos);
    const steps = integerRange(1, candidatePath.length).map((i) => {
      return candidatePath[i].percentHarderThan(candidatePath[i - 1]);
    });
    const stat = statFunc(steps);
    if (best.stat === null || statCmpFunc(stat, best.stat)) {
      best.pos = pos;
      best.stat = stat;
    }
  }

  return best.pos;
}

function integerRange(start, upToAndExcluding) {
  return [...Array(upToAndExcluding - start).keys()].map((x) => x + start);
}

function sum(arr) {
  return arr.reduce((a, b) => a + b);
}

function stddev(arr) {
  const mean = sum(arr) / arr.length;
  return Math.sqrt(sum(arr.map((x) => Math.pow(x - mean, 2))) / arr.length);
}

const weightScale = scaleLog([]);

function weightedStddev(arr) {
  const mean = sum(arr) / arr.length;
  const weights = arr.map((x) => x);
}
