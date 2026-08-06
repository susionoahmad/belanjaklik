import type { BoundingBox } from '../types';

export interface LayoutBounds {
  imageWidth: number;
  imageHeight: number;
  contentRegion: BoundingBox;
  ignoredRegions: {
    header: BoundingBox;
    bottomNav: BoundingBox;
    floatingCart?: BoundingBox;
    statusBar: BoundingBox;
  };
  deviceType: 'Android' | 'iPhone' | 'Tablet';
}

export class LayoutDetector {
  static detectLayout(imageWidth: number, imageHeight: number): LayoutBounds {
    const aspectRatio = imageWidth / imageHeight;
    let deviceType: 'Android' | 'iPhone' | 'Tablet' = 'Android';

    if (aspectRatio > 0.65) {
      deviceType = 'Tablet';
    } else if (imageHeight >= 800 && aspectRatio < 0.5) {
      deviceType = 'iPhone';
    }

    // Ignore Header (~14%), Status bar (~4%), Bottom Nav (~12%), Floating Cart (~8%)
    const statusBarHeight = Math.round(imageHeight * 0.04);
    const headerHeight = Math.round(imageHeight * 0.12);
    const topMargin = statusBarHeight + headerHeight;

    const bottomNavHeight = Math.round(imageHeight * 0.12);
    const contentHeight = imageHeight - topMargin - bottomNavHeight;

    return {
      imageWidth,
      imageHeight,
      contentRegion: {
        x: 0,
        y: topMargin,
        width: imageWidth,
        height: contentHeight
      },
      ignoredRegions: {
        statusBar: { x: 0, y: 0, width: imageWidth, height: statusBarHeight },
        header: { x: 0, y: statusBarHeight, width: imageWidth, height: headerHeight },
        bottomNav: { x: 0, y: imageHeight - bottomNavHeight, width: imageWidth, height: bottomNavHeight },
        floatingCart: { x: imageWidth - 80, y: imageHeight - bottomNavHeight - 80, width: 70, height: 70 }
      },
      deviceType
    };
  }
}
