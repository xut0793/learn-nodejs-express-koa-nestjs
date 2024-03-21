import {
  CLIENT_SECRET_SEND_MODE_BY_FORM,
  CLIENT_SECRET_SEND_MODE_BY_HEADER,
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_CLIENT_CREDENTIALS,
  GRANT_TYPE_PASSWORD,
  GRANT_TYPE_REFRESH_TOKEN,
  HTTP_RESPONSE_HEADER_KEY_OF_TOKEN_EXPIRE,
  MAX_SIZE_OF_REGISTER_DEFAULT_KEY,
  MAX_SIZE_OF_REGISTER_KEY_OF_CLIENT_NAME,
  MAX_SIZE_OF_REGISTER_KEY_OF_REDIRECT_URIS,
  MAX_SIZE_OF_REGISTER_KEY_OF_SCOPE,
  MAX_SIZE_OF_REGISTER_OBJECT,
  PKCE_CODE_CHALLENGE_METHOD_PLAIN,
  PKCE_CODE_CHALLENGE_METHOD_S256,
  RESPONSE_TYPE_OF_AUTHORIZATION_CODE,
  TOKEN_EXPIRE_DEFAULT,
  TOKEN_FORMAT_JWT,
  TOKEN_TYPE,
} from "./constants"
import { clientStore, genRandomString, tokenStore, userStore } from "./db.js"
const codes = {}
const requests = {}

function checkClientRegisterData(req, res) {
  const register = {}

  if (!checkRegisterAllElementLength(req.body)) {
    res.status(400).json({ error: "Register info too long." })
    return
  }

  for (const [k, v] of Object.entries(req.body)) {
    if (!checkRegisterElementLength(v, k)) {
      res.status(400).json({ error: "Register info to long of " + k })
      return
    }
  }

  const token_endpoint_auth_method = req.body.token_endpoint_auth_method
  const allowedClientSecretSendModes = [
    CLIENT_SECRET_SEND_MODE_BY_HEADER,
    CLIENT_SECRET_SEND_MODE_BY_FORM,
  ]
  if (
    typeof token_endpoint_auth_method !== "string" ||
    !allowedClientSecretSendModes.includes(token_endpoint_auth_method)
  ) {
    res.status(400).json({ error: "Invalid client secret send mode" })
    return
  } else {
    register["token_endpoint_auth_method"] = token_endpoint_auth_method
  }

  const grant_types = req.body.grant_types
  const allowedGrantTypes = [
    GRANT_TYPE_AUTHORIZATION_CODE,
    GRANT_TYPE_CLIENT_CREDENTIALS,
    GRANT_TYPE_PASSWORD,
    GRANT_TYPE_REFRESH_TOKEN,
  ]
  if (!Array.isArray(grant_types) || grant_types.length === 0) {
    res.status(400).json({ error: "Invalid grant types" })
    return
  } else {
    for (const grantType of grant_types) {
      if (!allowedGrantTypes.includes(grantType)) {
        res.status(400).json({ error: "Invalid grant type of " + grantType })
        return
      }
    }
    register["grant_types"] = grant_types
  }

  if (grant_types.includes(GRANT_TYPE_AUTHORIZATION_CODE)) {
    const redirect_uris = req.body.redirect_uris

    if (
      !redirect_uris ||
      !Array.isArray(redirect_uris) ||
      redirect_uris.length === 0
    ) {
      res.status(400).json({ error: "Invalid redirect uri: ", redirect_uris })
      return
    } else {
      register["redirect_uris"] = redirect_uris

      for (const uri of redirect_uris) {
        const urlObj = new URL(uri)
        if (!urlObj.pathname || urlObj.pathname === "/") {
          res.status(400).json({ error: "Invalid redirect uri: " + uri })
          return
        }
      }

      if (isRedirectUrisInBlackList(redirect_uris)) {
        res.status(400).json({ error: "Invalid redirect uri in black list" })
        return
      }
    }
  }

  const client_name = req.body.client_name
  if (typeof client_name !== "string" || !client_name) {
    res.status(400).json({ error: "Invalid client name" })
    return
  } else {
    register["client_name"] = client_name
  }

  // scope 和 client_uri 可选
  const scope = req.body.scope
  if (typeof scope === "string") {
    register["scope"] = scope
  } else if (scope !== undefined) {
    res.status(400).json({ error: "Invalid scope format" })
    return
  }

  const client_uri = req.body.client_uri

  if (typeof client_uri === "string") {
    register["client_uri"] = client_uri

    if (Array.isArray(req.body.redirect_uris)) {
      for (const uri of req.body.redirect_uris) {
        if (!uri.startsWith(client_uri)) {
          res.status(400).json({
            error: "redirect uri should have the prefix of client uri",
          })
          return
        }
      }
    }
  } else if (client_uri !== undefined) {
    res.status(400).json({ error: "Invalid client uri" })
    return
  }

  return register
}

function isRedirectUrisInBlackList(redirect_uris) {
  return false
}

function getScopesFromForm(body) {
  return Object.keys(body)
    .filter((k) => k.startsWith("scope_"))
    .map((s) => s.slice("scope_".length))
}

function authorizeClientManageRequest(req, res) {
  const clientId = req.params.clientId
  const client = clientStore.get(clientId)

  if (!client) {
    return res.status(400).json({ error: "Invalid client id: " + clientId })
  }

  const auth = req.headers["authorization"]

  if (!auth) {
    return res.status(401).json({ error: "Invalid authorization header" })
  }

  const [type, token] = auth.split(" ")

  if (typeof type !== "string" || type.toLowerCase() !== "bearer") {
    return res.status(401).json({ error: "Invalid authorization type" })
  }

  if (!token || token !== client.registration_access_token) {
    return res.status(403).json({
      error: "registration access token mismatch",
      expected: client.registration_access_token,
      got: token,
      clientId,
    })
  }

  req.client = client
  return req
}

export function registerCallback(req, res) {
  let register = checkClientRegisterData(req, res)

  if (!register) return

  const client_id = genRandomString(16)
  register = {
    ...register,
    client_id,
    client_secret: genRandomString(16),
    client_id_created_at: Date.now() / 1000,
    client_secret_expires_at: 0,
    registration_access_token: genRandomString(32),
    registration_client_uri: "http://localhost:9001/register/" + client_id,
  }

  clientStore.add(register)
  return res.status(201).json(register)
}

function checkRegisterAllElementLength(body) {
  return JSON.stringify(body).length < MAX_SIZE_OF_REGISTER_OBJECT
}

function checkRegisterElementLength(element, type) {
  switch (type) {
    case "client_name":
      return element.length < MAX_SIZE_OF_REGISTER_KEY_OF_CLIENT_NAME
    case "redirect_uris":
      return (
        JSON.stringify(element).length <
        MAX_SIZE_OF_REGISTER_KEY_OF_REDIRECT_URIS
      )
    case "scope":
      return element.length < MAX_SIZE_OF_REGISTER_KEY_OF_SCOPE
    default:
      return JSON.stringify(element).length < MAX_SIZE_OF_REGISTER_DEFAULT_KEY
  }
}

export function approveCallback(req, res) {
  const reqId = req.body.req_id
  const query = requests[reqId]
  delete requests[reqId]

  if (!query) {
    res.render("error", { error: "Mismatch authorize request" })
    return
  }

  if (req.body.approve) {
    const reqScope = getScopesFromForm(req.body)
    const client = clientStore.get(query.client_id)
    const clientScope = client.scope ? client.scope.split(" ") : undefined

    if (!reqScope || diffScope(reqScope, clientScope)) {
      const urlParsed = buildUrl(query.redirect_uri, { error: "access_denied" })
      res.redirect(urlParsed)
      return
    }

    const scope = reqScope.join(" ")
    const code = genRandomString(8)
    codes[code] = { request: query, scope: scope }

    const urlParsed = buildUrl(query.redirect_uri, { code, state: query.state })
    res.redirect(urlParsed)
  } else {
    // 用户拒绝授权
    const urlParsed = buildUrl(query.redirect_uri, { error: "access_denied" })
  }
}

function diffScope(reqScope, clientScope) {
  if (reqScope.length > clientScope.length) return true

  for (const s of reqScope) {
    if (clientScope.includes(s)) continue

    return true
  }

  return false
}

export function authorizeCallback(req, res) {
  const checked = checkAuthorizeReq(req, res)

  if (!checked) return

  const reqId = genRandomString(8)
  requests[reqId] = req.query

  return res.render("approve", {
    client: checked.client,
    reqId: reqId,
    scope: checked.scope,
  })
}

function checkAuthorizeReq(req, res) {
  const client = clientStore.get(req.query.client_id)

  if (!client) {
    return res.render("error", { error: "Unknown Client" })
  }

  if (req.query.response_type !== RESPONSE_TYPE_OF_AUTHORIZATION_CODE) {
    return res.render("error", {
      error: "Invalid response type: " + req.query.response_type,
    })
  }

  if (!req.query.state) {
    return res.render("error", { error: "missing state" })
  }

  if (!client.redirect_uris.includes(req.query.redirect_uri)) {
    console.error(
      "mismatched redirect uri, expected: %s, got: %s",
      client.redirect_uris,
      req.query.redirect_uri
    )
    return res.render("error", { error: "Invalid redirect uri" })
  }

  const reqScope = req.query.scope ? req.query.scope.split(" ") : undefined
  const clientScope = client.scope ? client.scope.split(" ") : undefined

  if (diffScope(reqScope, clientScope)) {
    const urlParsed = buildUrl(req.query.redirect_uri, {
      error: "Invalid_scope",
    })
    return res.redirect(urlParsed)
  }

  const scope = reqScope || clientScope
  return { client, scope }
}

export function tokenCallback(req, res) {
  const client = checkClientCredential(req, res)

  if (!client) return

  const clientId = client.client_id

  const grant_type = req.body.grant_type
  if (!client.grant_types.includes(grant_type)) {
    return res.status(401).json({ error: "Invalid client grant type" })
  }

  if (grant_type === GRANT_TYPE_AUTHORIZATION_CODE) {
    const codeObj = codes[req.body.code]

    if (!codeObj) {
      console.error('Token post request with unknown code: ' + req.body.code);
      return res.status(400).json({error: 'Invalid code'})
    }

    delete codes[req.body.code]

    if (codeObj.request.client_id !== clientId) {
      console.error('Token post request found client mismatch, expected: %s, got: %s', codeObj.request.client_id, clientId);
      return res.status(400).json({error: 'Invalid client'})
    }

    tokenStore.deleteByClientAndGrantType(clientId, GRANT_TYPE_AUTHORIZATION_CODE)

    // pkce verify
    if (codeObj.request.code_challenge) {
      let code_challenge

      if (codeObj.request.code_challenge_method === PKCE_CODE_CHALLENGE_METHOD_PLAIN) {
        code_challenge = req.body.code_verifier
      } else if (codeObj.request.code_challenge_method === PKCE_CODE_CHALLENGE_METHOD_S256) {
        code_challenge = base64url.fromBase64(crypto.createHash('sha256').update(req.body.code_verifier).digest('base64'))
      } else {
        return res.status(400).json({error: 'Invalid request code challenge method: ' + codeObj.request.code_challenge_method})
      }

      if (codeObj.request.code_challenge !== code_challenge) {
        console.error('Code challenge mismatch, expected: %s, got: %s', codeObj.request.code_challenge, code_challenge);
        return res.status(400).json({error: 'Invalid code challenge'})
      }
    }

    let scope = codeObj.scope

    if (Array.isArray(scope)) {
      scope = scope.join(' ')
    }
    
    const accessTokenFormat = TOKEN_FORMAT_JWT
    const expire = generateTokenExpire()
    const accessToken = generateAccessToken(accessTokenFormat, scope, expire)
    const refreshToken = generateRefreshToken()
    const tokenInfo = constructTokenInfoWithAuthorizationCode(clientId, scope, accessToken, refreshToken, expire, accessTokenFormat)
    tokenStore.add(tokenInfo)

    const tokenResponse = {
      access_token: accessToken,
      token_type: TOKEN_TYPE,
      refresh_token: refreshToken,
      scope,
    }

    return res.status(200).setHeader(HTTP_RESPONSE_HEADER_KEY_OF_TOKEN_EXPIRE, expire).json(tokenResponse)

  } else if (grant_type === GRANT_TYPE_REFRESH_TOKEN) {
    const doc = tokenStore.deleteByRefreshToken(req.body.refresh_token)
    if (!doc) {
      return res.status(400).json({error: 'Invalid Refresh Token: ' + req.body.refresh_token})
    }

    if (doc.client_id !== clientId) {
      console.error('Refresh token belongs to client: %s, but from client: %s', doc.client_id, clientId);
      return res.status(400).json({error: 'Invalid client'})
    }

    const grantType = doc.grant_type
    const accessTokenFormat = TOKEN_FORMAT_JWT
    const expire = generateTokenExpire()
    const accessToken = generateAccessToken(accessTokenFormat, doc.scope, expire)
    const refreshToken = generateRefreshToken()
    let tokenInfo

    if (grantType === GRANT_TYPE_AUTHORIZATION_CODE) {
      tokenInfo = constructTokenInfoWithAuthorizationCode(clientId, doc.scope, accessToken, refreshToken, expire, accessTokenFormat)
    } else {
      tokenInfo = constructTokenInfoWithPassword(clientId, doc.user_name, doc.scope, accessToken, refreshToken, expire, accessTokenFormat)
    }
    
    tokenStore.add(tokenInfo)
    const tokenResponse = {
      access_token: accessToken,
      token_type: TOKEN_TYPE,
      refresh_token: refreshToken,
      scope: doc.scope,
    }

    return res.status(200).setHeader(HTTP_RESPONSE_HEADER_KEY_OF_TOKEN_EXPIRE, expire).json(tokenResponse) 

  } else if (grant_type === GRANT_TYPE_CLIENT_CREDENTIALS) {
    const reqScope = req.body.scope ? req.body.scope.split(' ') : undefined
    const clientScope = client.scope ? client.scope.split(' ') : undefined

    if (diffScope(reqScope, clientScope)) {
      return res.status(400).json({error: 'Invalid scope'})
    }

    tokenStore.deleteByClientAndGrantType(clientId, GRANT_TYPE_CLIENT_CREDENTIALS)

    const tokenScope = req.body.scope || client.scope
    const accessTokenFormat = TOKEN_FORMAT_JWT
    const expire = generateTokenExpire()
    const accessToken = generateAccessToken(accessTokenFormat, tokenScope, expire)
    const tokenInfo = constructTokenInfoWithClientCredentials(clientId, tokenScope, accessToken, expire, accessTokenFormat)

    tokenStore.add(tokenInfo)
    const tokenResponse = {
      access_token: accessToken,
      token_type: TOKEN_TYPE,
      scope: tokenScope
    }
    return res.status(200).setHeader(HTTP_RESPONSE_HEADER_KEY_OF_TOKEN_EXPIRE, expire).json(tokenResponse)
  } else if (grant_type === GRANT_TYPE_PASSWORD) {
    const username = req.body.username
    const user = userStore.findByUsername(username)

    if (!user) {
      console.error('Token post request with invalid username: ' + username));
      return res.status(401).json({error: 'Invalid grant'})
    }

    const password = req.body.password
    if (!checkPasswordForTokenRequest(password, user)) {
      console.error('Check password error, username: %s, password: %s', username, password);
      return res.status(401).json({error: 'Invalid grant'})
    }

    const reqScope = req.body.scope ? req.body.scope.split(' ') : undefined
    const clientScope = client.scope ? client.scope.split(' ') : undefined

    if (diffScope(reqScope, clientScope)) {
      return res.status(400).json({error: 'Invalid scope'})
    }

    tokenStore.deleteByClientAndGrantType(clientId, GRANT_TYPE_PASSWORD)

    const tokenScope = req.body.scope || client.scope
    const accessTokenFormat = TOKEN_FORMAT_JWT
    const expire = generateTokenExpire()
    const accessToken = generateAccessToken(accessTokenFormat, tokenScope, expire)
    const refreshToken = generateRefreshToken()
    const tokenInfo = constructTokenInfoWithPassword(clientId, username, tokenScope, accessToken, refreshToken, expire, accessTokenFormat)

    tokenStore.add(tokenInfo)
    const tokenResponse = {
      access_token: accessToken,
      token_type: TOKEN_TYPE,
      refresh_token: refreshToken,
      scope: tokenScope
    }
    return res.status(200).setHeader(HTTP_RESPONSE_HEADER_KEY_OF_TOKEN_EXPIRE, expire).json(tokenResponse)


  } else {
    return res
      .status(400)
      .json({ error: "Unsupported grant type: " + grant_type })
  }
}

export function introspectCallback(req, res) {
  const auth = req.headers['authorization']

  if (!auth) {
    return res.status(404).json({error: 'Invalid authorization header'})
  }

  const credential = decodeClientCredential(auth)
  const clientId = credential.id
  const clientSecret = credential.secret
  const client = clientStore.get(clientId)

  if (!client) {
    return res.status(404).json({error: 'Invalid client'})
  }

  if (clientSecret !== client.client_secret) {
    console.error('Resource secret error, expected: %s, got: %s', client.client_secret, clientSecret);
    return res.status(401).json({error: 'Invalid client'})
  }

  const accessToken = req.body.token
  const tokenInfo = tokenStore.findByAccessToken(accessToken)

  let expired = false
  if (tokenInfo) {
    expired = Date.now() > tokenInfo.expire

    if (!expired) {
      const introspectionResponse = {
        active: true,
        username: tokenInfo.user_name,
        scope: tokenInfo.scope,
        client_id: tokenInfo.client_id,
        exp: tokenInfo.expire
      }
      return res.status(200).json(introspectionResponse)
    }
  }

  if (expired) {
    console.warn('Access token expired');
  } else {
    console.error('Not Found access token');
  }

  return res.status(200).json({active: true})
}

export function revokeCallback(req, res) {
  const auth = req.headers['authorization']
  let clientId
  let clientSecret

  if (auth) {
    const credential = decodeClientCredential(auth) 
    clientId = credential.id
    clientSecret = credential.secret
  }

  if (req.body.client_id) {
    if (clientId) {
      return res.status(401).json({error: 'Invalid client: Duplicated client'})
    }
    clientId = req.body.client_id
    clientSecret = req.body.client_secret
  }

  const client = clientStore.get(clientId)

  if (!client) {
    return res.status(401).json({error: 'Invalid client'})
  }

  if (client.client_secret !== clientSecret) {
    console.error('Client secret error, expected: %s, got: %s', client.client_secret, clientSecret);
    return res.status(401).json({error: 'Invalid client'})
  }

  const accessToken = req.body.token
  const tokenInfo = tokenStore.get(accessToken)

  if (tokenInfo) {
    console.error('Not Found acess token: ', accessToken);
  } else {
    tokenStore.deleteByAccessToken(accessToken)
  }

  return res.status(204).end()
}

export function pubJwkCallback(req, res) {
  const auth = req.headers['authorization']
  let clientId
  let clientSecret

  if (auth) {
    const credential = decodeClientCredential(auth) 
    clientId = credential.id
    clientSecret = credential.secret
  }

  if (req.body.client_id) {
    if (clientId) {
      return res.status(401).json({error: 'Invalid client: Duplicated client'})
    }
    clientId = req.body.client_id
    clientSecret = req.body.client_secret
  }

  const client = clientStore.get(clientId)

  if (!client) {
    return res.status(401).json({error: 'Invalid client'})
  }

  if (client.client_secret !== clientSecret) {
    console.error('Client secret error, expected: %s, got: %s', client.client_secret, clientSecret);
    return res.status(401).json({error: 'Invalid client'})
  }

  return client
}

function generateTokenExpire(expire = TOKEN_EXPIRE_DEFAULT) {
  return Date.now() + expire
}

function constructTokenInfoWithAuthorizationCode(clientId, scope, accessToken, refreshToken, expire, format) {
  return constructTokenInfo(clientId, '', scope, GRANT_TYPE_AUTHORIZATION_CODE, format, expire, accessToken, refreshToken)
}

function constructTokenInfoWithClientCredentials(clientId, scope, accessToken, expire, format) {
  return constructTokenInfo(clientId, '', scope, GRANT_TYPE_CLIENT_CREDENTIALS, format, expire, accessToken, '')
}

function constructTokenInfoWithPassword(clientId, username, scope, accessToken, refreshToken, expire, format) {
  return constructTokenInfo(clientId, username, scope, GRANT_TYPE_PASSWORD, format, expire, accessToken, refreshToken)
}

function generateAccessToken(format = TOKEN_FORMAT_JWT, scope, expire) {
  if (format === TOKEN_FORMAT_JWT) {
    return generateJwtAccessToken(scope, expire)
  } else {
    return genRandomString(32)
  }
}

function generateRefreshToken() {
  return genRandomString(32)
}

function generateJwtAccessToken(scope, expire) {
  const header = {'typ': 'JWT', 'alg': 'RS256'}
  const payload = {
    iat: Math.floor(Date.now() / 100),
    exp: Math.floor(expire / 1000),
    scope: scope,
    jti: genRandomString(8)
  }

  return signJwtToken(header.alg, JSON.stringify(header), JSON.stringify(payload))
}

function constructTokenInfo(clientId, username, scope, grantType, format, expire, accessToken, refreshToken) {
  accessToken = md5(accessToken)
  return {
    client_id: clientId,
    user_name: username,
    scope,
    grant_type: grantType,
    format,
    expire, 
    access_token: accessToken,
    refresh_token: refreshToken,
  }
}

export const getClientConfigCallback(req, res) {
  const checked = authorizeClientManageRequest(req, res)

  if (checked) {
    req.client.client_secret = genRandomString(16)
    req.registration_access_token = genRandomString(16)
    clientStore.update(req.client, ['client_secret', 'registration_access_token'])

    return res.status(200).json(req.client)
  }
}

export function deleteClientConfigCallback(req, res) {
  const checked = authorizeClientManageRequest(req,res)

  if (checked) {
    clientStore.delete(req.client.client_id)
    return res.status(204).end()
  }
}

// TODO
function removeTokenOfClient(clientId, grantType) {
  console.error('Not Implemented');
}

function checkPasswordForTokenRequest(password, user) {
  // TODO
  return true
}


