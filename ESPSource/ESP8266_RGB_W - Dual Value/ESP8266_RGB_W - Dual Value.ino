#include <ESP8266WiFi.h>
#include <WiFiUDP.h>
#include <ESP8266HTTPClient.h>
#include <Adafruit_NeoPixel.h>
#include <Arduino_JSON.h>

const char* ssid     = "";
const char* password = "";

//Dual
unsigned long Dualtimestamp;
unsigned long deltaForF2= 100;  // Zeit Funktionsjump (ms)

unsigned long lastTime = 0;
unsigned long timerDelay = 2500;

// A UDP instance to let us send and receive packets over UDP
WiFiUDP Udp;
//Chance the number to the controler ID that is in the database!
String ServerName = "http://192.168.0.80:7337/api/v1/ESP/1";

char packet_buf[1024];

#define PIN 2
#define LEDS 300
#define PACKET_SZ ( (LEDS * 3) + 3 )

// Parameter 1 = number of pixels in strip
// Parameter 2 = Arduino pin number (most are valid)
// Parameter 3 = pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
Adafruit_NeoPixel strip = Adafruit_NeoPixel(LEDS, PIN, NEO_GRBW + NEO_KHZ800);

void setup()
{
  Serial.begin(115200);
  delay(10);

  // We start by connecting to a WiFi network
  Serial.println();
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  WiFi.setAutoReconnect(true);

  Serial.println("");
  Serial.println("WiFi connected");  
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
  Udp.begin(1234);
  strip.begin();
}

int value = 0;

void loop()
{
  int noBytes = Udp.parsePacket();

  if( noBytes )
  {
    //Serial.print("Received ");
    //Serial.print(noBytes);
    //Serial.print(" bytes\r\n");
    Udp.read(packet_buf, noBytes);

    if( noBytes == PACKET_SZ && packet_buf[0] == 0xAA )
      {
      unsigned short sum = 0;
      int checksum_0 = PACKET_SZ - 2;
      int checksum_1 = PACKET_SZ - 1;

      for( int i = 0; i < checksum_0; i++ )
        {
          sum += packet_buf[i];
        }

      //Test if valid write packet
      if( ( ( (unsigned short)packet_buf[checksum_0] << 8 ) | packet_buf[checksum_1] ) == sum )
      {
        for( int i = 0; i < LEDS/2; i++ )
        {
          int idx = 1 + ( 3 * i );

          //Test if it should be RGB_W
          if(250 < packet_buf[idx] and 250 < packet_buf[idx+1] and 250 < packet_buf[idx+2]){
            strip.setPixelColor(i, strip.Color(0,0,0,255));
            strip.setPixelColor(i+LEDS/2, strip.Color(0,0,0,255));
          }else{
            strip.setPixelColor(i, strip.Color(packet_buf[idx], packet_buf[idx+1], packet_buf[idx+2], 0));
            strip.setPixelColor(i+LEDS/2, strip.Color(packet_buf[idx], packet_buf[idx+1], packet_buf[idx+2], 0));
          }
        }
        strip.show();
      }
    }
    Dualtimestamp= millis();
  }else{
    if ((millis()-Dualtimestamp)>deltaForF2) {
      if ((millis() - lastTime) > timerDelay) {
        if(WiFi.status()== WL_CONNECTED){
          HTTPClient http;
          http.begin(ServerName.c_str());
          int httpResponseCode = http.GET();

          if (httpResponseCode>0) {
            JSONVar myObject = JSON.parse(http.getString());
            JSONVar keys = myObject.keys();
            int r = double(myObject[keys[0]]);
            int g = double(myObject[keys[1]]);
            int b = double(myObject[keys[2]]);
            int w = double(myObject[keys[3]]);

            for( int i = 0; i < LEDS; i++ )
            {
              strip.setPixelColor(i, strip.Color(r,g,b,w));
            }
            strip.show();
          } else {
            Serial.print("Error code: ");
            Serial.println(httpResponseCode);
          }
          http.end();
        }else{
          Serial.println("WiFi Disconnected");
        }
        lastTime = millis();
      }
    }
  }
}
