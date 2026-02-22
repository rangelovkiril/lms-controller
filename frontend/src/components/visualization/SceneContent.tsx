"use client";
import { Vector3, Group } from "three";
import Target from "./Target";
import Laser from "./Laser";
import Trajectory from "./Trajectory";

export interface TrajectoryConfig {
  maxPoints?: number;
  maxArcLength?: number;
  minSpeed?: number;
  maxSpeed?: number;
  opacity?: number;
}

interface ContentProps {
  groupRef: React.RefObject<Group>;
  targetPosVec: React.RefObject<Vector3>;
  trajectory: Required<TrajectoryConfig>;
}

export function SceneContent({ groupRef, targetPosVec, trajectory }: ContentProps) {
  return (
    <>
      <Trajectory
        renderedGroupRef={groupRef}
        maxPoints={trajectory.maxPoints}
        maxArcLength={trajectory.maxArcLength}
        minSpeed={trajectory.minSpeed}
        maxSpeed={trajectory.maxSpeed}
        opacity={trajectory.opacity}
      />
      <Target ref={groupRef} targetPosVec={targetPosVec} />
      <Laser renderedGroupRef={groupRef} />
    </>
  );
}