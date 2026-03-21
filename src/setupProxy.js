const { createProxyMiddleware } = require('http-proxy-middleware');

const GETSONGBPM_API_KEY = 'cd5cf88f35e7296383bbeb1fc9961737';

module.exports = function(app) {
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
        // Mimic browser headers to get past Cloudflare
        proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
        proxyReq.setHeader('Accept', 'application/json, text/plain, */*');
        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.setHeader('Referer', 'https://getsongbpm.com/');
        proxyReq.setHeader('Origin', 'https://getsongbpm.com');
        // Remove headers that look automated
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
};
