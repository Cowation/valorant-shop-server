// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import {
  Offers,
  OpenSkinData,
  SkinLevel,
  Storefront,
  StoreItem,
} from "../../types";
import { authenticate } from "../../utilities/authentication";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  if (!req.body.usr || !req.body.pwd) {
    res.status(400).json({ error: "Missing username or password" });
    return;
  }

  const { headers, playerId } = await authenticate(req.body.usr, req.body.pwd);

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

  const normalStore: (StoreItem | null)[] = await Promise.all(
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
        return null;
      }

      return {
        vp: offer.Cost["85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741"],
        displayName: skinLevel.displayName,
        displayIcon: skinLevel.displayIcon,
        tierId: openSkinData.data.find((item) =>
          item.levels.some((level) => level.uuid === skinLevelUUID)
        )!.contentTierUuid,
      };
    })
  );

  res.status(200).send(normalStore);
}
