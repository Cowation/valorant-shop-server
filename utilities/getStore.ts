import axios from "axios";
import {
  Offers,
  OpenSkinData,
  SkinLevel,
  Storefront,
  StoreItem,
} from "../types";

export default async function getStore(
  headers: Record<string, string>,
  playerId: string
) {
  const storefront: Storefront = (
    await axios.get(`https://pd.na.a.pvp.net/store/v2/storefront/${playerId}`, {
      headers: headers,
    })
  ).data;

  const masterSkinData: Offers = (
    await axios.get("https://pd.na.a.pvp.net/store/v1/offers/", {
      headers: headers,
    })
  ).data;
  const openSkinData: OpenSkinData = (
    await axios.get("https://valorant-api.com/v1/weapons/skins")
  ).data;

  const normalStore: StoreItem[] = await Promise.all(
    storefront.SkinsPanelLayout.SingleItemOffers.map(async (skinLevelUUID) => {
      const offer = masterSkinData.Offers.find(
        ({ OfferID }) => OfferID === skinLevelUUID
      );
      const skinLevel: SkinLevel = (
        await axios.get(
          `https://valorant-api.com/v1/weapons/skinlevels/${skinLevelUUID}`
        )
      ).data.data;

      if (!offer) {
        throw new Error("Missing offer");
      }

      const masterItem = openSkinData.data.find((item) =>
        item.levels.some((level) => level.uuid === skinLevelUUID)
      )!;

      return {
        vp: offer.Cost["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"],
        displayName: skinLevel.displayName,
        displayIcon: skinLevel.displayIcon,
        tierId: masterItem.contentTierUuid,
        itemUuid: masterItem.uuid,
      };
    })
  );

  return normalStore;
}
