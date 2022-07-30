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
import getStore from "../../utilities/getStore";

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
  const normalStore = await getStore(headers, playerId);

  res.status(200).send(normalStore);
}
