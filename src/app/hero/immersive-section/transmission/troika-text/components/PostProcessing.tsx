"use client";

import {
  EffectComposer,
  RenderPass,
  ShaderPass,
} from "three/examples/jsm/Addons.js";
import Commons from "../classes/Commons";
import * as THREE from "three";

import {
  postprocessingVertexShader,
  postprocessingFragmentShader,
} from "../shaders/postprocessing/postprocessing";

interface PostProcessingProps {
  scene: THREE.Scene;
}

export default class PostProcessing {
  private commons: Commons;
  private scene: THREE.Scene;
  private composer!: EffectComposer;
  private renderPass!: RenderPass;
  private shiftPass!: ShaderPass;
  private lerpedVelocity: number = 0;
  private lerpFactor: number = 0.05;

  constructor({ scene }: PostProcessingProps) {
    this.commons = Commons.getInstance();
    this.scene = scene;

    this.createComposer();
    this.createPasses();
  }

  private createComposer() {
    this.composer = new EffectComposer(this.commons.renderer);
    this.composer.setPixelRatio(this.commons.sizes.pixelRatio);
    this.composer.setSize(
      this.commons.sizes.screen.width,
      this.commons.sizes.screen.height,
    );
  }

  private createPasses() {
    this.renderPass = new RenderPass(this.scene, this.commons.camera);
    this.composer.addPass(this.renderPass);

    const shiftShader = {
      uniforms: {
        tDiffuse: { value: null },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: postprocessingVertexShader,
      fragmentShader: postprocessingFragmentShader,
    };

    this.shiftPass = new ShaderPass(shiftShader);
    this.composer.addPass(this.shiftPass);
    this.shiftPass.renderToScreen = true;
  }

  onResize() {
    this.composer.setPixelRatio(this.commons.sizes.pixelRatio);
    this.composer.setSize(
      this.commons.sizes.screen.width,
      this.commons.sizes.screen.height,
    );
  }

  update() {
    if (this.shiftPass) {
      this.shiftPass.uniforms.uTime.value = this.commons.elapsedTime;

      const targetVelocity = this.commons.lenis?.velocity || 0;
      this.lerpedVelocity +=
        (targetVelocity - this.lerpedVelocity) * this.lerpFactor;
      this.shiftPass.uniforms.uVelocity.value = Math.abs(this.lerpedVelocity);
    }

    this.composer.render();
  }
}
