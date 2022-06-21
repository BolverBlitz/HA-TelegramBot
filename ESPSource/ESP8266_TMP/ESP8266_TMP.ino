#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Arduino_JSON.h>

#include <OneWire.h>
#include <DallasTemperature.h>

const char* ssid     = "";
const char* password = "";

//Dual
unsigned long Dualtimestamp;

//Webserver Adress
String ServerName = "http://192.168.0.80:7337/api/v1/TEMP/1?";

// GPIO where the ONEWIRE is connected to
const int oneWireBus = 0;
OneWire oneWire(oneWireBus);

// Load and Link TMP Sensor Lib to ONEWIRE Client
DallasTemperature sensors(&oneWire);

// Store of multiple adressed and devices
DeviceAddress tempDeviceAddress;

// TEMP Globals
float temp1 = 00.00;
float temp2 = 00.00;
float temp3 = 00.00;

void setup()
{
  Serial.begin(115200);
  delay(10);
  sensors.begin();

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
}

void loop()
{
        if(WiFi.status()== WL_CONNECTED){
          HTTPClient http;

          Serial.print(sensors.getDeviceCount());
          Serial.println(" Devices Found");
          
          sensors.requestTemperatures(); 
          
          temp1 = sensors.getTempCByIndex(0);
          temp2 = sensors.getTempCByIndex(1);
          temp3 = sensors.getTempCByIndex(2);

          Serial.print(temp1);
          Serial.println("ºC");
          Serial.print(temp2);
          Serial.println("ºC");
          Serial.print(temp3);
          Serial.println("ºC");

          String URL = ServerName + "temp1=" + String(temp1, 2) + "&temp2=" + String(temp2, 2) + "&temp3=" + String(temp3, 2);
          
          http.begin(URL.c_str());
          int httpResponseCode = http.GET();

          if (httpResponseCode > 0 && httpResponseCode == 200) {
            JSONVar myObject = JSON.parse(http.getString());
            // JSONVar keys = myObject.keys();
            //int r = double(myObject[keys[0]]);
            // int g = double(myObject[keys[1]]);
            // int b = double(myObject[keys[2]]);

          } else {
            Serial.print("Error code: ");
            Serial.println(httpResponseCode);
          }
          http.end();
        }else{
          Serial.println("WiFi Disconnected");
        }
}
