function sum(arr) {
  return arr.reduce((a, b) => a + b);
}

function stddev(arr) {
  const mean = sum(arr) / arr.length;
  return Math.sqrt(sum(arr.map((a) => Math.pow(a - mean, 2))) / arr.length);
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
    const stat = sum(percentChangeSteps);
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

export function getBestGearPath(inputChainrings, inputCogs) {
  const chainrings = inputChainrings.sort();
  const cogs = inputCogs.sort().reverse();

  let path = constructGears(chainrings[0], cogs);
  for (let i = 1; i < chainrings.length; i++) {
    const gears = constructGears(chainrings[i], cogs);
    const bestShiftPosition = minimumStddevShift(path, gears, (g) => g.ratio);
    path = joinRatioPath(path, gears, bestShiftPosition, (g) => g.ratio);
  }
  return path;
}
