import axios from "axios";
import { Agent } from "https";

const parseTokensFromUrl = (uri: string) => {
  let url = new URL(uri);
  let params = new URLSearchParams(url.hash.slice(1));
  return {
    access_token: params.get("access_token"),
    id_token: params.get("id_token"),
  };
};

export async function authenticate(usr: string, pwd: string) {
  const agent = new Agent({
    ciphers: [
      "TLS_CHACHA20_POLY1305_SHA256",
      "TLS_AES_128_GCM_SHA256",
      "TLS_AES_256_GCM_SHA384",
      "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
    ].join(":"),
    honorCipherOrder: true,
    minVersion: "TLSv1.2",
  });
  const userAgent =
    "RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)";

  // Get cookie
  const response = await axios.post(
    "https://auth.riotgames.com/api/v1/authorization",
    {
      client_id: "play-valorant-web-prod",
      nonce: 1,
      redirect_uri: "https://playvalorant.com/opt_in",
      response_type: "token id_token",
      scope: "account openid",
    },
    {
      headers: {
        "User-Agent": userAgent,
      },
      httpsAgent: agent,
    }
  );
  if (!response.headers["set-cookie"]) {
    throw new Error("No cookie found");
  }
  const cookie = response.headers["set-cookie"].find((elem) =>
    /^asid/.test(elem)
  );
  if (!cookie) {
    throw new Error("Failed to get cookie");
  }

  const access_tokens = await axios.put(
    "https://auth.riotgames.com/api/v1/authorization",
    {
      type: "auth",
      username: usr,
      password: pwd,
      remember: true,
    },
    {
      headers: {
        Cookie: cookie,
        "User-Agent": userAgent,
      },
      httpsAgent: agent,
    }
  );
  if (access_tokens.data.error) {
    throw new Error(access_tokens.data.error);
  }
  if (access_tokens.data.type == "multifactor") {
    throw new Error(
      "Accounts with multifactor authentication are not supported"
    );
  }
  if (!access_tokens.headers["set-cookie"]) {
    throw new Error("Failed to get cookie during password authentication");
  }

  const tokens = parseTokensFromUrl(access_tokens.data.response.parameters.uri);
  if (!tokens.access_token) {
    throw new Error("Failed to get access token");
  }

  const access_token = tokens.access_token;
  const entitlements_token = (
    await axios.post(
      "https://entitlements.auth.riotgames.com/api/token/v1",
      {},
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
          "User-Agent": "",
        },
      }
    )
  ).data.entitlements_token;

  const playerId = JSON.parse(
    Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
  ).sub;

  const headers: Record<string, string> = {
    "X-Riot-ClientVersion": "release-04.11-shipping-7-720199",
    "X-Riot-ClientPlatform": Buffer.from(
      JSON.stringify({
        platformType: "PC",
        platformOS: "Windows",
        platformOSVersion: "10.0.19042.1.256.64bit",
        platformChipset: "Unknown",
      })
    ).toString("base64"),
    "X-Riot-Entitlements-JWT": entitlements_token,
    Authorization: `Bearer ${access_token}`,
  };

  return {
    access_token,
    entitlements_token,
    playerId,
    headers,
  };
}
