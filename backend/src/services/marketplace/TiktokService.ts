import { IMarketplaceService } from './MarketplaceFactory';

export class TiktokService implements IMarketplaceService {
  name = 'TIKTOK';
  private appId: string;
  private appSecret: string;
  private accessToken: string | null;

  constructor(credentials: any) {
    this.appId = credentials.appId;
    this.appSecret = credentials.appSecret;
    this.accessToken = credentials.accessToken || null;
  }

  async getOrderDetail(resi: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('TikTok Shop Access Token is missing');
    }
    console.log(`[TikTok API] Fetching order for resi ${resi}`);
    
    // MOCK
    return {
      resi: resi,
      marketplace: 'TIKTOK',
      customer: 'TikTok User Mock',
      items: [{ name: 'Produk dari TikTok Shop', quantity: 1 }]
    };
  }
}
