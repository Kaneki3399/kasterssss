//npm install express request-ip geoip-lite fs request os dotenv path express-device ua-parser-js
//change botToken and chatId from .env file
//npm start
const express = require("express");
const requestIp = require("request-ip");
const geoip = require("geoip-lite");
const fs = require("fs");
const request = require("request");
const os = require("os");
const dotenv = require("dotenv");
const path = require("path");
const device = require("express-device");
const parser = require("ua-parser-js");


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const botToken = process.env.BOT_TOKEN;
const chatId = process.env.CHAT_ID;

app.use(requestIp.mw());
app.use(device.capture());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "img")));

function sendMessageToTelegram(message) {
  const telegramApiEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const requestBody = {
    chat_id: chatId,
    text: message,
  };

  request.post(
    {
      url: telegramApiEndpoint,
      json: true,
      body: requestBody,
    },
    (error, response, body) => {
      if (error) {
        console.error("Error sending message to Telegram:", error);
      } else if (response.statusCode !== 200) {
        console.error("Error: Telegram API responded with status code", response.statusCode);
      } else {
        // console.log("Message sent to Telegram:", body);
      }
    }
  );
}

app.use((req, res, next) => {
  const ip = req.clientIp;
  const port = req.socket.remotePort;
  const connectedTime = new Date().toLocaleString();
  const hostname = os.hostname();
  const domain = req.headers.host + req.originalUrl; 

  const geo = geoip.lookup(ip);
  const latitude = geo ? geo.ll[0] : "Unknown";
  const longitude = geo ? geo.ll[1] : "Unknown";

  const deviceInfo = req.device.type;
  const userAgent = req.headers["user-agent"];
  const browserInfo = parser(userAgent);

  const message = `New connection!\nIP: ${ip}\nPort: ${port}\nDomain: ${domain}\nConnected Time: ${connectedTime}\nDeviceName:\n Device: ${deviceInfo}\n Browser: ${browserInfo.browser.name} ${browserInfo.browser.version}\nLocation: ${latitude}, ${longitude}`;

  sendMessageToTelegram(message);

  next();
});

app.get("/", (req, res) => {
  fs.readFile(path.join(__dirname,'..','public_html',"index.html"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading HTML file:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.send(data);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
