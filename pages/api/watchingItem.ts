// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../utilities/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; error?: string }>
) {
  // only accept POST and DELETE
  if (req.method !== "POST" && req.method !== "DELETE") {
    res.status(405).json({ success: false, error: "Method not allowed" });
    return;
  }

  // check if usr, pwd, and itemUuid are provided
  if (!req.body.usr || !req.body.pwd || !req.body.itemUuid) {
    res.status(400).json({
      success: false,
      error: "Missing username, password, or itemUuid",
    });
    return;
  }

  // find user in database
  const users = db.collection("users");
  const userSnapshot = await users.where("usr", "==", req.body.usr).get();
  if (userSnapshot.empty) {
    res.status(404).json({ success: false, error: "User not found" });
    return;
  }
  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data();

  // if user is deleting item, remove it from their watching list
  if (req.method === "DELETE") {
    const watchingItems = user.watchingItems;
    const index = watchingItems.indexOf(req.body.itemUuid);
    if (index > -1) {
      watchingItems.splice(index, 1);
      await userDoc.ref.set({ ...user, watchingItems });
    }
    res.status(200).json({ success: true });
    return;
  } else if (req.method === "POST") {
    // if user is adding item, add it to their watching list
    const watchingItems = user.watchingItems;
    if (watchingItems.indexOf(req.body.itemUuid) === -1) {
      watchingItems.push(req.body.itemUuid);
      await userDoc.ref.set({ ...user, watchingItems });
    }
    res.status(200).json({ success: true });
    return;
  }
}
