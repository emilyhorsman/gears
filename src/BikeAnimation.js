import { useEffect, useState } from "react";

export default function BikeAnimation({ gear, rpm = 80 }) {
  const { front, rear, wheelRadius, crankLength } = gear.params;
  const revolutionPerMillisecond = rpm / 60 / 1000;
  const degPerMillisecond = revolutionPerMillisecond * 360;
  const crankHeight = 30;
  const bottomBracketDrop = 62.5;
  const chainstayLength = 430;
  const wheelbase = 1021;
  const rearWheelPosition = {
    x: -Math.sqrt(
      Math.pow(chainstayLength, 2) - Math.pow(bottomBracketDrop, 2)
    ),
    y: -bottomBracketDrop,
  };
  const frontWheelPosition = {
    x: rearWheelPosition.x + wheelbase,
    y: -bottomBracketDrop,
  };
  const globalX = -(wheelbase / 2 + rearWheelPosition.x) / 2;
  const globalY = bottomBracketDrop;

  const [crankAngle, setCrankAngle] = useState(0);
  useEffect(() => {
    let id = null;
    let startTime = null;
    function tick(curTime) {
      id = window.requestAnimationFrame(tick);
      if (startTime == null) {
        startTime = curTime;
        return;
      }
      const elapsed = curTime - startTime;
      const angle = degPerMillisecond * elapsed;

      setCrankAngle(wrapDegrees(angle));
    }
    id = window.requestAnimationFrame(tick);

    return () => {
      id != null && window.cancelAnimationFrame(id);
    };
  }, [degPerMillisecond]);

  return (
    <svg width={900} height={400} viewBox="-900 -400 1800 800">
      <g transform={`translate(${globalX} ${globalY})`}>
        <g transform={`rotate(${crankAngle})`}>
          <circle
            cx={0}
            cy={0}
            r={numTeethToRadiusMm(front)}
            stroke="black"
            strokeWidth={10}
            fill="transparent"
          />
          <rect
            x={crankHeight / -2}
            y={crankHeight / -2}
            width={crankLength.mm}
            height={crankHeight}
            rx={crankHeight / 2}
          />
          <circle cx={0} cy={0} r={crankHeight / 2} fill="blue" />
        </g>
        <g
          transform={`translate(${rearWheelPosition.x} ${
            rearWheelPosition.y
          }) rotate(${crankAngle * gear.gearRatio})`}
        >
          <circle cx={0} cy={0} r={crankHeight / 2} fill="blue" />
          <circle
            cx={0}
            cy={0}
            r={wheelRadius.mm}
            stroke="black"
            strokeWidth={10}
            fill="transparent"
          />
          <circle
            cx={0}
            cy={0}
            r={numTeethToRadiusMm(rear)}
            stroke="black"
            strokeWidth={10}
            fill="transparent"
          />
          <rect
            x={-10}
            y={-wheelRadius.mm - 4}
            height={50}
            width={20}
            rx={10}
          />
        </g>
        <g
          transform={`translate(${frontWheelPosition.x} ${frontWheelPosition.y})`}
        >
          <circle cx={0} cy={0} r={crankHeight / 2} fill="blue" />
          <circle
            cx={0}
            cy={0}
            r={wheelRadius.mm}
            stroke="black"
            strokeWidth={10}
            fill="transparent"
          />
          <rect
            x={-10}
            y={-wheelRadius.mm - 4}
            height={50}
            width={20}
            rx={10}
          />
        </g>
      </g>
    </svg>
  );
}

function numTeethToRadiusMm(teeth) {
  return (12.7 * teeth) / Math.PI;
}

function wrapDegrees(x) {
  const base = Math.floor(x / 360);
  return x - base;
}
