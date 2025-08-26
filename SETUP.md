# Quick Setup Guide

## 1. Environment Variables
Create a `.env.local` file in the root directory:

```env
WEATHERAPI_KEY=your_weatherapi_key_here
DATABASE_URL="file:./dev.db"
```

## 2. Get WeatherAPI.com API Key
1. Go to [WeatherAPI.com](https://www.weatherapi.com/)
2. Sign up for a free account
3. Get your API key (1 million calls/month free!)
4. Add it to `.env.local`

## 3. Install Dependencies
```bash
npm install
```

## 4. Setup Database
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## 5. Start Development Server
```bash
npm run dev
```

## 6. Open Browser
Navigate to [http://localhost:3000](http://localhost:3000)

## Demo Cities
The app comes pre-loaded with:
- London, GB
- New York, US
- Tokyo, JP
- Paris, FR
- Sydney, AU

## Add New Cities
Use the search bar to add cities in format: "City, Country"
Example: "Berlin, DE", "Mumbai, IN"

## 🌟 New Features with WeatherAPI.com
- **High-resolution weather data** (1-11 km accuracy)
- **Air quality indices** (US EPA & GB DEFRA)
- **Better forecast accuracy**
- **More detailed weather conditions**
- **1 million free API calls per month**
