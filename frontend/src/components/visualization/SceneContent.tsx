"use client";
import { useRef }          from "react";
import { Vector3, Group }  from "three";
import Target              from "./objects/Target";
import Laser               from "./objects/Laser";
import Trace               from "./objects/Trace";

export interface TrajectoryConfig {
  maxArcLength?: number;
  minSpeed?:     number;
  maxSpeed?:     number;
  opacity?:      number;
  smoothSteps?:  number;
}

interface SceneContentProps {
  targetRef:    React.RefObject<Group>;
  targetPosVec: React.RefObject<Vector3>;
  trajectory:   Required<TrajectoryConfig>;
}

export function SceneContent({ targetRef, targetPosVec, trajectory }: SceneContentProps) {
  const readyRef = useRef(false);

  return (
    <>
      <Trace
        targetRef={targetRef}
        targetPosVec={targetPosVec}
        readyRef={readyRef}
        maxArcLength={trajectory.maxArcLength}
        minSpeed={trajectory.minSpeed}
        maxSpeed={trajectory.maxSpeed}
        opacity={trajectory.opacity}
        smoothSteps={trajectory.smoothSteps}
      />
      <Target ref={targetRef} targetPosVec={targetPosVec} readyRef={readyRef} />
      <Laser targetRef={targetRef} />
    </>
  );
}