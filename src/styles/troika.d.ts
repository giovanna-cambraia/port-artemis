declare module "troika-three-text" {
  export class Text extends THREE.Mesh {
    text: string;
    font: string;
    fontSize: number;
    letterSpacing: number;
    lineHeight: number;
    maxWidth: number;
    textAlign: string;
    whiteSpace: string;
    anchorX: string;
    anchorY: string;
    color: THREE.Color;
    material: THREE.Material;
    sync(): void;
  }
}
