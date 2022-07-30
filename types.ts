// Region: na - Puuid: depends on player
// https://pd.[REGION].a.pvp.net/store/v2/storefront/[PUUID]
// Official Valorant storefront API
export interface Storefront {
  FeaturedBundle: FeaturedBundle;
  SkinsPanelLayout: SkinsPanelLayout;
  BonusStore: BonusStore;
}

export interface CachedStorefront extends Storefront {
  LastUpdated: string;
}

export interface BonusStore {
  BonusStoreOffers: BonusStoreOffer[];
  BonusStoreRemainingDurationInSeconds: number;
}

export interface BonusStoreOffer {
  BonusOfferID: string;
  Offer: Offer;
  DiscountPercent: number;
  DiscountCosts: DiscountCosts;
  IsSeen: boolean;
}

export interface DiscountCosts {
  "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741": number;
}

export interface Offer {
  OfferID: string;
  IsDirectPurchase: boolean;
  StartDate: Date;
  Cost: DiscountCosts;
  Rewards: Reward[];
}

export interface Reward {
  ItemTypeID: string;
  ItemID: string;
  Quantity: number;
}

export interface FeaturedBundle {
  Bundle: Bundle;
  Bundles: Bundle[];
  BundleRemainingDurationInSeconds: number;
}

export interface Bundle {
  ID: string;
  DataAssetID: string;
  CurrencyID: string;
  Items: ItemElement[];
  DurationRemainingInSeconds: number;
  WholesaleOnly: boolean;
}

export interface ItemElement {
  Item: ItemItem;
  BasePrice: number;
  CurrencyID: string;
  DiscountPercent: number;
  DiscountedPrice: number;
  IsPromoItem: boolean;
}

export interface ItemItem {
  ItemTypeID: string;
  ItemID: string;
  Amount: number;
}

export interface SkinsPanelLayout {
  SingleItemOffers: string[];
  SingleItemOffersRemainingDurationInSeconds: number;
}

// Region: na
// https://pd.[REGION].a.pvp.net/store/v1/offers/
// Official Valorant Offers
export interface Offers {
  Offers: Offer[];
  UpgradeCurrencyOffers: UpgradeCurrencyOffer[];
}

export interface Offer {
  OfferID: string;
  IsDirectPurchase: boolean;
  StartDate: Date;
  Cost: Cost;
  Rewards: Reward[];
}

export interface Cost {
  "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741": number;
}

export interface Reward {
  ItemTypeID: string;
  ItemID: string;
  Quantity: number;
}

export interface UpgradeCurrencyOffer {
  OfferID: string;
  StorefrontItemID: string;
}

// https://dash.valorant-api.com/endpoints/weapons
// Weapon Skin Level by Uuid
export interface SkinLevelResponse {
  status: number;
  data: SkinLevel;
}

export interface SkinLevel {
  uuid: string;
  displayName: string;
  levelItem: null;
  displayIcon: string;
  streamedVideo: string;
  assetPath: string;
}

// https://dash.valorant-api.com/endpoints/weapons
// Weapon Skins
export interface OpenSkinData {
  status: number;
  data: {
    uuid: string;
    displayName: string;
    themeUuid: string;
    contentTierUuid: string;
    wallpaper: string;
    assetPath: string;
    chromas: {
      uuid: string;
      displayName: string;
      displayIcon: string;
      fullRender: string;
      swatch: string;
      stramedVideo: string;
      assetPath: string;
    }[];
    levels: {
      uuid: string;
      displayName: string;
      levelItem: string;
      displayIcon: string;
      streamedVideo: string;
      assetPath: string;
    }[];
  }[];
}

// Parsed store item
export interface StoreItem {
  displayName: string;
  displayIcon: string;
  tierId: string;
  vp: number;
  itemUuid: string;
}
