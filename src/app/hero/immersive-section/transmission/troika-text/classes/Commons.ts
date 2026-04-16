import { PerspectiveCamera, WebGLRenderer, Clock } from "three";
import Lenis from "lenis";

export interface Screen {
  width: number;
  height: number;
  aspect: number;
}

export interface Sizes {
  screen: Screen;
  pixelRatio: number;
}

export default class Commons {
  private static instance: Commons;

  lenis!: Lenis;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;

  private time: Clock = new Clock();
  elapsedTime!: number;

  sizes: Sizes = {
    screen: {
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
      aspect:
        typeof window !== "undefined"
          ? window.innerWidth / window.innerHeight
          : 1,
    },
    pixelRatio: this.getPixelRatio(),
  };

  private distanceFromCamera: number = 1000;

  private constructor() {}

  static getInstance() {
    if (this.instance) return this.instance;
    this.instance = new Commons();
    return this.instance;
  }

  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;

    this.createLenis();
    this.createCamera();
    this.createRenderer();
  }

  private createLenis() {
    if (typeof window !== "undefined") {
      this.lenis = new Lenis({
        autoRaf: true,
        duration: 2,
        lerp: 0.1,
        smoothWheel: true,
      });
    }
  }

  private createCamera() {
    this.camera = new PerspectiveCamera(
      70,
      this.sizes.screen.aspect,
      200,
      2000,
    );
    this.camera.position.z = this.distanceFromCamera;
    this.syncDimensions();
    this.camera.updateProjectionMatrix();
  }

  private createRenderer() {
    const existing = document.querySelector("canvas");
    if (existing) existing.remove();

    this.renderer = new WebGLRenderer({ alpha: true });
    this.renderer.setSize(this.sizes.screen.width, this.sizes.screen.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);
    document.body.appendChild(this.renderer.domElement);
  }

  private syncDimensions() {
    this.camera.fov =
      2 *
      Math.atan(this.sizes.screen.height / 2 / this.distanceFromCamera) *
      (180 / Math.PI);
  }

  getPixelRatio() {
    if (typeof window === "undefined") return 1;
    return Math.min(window.devicePixelRatio, 2);
  }

  onResize() {
    this.sizes.screen = {
      width: window.innerWidth,
      height: window.innerHeight,
      aspect: window.innerWidth / window.innerHeight,
    };
    this.sizes.pixelRatio = this.getPixelRatio();

    this.renderer.setSize(this.sizes.screen.width, this.sizes.screen.height);
    this.renderer.setPixelRatio(this.sizes.pixelRatio);

    this.onResizeCamera();
  }

  private onResizeCamera() {
    this.syncDimensions();
    this.camera.aspect = this.sizes.screen.aspect;
    this.camera.updateProjectionMatrix();
  }

  update() {
    this.elapsedTime = this.time.getElapsedTime();
    if (this.lenis) {
      this.lenis.raf(Date.now());
    }
  }
}
