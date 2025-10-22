const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// JWT verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, 'your_jwt_secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper for proxying requests with body
const proxyWithBody = (target, pathRewrite) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: pathRewrite || {}, // add this
    selfHandleResponse: false,
    onProxyReq: (proxyReq, req) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        proxyReq.end();
      }
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ message: `${target} is unavailable` });
    },
  });

// Public routes (no authentication)
app.use('/api/users', proxyWithBody('http://localhost:5001', { '^/api/users': '' }));

// Protected routes
app.use('/api/tasks', (req, res, next) => authenticateToken(req, res, next));
app.use('/api/tasks', proxyWithBody('http://localhost:5002', { '^/api/tasks': '/tasks' }));

app.use('/api/notifications', (req, res, next) => authenticateToken(req, res, next));
app.use('/api/notifications', proxyWithBody('http://localhost:5003', { '^/api/notifications': '/notifications' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'API Gateway is running',
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
