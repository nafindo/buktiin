import { IMarketplaceService } from './MarketplaceFactory';

export class ShopeeService implements IMarketplaceService {
  name = 'SHOPEE';
  private appId: string;
  private appSecret: string;
  private accessToken: string | null;

  constructor(credentials: any) {
    this.appId = credentials.appId;
    this.appSecret = credentials.appSecret;
    this.accessToken = credentials.accessToken || null;
  }

  // Generate OAuth URL to get authorization code
  generateAuthUrl(): string {
    const host = 'https://partner.shopeemobile.com';
    const path = '/api/v2/shop/auth_partner';
    // MOCK: In production, generate HMAC SHA256 signature using appSecret
    const redirectUrl = encodeURIComponent('http://localhost:3001/api/integrations/callback/shopee');
    return `${host}${path}?partner_id=${this.appId}&redirect=${redirectUrl}&sign=MOCK_SIGNATURE`;
  }

  // Exchange auth code for access token
  async exchangeToken(code: string): Promise<any> {
    // MOCK: Call Shopee auth endpoint
    return {
      accessToken: 'mock_shopee_token_' + code,
      refreshToken: 'mock_shopee_refresh_token',
      expiresIn: 3600
    };
  }

  // Get order by resi
  async getOrderDetail(resi: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Shopee Access Token is missing');
    }

    console.log(`[Shopee API] Fetching order for resi ${resi} using token ${this.accessToken}`);
    
    // MOCK: Return dummy response as we don't have real keys
    return {
      resi: resi,
      marketplace: 'SHOPEE',
      customer: 'Shopee User Mock',
      items: [
        { name: 'Produk dari Shopee', quantity: 1 }
      ]
    };
  }
}
