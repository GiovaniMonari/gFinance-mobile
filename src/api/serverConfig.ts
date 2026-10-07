/**
 * Where the mobile app talks to.
 *
 * Development (`expo start`, dev clients) points at the servers on this PC
 * over the LAN IP, so a physical phone on the same Wi-Fi can reach them
 * (`localhost` on the phone would be the phone itself).
 *
 *   - Nest API (auth, finances, transactions, ...): port 3000
 *   - Receipt scanner (FastAPI): port 8002 (`RECEIPT_SERVICE_URL` in
 *     `receiptsApi.ts`). It moved off 8000: that port is jammed by a dead
 *     socket (bind 10048), and the open-finance service owns 8001.
 *
 * Release builds (`eas build`, production APK) talk to the Railway host
 * instead: a LAN address is unreachable outside this Wi-Fi, so shipping it
 * would leave every production install offline. `__DEV__` is resolved at
 * bundle time, so each build carries exactly one URL and there is nothing
 * to switch at runtime.
 *
 * Note: the LAN IP is DHCP-assigned — if the PC reconnects and the IP
 * changes, update `DEV_API_URL` here. The Android emulator cannot use a LAN
 * IP for the PC; use `http://10.0.2.2:3000` there instead.
 */

const DEV_API_URL = 'http://192.168.15.8:3000'

const PROD_API_URL = 'https://gfinance-production-d5a6.up.railway.app'

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL
