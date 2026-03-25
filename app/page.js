"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={`${styles.hero} animate-fade-in`}>
        <div className={styles.badge}>Next-Gen AI Photo Editor</div>
        <h1 className={styles.title}>
          Transform your visuals with <span className={styles.highlight}>AI Magic</span>
        </h1>
        <p className={styles.description}>
          Uncensored, high-quality background replacement and resizing tailored for professional content creators and agencies.
        </p>
        <div className={styles.actions}>
          <Link href="/login" className="btn-primary">
            Get Started
          </Link>
        </div>
      </div>
      
      <div className={`${styles.glowRing} ${styles.topRing}`}></div>
      <div className={`${styles.glowRing} ${styles.bottomRing}`}></div>
    </main>
  );
}
