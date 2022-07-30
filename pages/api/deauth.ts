// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import db from "../../utilities/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message?: string }>
) {
  // check if usr and pwd are provided
  if (!req.body.usr || !req.body.pwd) {
    res
      .status(400)
      .json({ success: false, message: "Missing username or password" });
    return;
  }

  // delete user from database
  const users = db.collection("users");
  const userSnapshot = await users.where("usr", "==", req.body.usr).get();
  if (userSnapshot.empty) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data();
  if (user.pwd !== req.body.pwd) {
    res.status(401).json({ success: false, message: "Invalid password" });
    return;
  }
  await userDoc.ref.delete();
  res.status(200).json({ success: true });
}
