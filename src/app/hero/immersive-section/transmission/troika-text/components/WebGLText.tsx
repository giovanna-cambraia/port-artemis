"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
// @ts-ignore
import { Text } from "troika-three-text";
import { inView, animate } from "motion";
import Commons from "../classes/Commons";

import { textVertexShader, textFragmentShader } from "../shaders/text/text";

interface WebGLTextProps {
  scene: THREE.Scene;
  element: HTMLElement;
}

export class WebGLText {
  private commons: Commons;
  private scene: THREE.Scene;
  private element: HTMLElement;

  private computedStyle: CSSStyleDeclaration;
  private font!: string;
  private bounds!: DOMRect;
  private y: number = 0;
  private color!: THREE.Color;
  private material!: THREE.ShaderMaterial;
  private mesh!: any; // Changed from Text to any to avoid type issues
  private isVisible: boolean = false;

  private weightToFontMap: Record<string, string> = {
    "900": "/fonts/Oi-Regular.ttf",
    "800": "/fonts/Oi-Regular.ttf",
    "700": "/fonts/Oi-Regular.ttf",
    "600": "/fonts/Oi-Regular.ttf",
    "500": "/fonts/Oi-Regular.ttf",
    "400": "/fonts/Oi-Regular.ttf",
    "300": "/fonts/Oi-Regular.ttf",
    "200": "/fonts/Oi-Regular.ttf",
    "100": "/fonts/Oi-Regular.ttf",
  };

  constructor({ scene, element }: WebGLTextProps) {
    this.commons = Commons.getInstance();
    this.scene = scene;
    this.element = element;

    this.computedStyle = window.getComputedStyle(this.element);

    this.createFont();
    this.createColor();
    this.createBounds();
    this.createMaterial();
    this.createMesh();
    this.setStaticValues();
    this.addEventListeners();

    // Hide the original DOM element
    this.element.style.color = "transparent";
  }

  private createFont() {
    this.font =
      this.weightToFontMap[this.computedStyle.fontWeight] ||
      "/fonts/Humane-Regular.ttf";
  }

  private createColor() {
    this.color = new THREE.Color(this.computedStyle.color);
  }

  private createBounds() {
    this.bounds = this.element.getBoundingClientRect();

    this.y = this.bounds.top;
  }

  private createMaterial() {
    this.material = new THREE.ShaderMaterial({
      fragmentShader: textFragmentShader,
      vertexShader: textVertexShader,
      uniforms: {
        uProgress: new THREE.Uniform(0),
        uHeight: new THREE.Uniform(this.bounds.height),
        uColor: new THREE.Uniform(this.color),
      },
      transparent: true,
    });
  }

  private createMesh() {
    this.mesh = new Text();

    this.mesh.text = this.element.innerText;
    this.mesh.font = this.font;

    this.mesh.anchorX = "0%";
    this.mesh.anchorY = "50%";

    this.scene.add(this.mesh);
  }

  private setStaticValues() {
    const { fontSize, letterSpacing, lineHeight, whiteSpace, textAlign } =
      this.computedStyle;

    const fontSizeNum = window.parseFloat(fontSize);

    this.mesh.fontSize = fontSizeNum;
    this.mesh.textAlign = textAlign;
    this.mesh.letterSpacing = parseFloat(letterSpacing) / fontSizeNum;
    this.mesh.lineHeight = parseFloat(lineHeight) / fontSizeNum;
    this.mesh.maxWidth = this.bounds.width;
    this.mesh.whiteSpace = whiteSpace;

    this.mesh.sync(() => {
      console.log("mesh children:", this.mesh.children);
      console.log("mesh type:", this.mesh.type);
      console.log("mesh material:", this.mesh.material);
      this.mesh.traverse((child: any) => {
        console.log("child:", child.type, child.material);
      });
    });
  }

  private addEventListeners() {
    inView(this.element, () => {
      this.show();
      return () => this.hide();
    });
  }

  private show() {
    this.isVisible = true;

    animate(
      this.material.uniforms.uProgress,
      { value: 1 },
      { duration: 1.8, ease: [0.25, 1, 0.5, 1] },
    );
  }

  private hide() {
    animate(
      this.material.uniforms.uProgress,
      { value: 0 },
      { duration: 1.8, onComplete: () => (this.isVisible = false) },
    );
  }

  update() {
    if (this.isVisible && this.mesh && this.mesh.position) {
      console.log("uHeight", this.material.uniforms.uHeight.value);
      console.log("mesh worldY", this.mesh.position.y);

      this.mesh.position.y =
        -this.y + this.commons.sizes.screen.height / 2 - this.bounds.height / 2;

      this.mesh.position.x =
        this.bounds.left - this.commons.sizes.screen.width / 2;
    }
  }

  onResize() {
    this.computedStyle = window.getComputedStyle(this.element);
    this.createBounds();
    this.setStaticValues();
    if (this.material) {
      this.material.uniforms.uHeight.value = this.bounds.height;
    }
  }
}
