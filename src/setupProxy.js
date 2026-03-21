const { createProxyMiddleware } = require('http-proxy-middleware');

const GETSONGBPM_API_KEY = 'cd5cf88f35e7296383bbeb1fc9961737';
const RAPIDAPI_KEY = 'fd3e7696d3mshb9d1c59341a85f6p1314a9jsn606dbb41fa43';

module.exports = function(app) {
  // GetSongBPM proxy
  app.use(
    '/bpm-api',
    createProxyMiddleware({
      target: 'https://api.getsong.co',
      changeOrigin: true,
      pathRewrite: (path) => {
        const newPath = path.replace('/bpm-api', '');
        const separator = newPath.includes('?') ? '&' : '?';
        return `${newPath}${separator}api_key=${GETSONGBPM_API_KEY}`;
      },
      onProxyReq: (proxyReq) => {
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
        proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.setHeader('Referer', 'https://getsongbpm.com/');
        proxyReq.setHeader('Origin', 'https://getsongbpm.com');
        proxyReq.removeHeader('x-forwarded-for');
        proxyReq.removeHeader('x-forwarded-host');
        proxyReq.removeHeader('x-forwarded-proto');
        console.log('[BPM Proxy]', proxyReq.path);
      },
      onProxyRes: (proxyRes) => {
        console.log('[BPM Proxy] Response:', proxyRes.statusCode);
      },
    })
  );

  // RapidAPI (Spotify Extended Audio Features) - custom route instead of proxy
  app.get('/rapid-api/*', async (req, res) => {
    const path = req.url.replace('/rapid-api', '');
    const url = `https://spotify-extended-audio-features-api.p.rapidapi.com${path}`;
    console.log('[RapidAPI]', url);
    
    try {
      const https = require('https');
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': 'spotify-extended-audio-features-api.p.rapidapi.com',
          'Content-Type': 'application/json',
        },
      };

      const apiReq = https.request(options, (apiRes) => {
        // Follow redirects manually
        if (apiRes.statusCode === 301 || apiRes.statusCode === 302 || apiRes.statusCode === 307) {
          const redirectUrl = apiRes.headers.location;
          console.log('[RapidAPI] Following redirect to:', redirectUrl);
          
          const followRedirect = (url, depth) => {
            if (depth > 5) {
              res.status(500).json({ error: 'Too many redirects' });
              return;
            }
            const mod = url.startsWith('https') ? require('https') : require('http');
            mod.get(url, { headers: options.headers }, (rRes) => {
              if (rRes.statusCode === 301 || rRes.statusCode === 302 || rRes.statusCode === 307) {
                console.log('[RapidAPI] Another redirect to:', rRes.headers.location);
                followRedirect(rRes.headers.location, depth + 1);
              } else {
                let data = '';
                rRes.on('data', chunk => data += chunk);
                rRes.on('end', () => {
                  console.log('[RapidAPI] Final response:', rRes.statusCode, 'data length:', data.length);
                  res.setHeader('Content-Type', 'application/json');
                  res.status(200).send(data);
                });
              }
            }).on('error', (err) => {
              console.error('[RapidAPI] Redirect error:', err.message);
              res.status(500).json({ error: err.message });
            });
          };
          
          followRedirect(redirectUrl, 0);
        } else {
          let data = '';
          apiRes.on('data', chunk => data += chunk);
          apiRes.on('end', () => {
            console.log('[RapidAPI] Response:', apiRes.statusCode);
            res.setHeader('Content-Type', 'application/json');
            res.status(apiRes.statusCode).send(data);
          });
        }
      });

      apiReq.on('error', (err) => {
        console.error('[RapidAPI] Request error:', err.message);
        res.status(500).json({ error: err.message });
      });

      apiReq.end();
    } catch (err) {
      console.error('[RapidAPI] Error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
};
