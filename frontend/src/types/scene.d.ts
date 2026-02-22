import { TrajectoryConfig } from "./trajectory";

export interface SceneCallbacks {
  onStatusChange?:   (status: "CONNECTED" | "DISCONNECTED") => void;
  onFiringChange?:   (firing: boolean) => void;
  onPositionChange?: (pos: Vector3) => void;
  onSendReady?:      (send: (data: object) => void) => void;
}

export interface SceneProps {
  wsUrl:      string;
  stationId:  string;
  objectId:   string;
  callbacks?: SceneCallbacks;
  trajectory?: TrajectoryConfig;
}


interface ContentProps {
  groupRef:     React.RefObject<Group>;
  targetPosVec: React.RefObject<Vector3>;
  isFiring:     boolean;
  trajectory:   Required<TrajectoryConfig>;
}
