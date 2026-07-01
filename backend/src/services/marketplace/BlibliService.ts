import { IMarketplaceService } from './MarketplaceFactory';

export class BlibliService implements IMarketplaceService {
  name = 'BLIBLI';
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
      throw new Error('Blibli Access Token is missing');
    }
    console.log(`[Blibli API] Fetching order for resi ${resi}`);
    
    // MOCK
    return {
      resi: resi,
      marketplace: 'BLIBLI',
      customer: 'Blibli User Mock',
      items: [{ name: 'Produk dari Blibli', quantity: 1 }]
    };
  }
}
