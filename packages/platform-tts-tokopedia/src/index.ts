export {
  createTtsPlugin,
  registerTts,
  TTS_BASE_URL,
  type TtsPluginOptions,
  type TtsPlugin,
  type TtsApiAccessor,
  type TtsApi,
} from './tts.connector';
export { mapOrder, mapProduct, mapReturn, type TikTokOrderRaw } from './tts.mapper';
export {
  TikTokClient,
  sign,
  serializeBody,
  type HttpMethod,
  type ApiCallSpec,
  type TikTokClientConfig,
} from './tts.client';
export {
  TikTokError,
  type TikTokCredentials,
  type TikTokRequestOptions,
  type TikTokErrorResponse,
  type TikTokApiResult,
  type ApiResponse,
} from './tts.types';
export {
  buildAuthUrl,
  exchangeAuthCode,
  refreshAccessToken,
  type TokenResponse,
} from './tts.auth';
export { createTtsWebhook } from './tts.webhook';
export * from './generated';