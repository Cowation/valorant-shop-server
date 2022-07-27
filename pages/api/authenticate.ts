// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "../../utilities/authentication";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message: string | null }>
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

  try {
    const { access_token, entitlements_token, playerId, headers } =
      await authenticate(req.body.usr, req.body.pwd);

    if (access_token && entitlements_token && playerId && headers) {
      res.status(200).json({ success: true, message: null });
    } else {
      res.status(500).json({ success: false, message: "Unknown error" });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: "An error occurred." });
    console.error(error);
  }
}
