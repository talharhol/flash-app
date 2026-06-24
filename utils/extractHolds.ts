import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import { Hold } from "@/DAL/hold";

type ApiCookie = { value: string; exp: string };
type holdsApiCacheType = { cookies: ApiCookie[]; fetchedAt: number; api: string; referer: string };
let holdsApiCache: holdsApiCacheType | null = null;
const CACHE_TTL = 10 * 60 * 1000;

async function fetchApiConfig(): Promise<holdsApiCacheType> {
  if (holdsApiCache && Date.now() - holdsApiCache.fetchedAt < CACHE_TTL) {
    return holdsApiCache;
  }
  const snap = await getDoc(doc(db, "external_holds_api", "config"));
  if (!snap.exists()) throw new Error("No holds API config found");
  const data = snap.data();
  holdsApiCache = { cookies: data.cookies ?? [], fetchedAt: Date.now(), api: data.api!, referer: data.referer! };
  return holdsApiCache;
}

function polygonToSvgPath(points: number[][]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first[0]} ${first[1]} ${rest.map(([x, y]) => `L ${x} ${y}`).join(" ")} Z`;
}

async function tryFetch(resizedUri: string, cookie: string, api: string, referer: string): Promise<number[][][]> {
  const formData = new FormData();
  formData.append("image", { uri: resizedUri, type: "image/jpeg", name: "blob" } as any);

  const response = await fetch(
    api,
    {
      method: "POST",
      headers: {
        accept: "*/*",
        "cache-control": "no-cache",
        pragma: "no-cache",
        referer,
        cookie,
      },
      body: formData,
    }
  );

  if (!response.ok) throw new Error(`${response.status}`);
  return response.json();
}

export async function extractHolds(
  imageUri: string,
  svgWidth: number,
  svgHeight: number
): Promise<Hold[]> {
  const ref = await ImageManipulator.manipulate(imageUri)
    .resize({ width: svgWidth, height: Math.round(svgHeight) })
    .renderAsync();
  const resized = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });

  const apiConfig = await fetchApiConfig();
  const validCookies = apiConfig.cookies
    .filter((c) => new Date(c.exp) > new Date())
    .map((c) => c.value);
  for (const cookie of validCookies) {
    try {
      const data = await tryFetch(resized.uri, cookie, apiConfig.api, apiConfig.referer);
      return data.map((polygon) =>
        new Hold({ svgPath: polygonToSvgPath(polygon) })
      );
    } catch {
      // try next
    }
  }

  throw new Error("All api cookies failed");
}
