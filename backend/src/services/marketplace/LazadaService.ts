import { IMarketplaceService } from './MarketplaceFactory';

export class LazadaService implements IMarketplaceService {
  name = 'LAZADA';
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
      throw new Error('Lazada Access Token is missing');
    }
    console.log(`[Lazada API] Fetching order for resi ${resi}`);
    
    // MOCK
    return {
      resi: resi,
      marketplace: 'LAZADA',
      customer: 'Lazada User Mock',
      items: [{ name: 'Produk dari Lazada', quantity: 3 }]
    };
  }
}
