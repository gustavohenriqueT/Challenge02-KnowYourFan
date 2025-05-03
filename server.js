require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock database
const database = {
  users: [
    { id: 1, username: 'admin', password: 'furia2023', role: 'admin' },
    { id: 2, username: 'analyst', password: 'furia123', role: 'analyst' }
  ],
  fans: [
    {
      id: 1,
      name: 'Carlos Silva',
      age: 24,
      location: 'São Paulo',
      engagement: 'high',
      favoriteGame: 'CS:GO',
      socialMedia: {
        twitter: '@carlosesl',
        instagram: 'carlos.silva',
        twitch: 'carlostwitch'
      },
      interactions: [
        { type: 'purchase', date: '2023-05-10', value: 120 },
        { type: 'social', platform: 'twitter', action: 'retweet', date: '2023-05-12' }
      ]
    },
    {
      id: 2,
      name: 'Ana Oliveira',
      age: 22,
      location: 'Rio de Janeiro',
      engagement: 'medium',
      favoriteGame: 'Valorant',
      socialMedia: {
        twitter: '@anaoli',
        instagram: 'ana.oliveira'
      },
      interactions: [
        { type: 'social', platform: 'instagram', action: 'like', date: '2023-05-15' }
      ]
    }
  ]
};

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const user = database.users.find(u => `Bearer ${u.username}-${u.role}` === token);
  if (!user) return res.status(403).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

// Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = database.users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = `${user.username}-${user.role}`;
  res.json({ 
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
});

app.get('/api/fans', authenticate, (req, res) => {
  const { location, engagement, game } = req.query;
  let fans = database.fans;

  if (location) {
    fans = fans.filter(f => f.location.toLowerCase().includes(location.toLowerCase()));
  }

  if (engagement) {
    fans = fans.filter(f => f.engagement === engagement);
  }

  if (game) {
    fans = fans.filter(f => f.favoriteGame === game);
  }

  res.json(fans);
});

app.get('/api/fans/:id', authenticate, (req, res) => {
  const fan = database.fans.find(f => f.id === parseInt(req.params.id));
  if (!fan) return res.status(404).json({ error: 'Fan not found' });
  res.json(fan);
});

app.get('/api/analytics', authenticate, (req, res) => {
  const analytics = {
    totalFans: database.fans.length,
    byLocation: database.fans.reduce((acc, fan) => {
      acc[fan.location] = (acc[fan.location] || 0) + 1;
      return acc;
    }, {}),
    byGame: database.fans.reduce((acc, fan) => {
      acc[fan.favoriteGame] = (acc[fan.favoriteGame] || 0) + 1;
      return acc;
    }, {}),
    engagementStats: {
      high: database.fans.filter(f => f.engagement === 'high').length,
      medium: database.fans.filter(f => f.engagement === 'medium').length,
      low: database.fans.filter(f => f.engagement === 'low').length
    }
  };

  res.json(analytics);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access: http://localhost:${PORT}`);
});