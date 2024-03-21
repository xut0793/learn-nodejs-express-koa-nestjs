/*
 * @Date         : 2024-03-17 18:49:09 星期0
 * @Author       : xut
 * @Description  :
 */
export const TOKEN_EXPIRE_DEFAULT = 24 * 60 * 60 * 1000 // 1d
export const TOKEN_FORMAT_PLAIN = "plain"
export const TOKEN_FORMAT_JWT = "jwt"
export const TOKEN_TYPE = "Bearer"

export const GRANT_TYPE_AUTHORIZATION_CODE = "authorization_code"
export const GRANT_TYPE_REFRESH_TOKEN = "refresh_token"
export const GRANT_TYPE_CLIENT_CREDENTIALS = "client_credentials"
export const GRANT_TYPE_PASSWORD = "password"

export const HTTP_RESPONSE_HEADER_KEY_OF_TOKEN_EXPIRE = "expire-in"
export const RESPONSE_TYPE_OF_AUTHORIZATION_CODE = "code"

export const MAX_SIZE_OF_REGISTER_OBJECT = 4096
export const MAX_SIZE_OF_REGISTER_KEY_OF_CLIENT_NAME = 64
export const MAX_SIZE_OF_REGISTER_KEY_OF_REDIRECT_URIS = 1024
export const MAX_SIZE_OF_REGISTER_KEY_OF_SCOPE = 2048
export const MAX_SIZE_OF_REGISTER_DEFAULT_KEY = 1024

export const CLIENT_SECRET_SEND_MODE_BY_HEADER = "secret_basic"
export const CLIENT_SECRET_SEND_MODE_BY_FORM = "secret_post"

export const MAX_COUNT_OF_CACHED_CLIENTS = 1000
export const MAX_COUNT_OF_CACHED_TOKENS = 1000
export const MAX_COUNT_OF_CACHED_USERS = 2000

export const PKCE_CODE_CHALLENGE_METHOD_PLAIN = "plain"
export const PKCE_CODE_CHALLENGE_METHOD_S256 = "S256"
