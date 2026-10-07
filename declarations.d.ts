declare module '*.png' {
  const value: any
  export default value
}

/**
 * Metro/Hermes build flag: true under `expo start` (including dev clients),
 * false in release builds (`eas build`, production APK). React Native sets it
 * at bundle time — it is not declared by the shipped types, hence this.
 */
declare const __DEV__: boolean