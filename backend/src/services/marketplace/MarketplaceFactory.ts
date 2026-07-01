import { ShopeeService } from './ShopeeService';
import { TokopediaService } from './TokopediaService';
import { TiktokService } from './TiktokService';
import { LazadaService } from './LazadaService';
import { BlibliService } from './BlibliService';

export interface IMarketplaceService {
  name: string;
  getOrderDetail(resi: string): Promise<any>;
  generateAuthUrl?(): string;
  exchangeToken?(code: string): Promise<any>;
}

export class MarketplaceFactory {
  static getService(marketplaceName: string, credentials: any): IMarketplaceService {
    switch (marketplaceName.toUpperCase()) {
      case 'SHOPEE': return new ShopeeService(credentials);
      case 'TOKOPEDIA': return new TokopediaService(credentials);
      case 'TIKTOK': return new TiktokService(credentials);
      case 'LAZADA': return new LazadaService(credentials);
      case 'BLIBLI': return new BlibliService(credentials);
      default:
        throw new Error(`Marketplace ${marketplaceName} is not supported yet`);
    }
  }
}
