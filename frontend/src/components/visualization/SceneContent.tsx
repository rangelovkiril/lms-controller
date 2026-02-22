"use client";
import { Vector3, Group } from "three";
import Target from "./objects/Target";
import Laser from "./objects/Laser";
import Trajectory from "./objects/Trajectory";

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