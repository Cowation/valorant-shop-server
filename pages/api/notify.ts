// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import Expo, {
  ExpoPushMessage,
  ExpoPushReceipt,
  ExpoPushTicket,
} from "expo-server-sdk";
import db from "../../utilities/db";
import { authenticate } from "../../utilities/authentication";
import getStore from "../../utilities/getStore";
import { StoreItem } from "../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ success: boolean; message?: string }>
) {
  // only allow POST
  if (req.method !== "POST") {
    res.status(405).json({ success: false, message: "Method not allowed" });
    return;
  }

  // check if environment variable NOTIFY_KEY and req.body.NOTIFY_KEY are equal
  if (process.env.NOTIFY_KEY !== req.body.NOTIFY_KEY) {
    res.status(401).json({ success: false, message: "Invalid key" });
    return;
  }

  // get all users with a pushToken
  const usersCollection = await db.collection("users");
  const userSnapshot = await usersCollection
    .where("pushToken", "!=", null)
    .get();
  const users = userSnapshot.docs.map((doc) => doc.data());

  // send push notification to all users
  const expo = new Expo();

  let messages: ExpoPushMessage[] = [];
  for (const user of users) {
    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(
        `Push token ${user.pushToken} is not a valid Expo push token`
      );
      continue;
    }

    // check for user usr and pwd
    if (!user.usr || !user.pwd) {
      console.error("Missing username or password for user");
      continue;
    }

    const { headers, playerId } = await authenticate(user.usr, user.pwd);
    const normalStore = await getStore(headers, playerId);

    // check if there's anything in the normal store matches the user's watchingItems
    let matches: StoreItem[] = [];
    for (const item of normalStore) {
      if (user.watchingItems.includes(item.itemUuid)) {
        matches.push(item);
      }
    }

    if (matches.length === 0) continue;

    messages.push({
      to: user.pushToken,
      sound: "default",
      title: "VALORANT Shop",
      body: `The ${matches[0].displayName} ${
        matches.length > 1
          ? `and ${matches.length - 1} other item${
              matches.length - 1 > 1 ? "s" : ""
            } are`
          : `is`
      } in stock!`,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  let tickets: ExpoPushTicket[] = [];
  (async () => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(ticketChunk);
        tickets.push(...ticketChunk);
        // NOTE: If a ticket contains an error code in ticket.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
      } catch (error) {
        console.error(error);
      }
    }
  })();

  res.status(200).send({ success: true });

  let receiptIds = [];
  for (let ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if ("id" in ticket && ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  (async () => {
    // Like sending notifications, there are different strategies you could use
    // to retrieve batches of receipts from the Expo service.
    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log(receipts);

        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        for (let receiptId in receipts) {
          let { status, message, details } = receipts[receiptId] as {
            message: string;
          } & ExpoPushReceipt;
          if (status === "ok") {
            continue;
          } else if (status === "error") {
            console.error(
              `There was an error sending a notification: ${message}`
            );
            if (details && "error" in details && details.error) {
              // The error codes are listed in the Expo documentation:
              // https://docs.expo.io/push-notifications/sending-notifications/#individual-errors
              // You must handle the errors appropriately.
              console.error(`The error code is ${details.error}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  })();
}
