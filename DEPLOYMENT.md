# Deployment Guide

## 🚀 Vercel Deployment (Recommended)

### 1. Connect GitHub Repository
1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Import your weather-dashboard repository

### 2. Configure Environment Variables
Add these environment variables in Vercel:
```
OPENWEATHER_API_KEY=your_actual_api_key_here
DATABASE_URL=your_production_database_url
```

### 3. Deploy
- Vercel will automatically detect Next.js
- Build and deploy automatically
- Get your live URL instantly

## 🐳 Docker Deployment

### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Build and Run
```bash
docker build -t weather-dashboard .
docker run -p 3000:3000 weather-dashboard
```

## 🌐 Manual Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Start Production Server
```bash
npm start
```

### 3. Set Environment Variables
```bash
export NODE_ENV=production
export OPENWEATHER_API_KEY=your_key_here
export DATABASE_URL=your_db_url
```

## 🗄️ Database Setup

### SQLite (Development)
- Already configured
- File-based database
- No additional setup needed

### PostgreSQL (Production)
1. Create PostgreSQL database
2. Update DATABASE_URL in environment
3. Run migrations: `npx prisma migrate deploy`
4. Seed data: `npm run db:seed`

### MySQL (Production)
1. Create MySQL database
2. Update Prisma schema provider to "mysql"
3. Update DATABASE_URL
4. Run migrations and seed

## 🔧 Environment Configuration

### Required Variables
```env
OPENWEATHER_API_KEY=your_openweather_api_key
DATABASE_URL=your_database_connection_string
NODE_ENV=production
```

### Optional Variables
```env
REDIS_URL=your_redis_url
PORT=3000
HOSTNAME=0.0.0.0
```

## 📱 Domain & SSL

### Custom Domain
1. Add domain in Vercel dashboard
2. Update DNS records
3. SSL certificate automatically provided

### Subdomain
- Use Vercel's automatic subdomain
- Or configure custom subdomain

## 🔒 Security Considerations

### API Keys
- Never commit API keys to repository
- Use environment variables
- Rotate keys regularly

### Database
- Use strong passwords
- Enable SSL connections
- Restrict network access

### CORS
- Configure allowed origins
- Limit API access
- Implement rate limiting

## 📊 Monitoring & Analytics

### Vercel Analytics
- Built-in performance monitoring
- Real-time metrics
- Error tracking

### Custom Monitoring
- Health check endpoints
- Log aggregation
- Performance metrics

## 🚨 Troubleshooting

### Common Issues
1. **Build Failures**: Check environment variables
2. **Database Errors**: Verify connection strings
3. **API Errors**: Check OpenWeatherMap API key
4. **Performance**: Monitor bundle size and API calls

### Debug Mode
```bash
NODE_ENV=development npm run dev
```

## 🔄 CI/CD Pipeline

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Multiple instances
- Load balancer
- Database connection pooling

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching

### CDN
- Static asset distribution
- Global edge locations
- Reduced latency

---

**For production use, consider implementing Redis caching, user authentication, and monitoring solutions.**
