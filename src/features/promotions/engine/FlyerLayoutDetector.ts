export interface FlyerRegion {
  heroBannerRegion: { x: number; y: number; width: number; height: number };
  headlineRegion: { x: number; y: number; width: number; height: number };
  periodRegion: { x: number; y: number; width: number; height: number };
  productGridRegion: { x: number; y: number; width: number; height: number };
}

export class FlyerLayoutDetector {
  static detectLayout(imageWidth: number = 1200, imageHeight: number = 1600): FlyerRegion {
    return {
      heroBannerRegion: {
        x: 0,
        y: 0,
        width: imageWidth,
        height: Math.round(imageHeight * 0.25)
      },
      headlineRegion: {
        x: Math.round(imageWidth * 0.05),
        y: Math.round(imageHeight * 0.02),
        width: Math.round(imageWidth * 0.9),
        height: Math.round(imageHeight * 0.12)
      },
      periodRegion: {
        x: Math.round(imageWidth * 0.1),
        y: Math.round(imageHeight * 0.15),
        width: Math.round(imageWidth * 0.8),
        height: Math.round(imageHeight * 0.08)
      },
      productGridRegion: {
        x: 0,
        y: Math.round(imageHeight * 0.26),
        width: imageWidth,
        height: Math.round(imageHeight * 0.74)
      }
    };
  }
}
