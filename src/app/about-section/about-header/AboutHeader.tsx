"use client";

import { GridScan } from "../../../react-components/grid-scan/GridScan";
import styles from "./AboutHeader.module.css";

export default function AboutHeader() {
  return (
    <div
      style={{
        width: "100%",
        height: "1000px",
        position: "relative",
        background: "#000",
      }}
    >
      <GridScan
        sensitivity={0.55}
        lineThickness={1}
        linesColor="#ffffff"
        gridScale={0.1}
        scanColor="#ebebeb"
        scanOpacity={0.4}
        enablePost
        bloomIntensity={0.6}
        chromaticAberration={0.002}
        noiseIntensity={0.01}
        lineJitter={0.1}
        scanGlow={0.5}
        scanSoftness={2}
        enableWebcam={false}
        showPreview={false}
      />

      <div className={styles.content}>
        <div className={styles.left}>
          <p className={styles.hey}>HEY</p>
          <h1 className={styles.name}>I&apos;m Artem</h1>
        </div>

        <div className={styles.center}></div>

        <div className={styles.right}>
          <p className={styles.bio}>
            Director & Creative Lead. Founder of{" "}
            <strong>ZHEESHEE studio</strong>. I mix live action with CG —
            building worlds, inventing characters, making things that
            shouldn&apos;t exist look real. Or unreal. As long as you can&apos;t
            stop looking at it.
          </p>
        </div>
      </div>
    </div>
  );
}
