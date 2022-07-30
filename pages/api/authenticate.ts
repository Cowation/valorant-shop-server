// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { initializeApp } from "firebase-admin/app";
import { authenticate } from "../../utilities/authentication";
import { credential, database, firestore } from "firebase-admin";
import db from "../../utilities/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{
    success: boolean;
    message: string | null;
    data?: { watchingItems: string[] };
  }>
) {
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  if (!req.body.usr || !req.body.pwd) {
    res
      .status(400)
      .json({ success: false, message: "Missing username or password" });
    return;
  }

  // Set user in database
  const users = db.collection("users");
  const userSnapshot = await users.where("usr", "==", req.body.usr).get();
  let watchingItems = [];

  if (userSnapshot.empty) {
    await users.add({
      usr: req.body.usr,
      pwd: req.body.pwd,
      pushToken: req.body.pushToken ?? null,
      watchingItems: [],
    });
  } else {
    const user = userSnapshot.docs[0];
    const userData = user.data();
    if (req.body.pushToken) {
      userData.pushToken = req.body.pushToken;
      await user.ref.set(userData);
    }
    watchingItems = userData.watchingItems;
  }

  try {
    const { access_token, entitlements_token, playerId, headers } =
      await authenticate(req.body.usr, req.body.pwd);

    if (access_token && entitlements_token && playerId && headers) {
      res
        .status(200)
        .json({ success: true, message: null, data: { watchingItems } });
    } else {
      res.status(500).json({ success: false, message: "Unknown error" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: "An error occurred." });
    console.error(error);
  }
}
