/*
 * Nodo ESP32 de laboratorio: sensor + MQTT + HMAC-SHA256 + nonce.
 * Cifrado: AES-128-CCM (mbedTLS en ESP32) sobre el payload.
 * Flashear con Arduino IDE (ESP32) o PlatformIO. No incluye ataques.
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <mbedtls/md.h>
#include <mbedtls/ccm.h>
#include <esp_random.h>

const char* WIFI_SSID = "LAB_SSID";
const char* WIFI_PASS = "LAB_PASS";
const char* MQTT_HOST = "192.168.1.50";
const char* MQTT_TOPIC = "sicml/sensors";
const char* NODE_ID = "esp32-01";

// 16 bytes; rotar en laboratorio y no commitear secretos reales.
const uint8_t AES_KEY[16] = {
  0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,
  0x88,0x99,0xaa,0xbb,0xcc,0xdd,0xee,0xff
};
const char* HMAC_KEY = "cambia-esta-clave-en-laboratorio";

WiFiClient wifi;
PubSubClient mqtt(wifi);
uint32_t nonce_counter = 0;

void hmac_hex(const uint8_t* data, size_t len, char* out_hex) {
  uint8_t mac[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&ctx, (const uint8_t*)HMAC_KEY, strlen(HMAC_KEY));
  mbedtls_md_hmac_update(&ctx, data, len);
  mbedtls_md_hmac_finish(&ctx, mac);
  mbedtls_md_free(&ctx);
  for (int i = 0; i < 32; i++) sprintf(out_hex + i * 2, "%02x", mac[i]);
}

bool encrypt_ccm(const uint8_t* plain, size_t plain_len, uint8_t* out, size_t* out_len) {
  uint8_t nonce[12];
  esp_fill_random(nonce, sizeof(nonce));
  uint8_t tag[16];
  mbedtls_ccm_context ccm;
  mbedtls_ccm_init(&ccm);
  mbedtls_ccm_setkey(&ccm, MBEDTLS_CIPHER_ID_AES, AES_KEY, 128);
  int rc = mbedtls_ccm_encrypt_and_tag(
      &ccm, plain_len, nonce, sizeof(nonce), NULL, 0, plain, out + 12, tag, sizeof(tag));
  mbedtls_ccm_free(&ccm);
  if (rc != 0) return false;
  memcpy(out, nonce, 12);
  memcpy(out + 12 + plain_len, tag, 16);
  *out_len = 12 + plain_len + 16;
  return true;
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(400);
  mqtt.setServer(MQTT_HOST, 1883);
}

void loop() {
  if (!mqtt.connected()) mqtt.connect(NODE_ID);
  nonce_counter++;
  char json[160];
  snprintf(json, sizeof(json),
           "{\"node\":\"%s\",\"temp\":24.5,\"motion\":0,\"nonce\":%lu}",
           NODE_ID, (unsigned long)nonce_counter);

  uint8_t cipher[256];
  size_t clen = 0;
  encrypt_ccm((const uint8_t*)json, strlen(json), cipher, &clen);

  char mac[65];
  hmac_hex(cipher, clen, mac);

  // Publicación: bytes cifrados en hex + hmac (el gateway valida).
  char hex[512];
  for (size_t i = 0; i < clen; i++) sprintf(hex + i * 2, "%02x", cipher[i]);
  char envelope[700];
  snprintf(envelope, sizeof(envelope),
           "{\"node\":\"%s\",\"nonce\":%lu,\"hmac\":\"%s\",\"blob\":\"%s\"}",
           NODE_ID, (unsigned long)nonce_counter, mac, hex);
  mqtt.publish(MQTT_TOPIC, envelope);
  delay(5000);
}
