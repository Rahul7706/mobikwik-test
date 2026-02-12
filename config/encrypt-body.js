const crypto = require("crypto");


function generateSessionKey() {
  return crypto.randomBytes(32);
}

function encryptPayload(payload, sessionKey) {
  const iv = crypto.randomBytes(16); // 16-byte IV

  const cipher = crypto.createCipheriv("aes-256-gcm", sessionKey, iv);

  const encryptedData = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag(); // 16 bytes

  return {
    encryptedPayload: Buffer.concat([encryptedData, authTag]).toString("base64"),
    iv: iv.toString("base64")
  };
}



function encryptSessionKey(sessionKey, publicKeyBase64) {
  const publicKeyPem = convertToPemPublicKey(publicKeyBase64);

  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_PADDING
    },
    sessionKey
  );

  return encryptedKey.toString("base64");
}


function convertToPemPublicKey(base64Key) {
  const cleanKey = base64Key.replace(/\s+/g, "");
  const formattedKey = cleanKey.match(/.{1,64}/g).join("\n");

  return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
}


function encryptRequest(payload, mobikwikPublicKeyBase64, keyVersion) {
  const sessionKey = generateSessionKey();
  const { encryptedPayload, iv } = encryptPayload(payload, sessionKey);
  
  const encryptedSessionKey = encryptSessionKey(
    sessionKey,
    mobikwikPublicKeyBase64
  );
  return {
    encryptedSessionKey,
    encryptedPayload,
    iv,
    keyVersion
  };
}

module.exports = encryptRequest
