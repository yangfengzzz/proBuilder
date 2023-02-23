import { VHACD } from "./vhacd-wasm-api";

export class ConvexDecompose {
  static vhacd: typeof VHACD;
  /**
   * Initialize VHACD.
   * @returns Promise object
   */
  public static initialize(): Promise<void> {
    const scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      document.body.appendChild(script);
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      script.src = "http://30.46.128.35:8000/v_hacd.js";
    });

    return new Promise((resolve, reject) => {
      scriptPromise
        .then(
          () =>
            (<any>window).VHACD().then((VHACD) => {
              console.log("VHACD loaded.");
              ConvexDecompose.vhacd = VHACD;
              debugger;
              resolve();
            }, reject),
          reject
        )
        .catch(reject);
    });
  }
}
