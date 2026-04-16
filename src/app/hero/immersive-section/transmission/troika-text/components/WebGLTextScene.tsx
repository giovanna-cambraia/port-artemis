"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import Commons from "../classes/Commons";
import { WebGLText } from "./WebGLText";
import PostProcessing from "./PostProcessing";

export function WebGLTextScene() {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const textsRef = useRef<WebGLText[]>([]);
  const postProcessingRef = useRef<PostProcessing | null>(null);
  const commonsRef = useRef<Commons | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const init = async () => {
      await document.fonts.ready;

      const commons = Commons.getInstance();
      commons.init();
      commonsRef.current = commons;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create WebGL text instances from DOM elements
      const textElements = document.querySelectorAll('[data-animation="webgl-text"]');
      textsRef.current = Array.from(textElements).map((el) => {
        return new WebGLText({
          element: el as HTMLElement,
          scene: scene,
        });
      });

      // Initialize post-processing
      postProcessingRef.current = new PostProcessing({ scene });

      // Start animation loop
      const animate = () => {
        if (commonsRef.current) {
          commonsRef.current.update();
        }

        if (textsRef.current) {
          textsRef.current.forEach((text) => text.update());
        }

        if (postProcessingRef.current) {
          postProcessingRef.current.update();
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();

      // Handle resize
      const handleResize = () => {
        if (commonsRef.current) {
          commonsRef.current.onResize();
        }
        if (textsRef.current) {
          textsRef.current.forEach((text) => text.onResize());
        }
        if (postProcessingRef.current) {
          postProcessingRef.current.onResize();
        }
      };

      window.addEventListener("resize", handleResize);

      // Cleanup
      return () => {
        window.removeEventListener("resize", handleResize);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        // Clean up Three.js resources
        if (sceneRef.current) {
          sceneRef.current.clear();
        }
        if (commonsRef.current?.renderer) {
          commonsRef.current.renderer.dispose();
        }
      };
    };

    init();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="content">
      <div className="container">
        <section className="section__heading">
          <h3 data-animation="webgl-text" className="text__2">
            THREE.JS
          </h3>
          <h2 data-animation="webgl-text" className="text__1">
            RESPONSIVE AND ACCESSIBLE TEXT
          </h2>
        </section>
        <section className="section__main__content">
          <p data-animation="webgl-text" className="text__2">
            THIS TEXT IS STYLED TO LOOK LIKE A TYPICAL BLOCK OF TEXT ON A STANDARD
            WEBSITE. BUT UNDER THE SURFACE, IT&apos;S BEING RENDERED WITH WEBGL INSTEAD
            OF TRADITIONAL HTML.
          </p>
          <p data-animation="webgl-text" className="text__2">
            THIS OPENS THE DOOR TO CUSTOM SHADER EFFECTS AND INTERACTIONS THAT GO
            BEYOND WHAT&apos;S POSSIBLE WITH TRADITIONAL HTML.
          </p>
          <p data-animation="webgl-text" className="text__2">
            WE KEEP THE UNDERLYING HTML STRUCTURE PRESENT IN THE DOM. RATHER THAN
            CREATING MESHES DIRECTLY IN THREE.JS, THE SCENE IS BUILT BY READING FROM
            THE EXISTING HTML CONTENT. THIS WAY, SCREEN READERS, SEARCH ENGINES, AND
            OTHER TOOLS CAN STILL INTERPRET THE PAGE AS EXPECTED.
          </p>
        </section>
        <section className="section__footer">
          <p data-animation="webgl-text" className="text__3">
            NOW GO CRAZY WITH THE SHADERS :)
          </p>
        </section>
      </div>
    </div>
  );
}