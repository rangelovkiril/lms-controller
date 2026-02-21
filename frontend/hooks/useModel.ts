import { useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
);

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);


export function useModel(path: string) {
  const gltf = useLoader(GLTFLoader, path, (loader) => {
    (loader as GLTFLoader).setDRACOLoader(dracoLoader);
  });

  const clonedScene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  return { ...gltf, scene: clonedScene };
}