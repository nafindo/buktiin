import { IMarketplaceService } from './MarketplaceFactory';

export class TokopediaService implements IMarketplaceService {
  name = 'TOKOPEDIA';
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
      throw new Error('Tokopedia Access Token is missing');
    }
    console.log(`[Tokopedia API] Fetching order for resi ${resi}`);
    
    // MOCK
    return {
      resi: resi,
      marketplace: 'TOKOPEDIA',
      customer: 'Tokopedia User Mock',
      items: [{ name: 'Produk dari Tokopedia', quantity: 2 }]
    };
  }
}
