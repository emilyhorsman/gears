import { minIndex } from "d3-array";
import { range } from "d3-array";

export function Meters(meters) {
  return {
    mm: meters * 1000,
    m: meters,
    km: meters / 1000,
    inches: meters * 39.3701,
  };
}

export class Gear {
  constructor(params) {
    this.params = params;
    const { front, rear, hubRatio, wheelRadius, crankLength } = params;

    const radiusRatio = wheelRadius.m / crankLength.m;
    const gearRatio = (front / rear) * (hubRatio ?? 1);
    this.gearRatio = gearRatio;
    this.gainRatio = radiusRatio * gearRatio;
    // The gain ratio describes how much the bike travels per unit of travel around the crank orbit.
    const crankOrbitCircumference = Meters(Math.PI * 2 * crankLength.m);
    this.travelPerRevolution = Meters(
      crankOrbitCircumference.m * this.gainRatio
    );
    this.development = this.travelPerRevolution;
    this.gearInches = Meters(this.development.m / Math.PI).inches;
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
    return (this.gainRatio - other.gainRatio) / other.gainRatio;
  }

  isHarderThan(other, threshold = 1.05) {
    return this.multipleHarderThan(other) > threshold;
  }

  get multipleHarderThanEasiest() {
    return this.multipleHarderThan(this.params.drivetrain.easiestGear);
  }

  get rowLabel() {
    const {front, hubRatio} = this.params;
    if (hubRatio) {
      return `${front}t ${hubRatio * 100}%`;
    }
    return `${front}t`;
  }

  get label() {
    const { front, rear } = this.params;
    return `${front}/${rear}t`;
  }

  get key() {
    const { frontPos, rearPos, hubRatioPos } = this.params;
    return `${frontPos}_${rearPos}_${hubRatioPos}`;
  }

  get drivetrainFrontKey() {
    const { drivetrain, front } = this.params;
    return `${drivetrain.params.id} ${front}`;
  }
}

export class Drivetrain {
  constructor(params) {
    const {
      fronts,
      rears,
      hubRatios,
      beadSeatDiameter,
      tireWidth,
      crankLength,
    } = params;
    this.params = params;
    this.rearSize = rears.length;
    const wheelRadius = Meters(beadSeatDiameter.m / 2 + tireWidth.m);
    this.byChainring = fronts
      .slice()
      .sort()
      .map((front, frontPos) => {
        return (hubRatios ?? [1])
          .slice()
          .sort()
          .map((hubRatio, hubRatioPos) => {
            return rears
              .slice()
              .sort()
              .reverse()
              .map((rear, rearPos) => {
                const gear = new Gear({
                  front,
                  rear,
                  hubRatio: hubRatios?.length ? hubRatio : null,
                  hubRatioPos,
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
      });
  }

  get gearsGroupedByChainring() {
    return this.byChainring.flat(2);
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

  get rangePercentage() {
    return this.ratioExtent[1] / this.ratioExtent[0];
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
    const { label, fronts, rears, crankLength, beadSeatDiameter, tireWidth } =
      this.params;
    return `${label}: ${fronts.length}x${rears.length}; Crank = ${crankLength.mm}; BSD = ${beadSeatDiameter.mm}; Tire Width = ${tireWidth.mm}`;
  }

  get ratioExtent() {
    return [this.easiestGear.gainRatio, this.hardestGear.gainRatio];
  }

  get urlSerialize() {
    const {
      id,
      label,
      fronts,
      rears,
      hubRatios,
      crankLength,
      beadSeatDiameter,
      tireWidth,
    } = this.params;
    return {
      id,
      l: label,
      f: fronts,
      r: rears,
      h: hubRatios,
      c: crankLength.m,
      b: beadSeatDiameter.m,
      t: tireWidth.m,
    };
  }

  static urlDeserialize(obj) {
    return new Drivetrain({
      id: obj.id,
      label: obj.l,
      fronts: obj.f,
      rears: obj.r,
      hubRatios: obj.h,
      crankLength: Meters(obj.c),
      beadSeatDiameter: Meters(obj.b),
      tireWidth: Meters(obj.t),
    });
  }

  findBestShifts(evalFunc) {
    if (this.byChainring.length === 1) {
      return this.byChainring[0];
    }

    const sets = this.byChainring.map((gears, index) => {
      if (index === 0) {
        const easiestInNextSet = this.byChainring[1][0];
        const cutoff = gears.findIndex(
          (gear) => easiestInNextSet.percentHarderThan(gear) < 0.08
        );
        return {
          outliers: gears.slice(0, cutoff),
          candidates: gears.slice(cutoff),
        };
      }

      if (index === this.byChainring.length - 1) {
        const hardestInPrevSet =
          this.byChainring[index - 1][this.byChainring[index - 1].length - 1];
        const cutoff = gears.findIndex(
          (gear) => gear.percentHarderThan(hardestInPrevSet) > 0.08
        );
        return {
          outliers: gears.slice(cutoff),
          candidates: gears.slice(0, cutoff),
        };
      }

      return {
        outliers: [],
        candidates: gears,
      };
    });

    const possiblePaths = recursivelyConstructPaths(
      sets.map(({ candidates }) => candidates)
    );

    const best = possiblePaths[minIndex(possiblePaths, evalFunc)];
    return sets[0].outliers
      .concat(best)
      .concat(sets.length > 1 ? sets[sets.length - 1].outliers : []);
  }

  computeBestPath(statFunc = stddev) {
    return this.byChainring.reduce((path, gears) => {
      const bestShiftPos = computeBestShiftPos(path, gears, statFunc);
      return joinPathAt(path, gears, bestShiftPos);
    });
  }
}

function leftSubsets(arr) {
  return range(arr.length + 1).map((i) => {
    return arr.slice(0, i);
  });
}

function recursivelyConstructPaths(sets, setIndex = 0, prevHardestGear = null) {
  if (setIndex >= sets.length) {
    return [];
  }
  const remainder = sets[setIndex].filter(
    (gear) =>
      prevHardestGear == null || gear.percentHarderThan(prevHardestGear) > 0.08
  );
  if (setIndex === sets.length - 1) {
    return prevHardestGear == null ? [] : [remainder];
  }

  return leftSubsets(remainder).flatMap((base) => {
    const hardest = base[base.length - 1] || prevHardestGear;
    const paths = recursivelyConstructPaths(sets, setIndex + 1, hardest);
    return paths.map((path) => base.concat(path));
  });
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
