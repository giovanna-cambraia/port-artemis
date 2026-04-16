"use client";

import {
  useGLTF,
  MeshTransmissionMaterial,
  PresentationControls,
  RandomizedLight,
} from "@react-three/drei";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { gsap } from "gsap";

export default function Transmission() {
  const { nodes, materials } = useGLTF("/circle_text_13.glb");

  const circularText = useRef<THREE.Group>(null);
  const transmissionMaterial = useRef<any>(null);

  const spotLight1 = useRef<THREE.SpotLight>(null);
  const spotLight2 = useRef<THREE.SpotLight>(null);

  const elapsedTime = useRef(0);
  const pauseDuration = 3;
  const oscillationDuration = 2;
  const totalCycleDuration = oscillationDuration + pauseDuration;

  useFrame((state, delta) => {
    if (circularText.current) {
      circularText.current.rotation.y -= delta * 0.3;
    }

    if (transmissionMaterial.current) {
      elapsedTime.current = state.clock.elapsedTime % totalCycleDuration;

      let ior: number;
      if (elapsedTime.current < oscillationDuration) {
        const progress = elapsedTime.current / oscillationDuration;
        const amplitude = (3.5 - 1.07) / 2;
        const offset = (3.5 + 1.07) / 2;
        ior = offset - amplitude * Math.cos(progress * Math.PI);
      } else {
        ior = 1.07;
      }

      gsap.to(transmissionMaterial.current, { ior });
    }
  });

  const torusMesh = nodes.Torus as THREE.Mesh;
  const textMesh = nodes.Text as THREE.Mesh;

  return (
    <>
      <color args={["black"]} attach="background" />
      <ambientLight />

      <PresentationControls
        global
        rotation={[-0.23, 0.1, 0]}
        polar={[-0.4, 0.2]}
        azimuth={[-1, 0.75]}
        snap={false} 
      >
        <spotLight
          position={[4, 4, 4]}
          intensity={100}
          color={"#E5FCFF"}
          angle={Math.PI / 8}
          ref={spotLight1}
        />
        <spotLight
          position={[1.5, -0.3, 2]}
          intensity={800}
          power={60.0}
          color={"#FFA530"}
          angle={Math.PI / 4}
          ref={spotLight2}
        />

        <RandomizedLight
          radius={10}
          ambient={0.5}
          intensity={1}
          position={[2.5, 8, -2.5]}
          bias={0.001}
        />

        <group dispose={null} ref={circularText}>
          <mesh
            castShadow
            receiveShadow
            geometry={torusMesh.geometry}
            rotation={[0.026, 0.195, -10.334]} 
          >
            <MeshTransmissionMaterial
              background={new THREE.Color("#000000")}
              isMeshPhysicalMaterial={false}
              transmissionSampler={false}
              backside={false}
              samples={10}
              resolution={2048}
              transmission={1}
              roughness={0}
              thickness={0.2}
              ior={1.068}
              chromaticAberration={0}
              anisotropy={0}
              distortion={0.5}
              distortionScale={0.5}
              temporalDistortion={0.5}
              clearcoat={1}
              attenuationDistance={0.5}
              attenuationColor={"#ffffff"}
              color={"#ff0000"}
              ref={transmissionMaterial}
            />
          </mesh>

          <mesh
            castShadow
            receiveShadow
            geometry={textMesh.geometry}
            material={materials["Material.002"]}
            position={[0, -0.003, 0]}
            rotation={[Math.PI / 2, 0, -Math.PI]}
            scale={0.4}
          />
        </group>
      </PresentationControls>
    </>
  );
}

useGLTF.preload("/circle_text_13.glb");
