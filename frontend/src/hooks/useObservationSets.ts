// useObservationSets.ts
import { useState, useEffect, useCallback } from "react";
import { Vector3 }                          from "three";
import { ObsSet, createSet }                from "@/types";
import { generateTrajectory } from "@/components/visualization/objects/mockTrajectory";

const MAX_POINTS = 2000;

export function useObservationSets(targetPosVec: Vector3 | null) {
 const mockPoints                       = generateTrajectory({ points: 600, pattern: "spiral" });
const mockSet: ObsSet                  = { id: "mock-1", label: "Spiral", points: mockPoints, color: "#00e5ff", visible: true };
const liveSet                          = createSet([mockSet]);
const [sets,        setSets]           = useState<ObsSet[]>([mockSet, liveSet]);
const [activeSetId, setActiveSetId]    = useState<string>(liveSet.id);

  const points = generateTrajectory({
    points: 300,
    radius: 7,
    noise: 0.7,
    pattern: "spiral"
  })

useEffect(() => {
  
  if (!targetPosVec) return;

  const point = new Vector3(targetPosVec.x, targetPosVec.y, targetPosVec.z); // ← винаги нова инстанция

  setSets((prev) =>
    prev.map((s) =>
      s.id !== activeSetId ? s : {
        ...s,
        points: s.points.length >= MAX_POINTS
          ? [...s.points.slice(1), point]
          : [...s.points,          point],
      }
    )
  );
}, [targetPosVec, activeSetId]);

const addSet = useCallback(() => {
  setSets((prev) => {
    const fresh = createSet(prev);
    setActiveSetId(fresh.id);
    return [...prev, fresh];
  });
}, []);

const removeSet = useCallback((id: string) => {
  setSets((prev) => {
    const next = prev.filter((s) => s.id !== id);

    if (next.length === 0) {
      setActiveSetId("");
      return [];
    }

    setActiveSetId((cur) => (cur === id ? next[next.length - 1].id : cur));
    return next;
  });
}, []);

  const updateSet = useCallback(
    <K extends keyof ObsSet>(id: string, key: K, value: ObsSet[K]) =>
      setSets((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))),
    []
  );

  const clearSet = useCallback(
    (id: string) =>
      setSets((prev) => prev.map((s) => (s.id === id ? { ...s, points: [] } : s))),
    []
  );

  return { sets, activeSetId, setActiveSetId, addSet, removeSet, updateSet, clearSet };
}