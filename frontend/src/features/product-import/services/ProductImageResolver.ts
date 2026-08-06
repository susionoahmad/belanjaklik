export class ProductImageResolver {
  private static imageDictionary: Array<{ keywords: string[]; url: string }> = [
    {
      keywords: ['fres', 'natural', 'pink cupcake', 'body wash', 'body mist'],
      url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500'
    },
    {
      keywords: ['lifebuoy', 'fresh protect', 'lemon fresh'],
      url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500'
    },
    {
      keywords: ['pepsodent', 'travel kit', 'pasta gigi', 'economy', 'charcoal', 'act123'],
      url: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500'
    },
    {
      keywords: ['close up', 'closeup'],
      url: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500'
    },
    {
      keywords: ['systema', 'sikat gigi', 'spring fresh', 'mntl breeze', 'triple advance', 'active clean'],
      url: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=500'
    },
    {
      keywords: ['emeron', 'shampoo', 'hair vitamin', 'black & shine', 'anti hair fall'],
      url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500'
    },
    {
      keywords: ['indomie', 'rendang', 'cabe ijo', 'goreng jumbo', 'tori miso'],
      url: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=500'
    },
    {
      keywords: ['sedaap', 'sedap', 'singapore laksa', 'soto'],
      url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500'
    },
    {
      keywords: ['sarimi', 'isi 2'],
      url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500'
    }
  ];

  static resolveImage(productName: string, brand?: string, currentImageUrl?: string): string {
    // If a valid custom image data URL or non-generic web URL is present, use it!
    if (
      currentImageUrl && 
      typeof currentImageUrl === 'string' && 
      currentImageUrl.trim() !== '' && 
      !currentImageUrl.includes('1542838132-92c53300491e') && 
      !currentImageUrl.includes('1595428774223-ef52624120d2')
    ) {
      return currentImageUrl;
    }

    const query = `${productName} ${brand || ''}`.toLowerCase();

    for (const item of this.imageDictionary) {
      if (item.keywords.some(kw => query.includes(kw))) {
        return item.url;
      }
    }

    return currentImageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500';
  }
}
