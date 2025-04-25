// import process from "process";
// import { isProduction } from "@/utils/environment";
/**
 * Returns the API base URL based on the current environment.
 * In production it retrieves the URL from NEXT_PUBLIC_PROD_API_URL (or falls back to a hardcoded url).
 * In development, it returns "http://localhost:8080".
 */
// export function getApiDomain(): string {
//   const prodUrl = process.env.NEXT_PUBLIC_PROD_API_URL || "http://localhost:8080";
//   const devUrl = "http://localhost:8080";
//   return isProduction() ? prodUrl : devUrl;
// }

// export function getApiWsDomain(): string {
//   const prodWsUrl = process.env.NEXT_PUBLIC_PROD_WS_URL || "ws://localhost:8080";
//   const devWsUrl = "ws://localhost:8080";
//   return isProduction() ? prodWsUrl : devWsUrl;
// }

export function getApiDomain(): string {
  return "https://tactile-anthem-453521-p3.oa.r.appspot.com/"; 
}

export function getApiWsDomain(): string {
  return "wss://tactile-anthem-453521-p3.oa.r.appspot.com/websocket"; 
}