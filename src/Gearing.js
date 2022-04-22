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

  speedAtRPM(rpm) {
    return Meters(this.travelPerRevolution.m * rpm);
  }

  compare(other) {
    return self.gainRatio - other.gainRatio;
  }

  isHarderThan(other, threshold = 1.05) {
    return self.gainRatio / other.gainRatio > threshold;
  }
}

export class Drivetrain {
  constructor(fronts, rears, wheelRadius, crankLength) {
    this.frontSize = chainrings.length;
    this.rearSize = cogs.length;
    this.byChainring = fronts
      .slice()
      .sort()
      .map((front, frontPos) => {
        return rears
          .slice()
          .sort()
          .map((rear, rearPos) => {
            return new Gear({
              front,
              rear,
              wheelRadius,
              crankLength,
              frontPos,
              rearPos,
              drivetrain: this,
            });
          });
      });
  }

  get gearsSortedByChainring() {
    return this.byChainring.flat();
  }

  get gearsSortedWithGainRatio() {
    return this.gearsSortedByChainring.sort((a, b) => a.compare(b));
  }
}

function sum(arr) {
  return arr.reduce((a, b) => a + b);
}

function stddev(arr) {
  const mean = sum(arr) / arr.length;
  return Math.sqrt(sum(arr.map((x) => Math.pow(x - mean, 2))) / arr.length);
}

function percentChangeFromTo(a, b) {
  return (b - a) / a;
}

function joinRatioPath(easier, harder, pos, accessor) {
  const preShift = easier.slice(0, pos);
  const hardestRatio =
    preShift.length > 0
      ? accessor(preShift[preShift.length - 1])
      : Number.NEGATIVE_INFINITY;
  const postShift = harder.filter((gear) => {
    const ratio = accessor(gear);
    return (
      ratio > hardestRatio && percentChangeFromTo(hardestRatio, ratio) > 0.05
    );
  });
  return preShift.concat(postShift);
}

function minimumStddevShift(easierGears, harderGears, accessor = (x) => x) {
  let bestShiftPosition = null;
  let bestStat = null;
  for (
    let shiftPosition = easierGears.length - harderGears.length + 1;
    shiftPosition <= easierGears.length;
    shiftPosition++
  ) {
    const ratios = joinRatioPath(
      easierGears,
      harderGears,
      shiftPosition,
      accessor
    ).map(accessor);
    const percentChangeSteps = [...Array(ratios.length - 1).keys()].map(
      (index) => percentChangeFromTo(ratios[index], ratios[index + 1])
    );
    const stat = stddev(percentChangeSteps);
    if (!bestStat || stat < bestStat) {
      bestShiftPosition = shiftPosition;
      bestStat = stat;
    }
  }

  return bestShiftPosition;
}

function constructGears(front, cogs) {
  return cogs.map((rear) => ({
    front,
    rear,
    ratio: front / rear,
  }));
}

export function getRemainingGears(bestPath, chainrings, cassette) {
  return chainrings
    .flatMap((front) => constructGears(front, cassette))
    .filter(({ front, rear }) => {
      if (
        (front === chainrings[0] && rear === cassette[cassette.length - 1]) ||
        (front === chainrings[chainrings.length - 1] && rear === cassette[0])
      ) {
        return false;
      }
      return bestPath.find((g) => g.front === front && g.rear === rear) == null;
    });
}

export function getBestGearPath(inputChainrings, inputCogs) {
  const chainrings = inputChainrings.slice().sort();
  const cogs = inputCogs.slice().sort().reverse();

  let path = constructGears(chainrings[0], cogs);
  for (let i = 1; i < chainrings.length; i++) {
    const gears = constructGears(chainrings[i], cogs);
    const bestShiftPosition = minimumStddevShift(path, gears, (g) => g.ratio);
    path = joinRatioPath(path, gears, bestShiftPosition, (g) => g.ratio);
  }
  return path;
}
