# Real-Time Cryptocurrency Dashboard

A full-stack application that displays live exchange rates for ETH/USDC, ETH/USDT, and ETH/BTC with real-time charts and data updates.

## 🚀 Quick Start with Docker

### Prerequisites

- Docker and Docker Compose
- Finnhub API key ([Get one free here](https://finnhub.io/register))

### 1. One-Command Setup

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd crypto-dasbhoard

# Setup and run the entire application
docker-compose up
```

## 📱 Access the Application

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:3001

## 🔧 API Key Configuration

1. Visit [Finnhub.io](https://finnhub.io/register) and create a free account
2. Copy your API key from the dashboard
3. **Option 1**: Configure through the web UI (Settings ⚙️ button)
4. **Option 2**: Add to `.env` file: `FINNHUB_API_KEY=your_api_key_here`

## 🏗️ What's Inside

### Backend (NestJS + TypeScript)

- Real-time WebSocket connection to Finnhub API
- Hourly average calculations and persistence
- RESTful API endpoints
- Comprehensive error handling and reconnection logic

### Frontend (React + TypeScript)

- Real-time dashboard with live price updates
- Interactive charts for all three currency pairs
- Connection state management
- Modern, responsive design

## 🔍 Key Features

- **Live Price Updates**: Real-time streaming via WebSocket
- **Interactive Charts**: Live price charts with historical data
- **Hourly Averages**: Calculated and displayed automatically
- **Connection Monitoring**: Visual connection state indicators
- **Error Handling**: Graceful handling of connection failures

## 🛠️ Development

### Run Tests

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Local Development (without Docker)

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

## 📊 API Endpoints

- `GET /api/crypto/current-prices` - Current prices for all pairs
- `GET /api/crypto/price-history?symbol=BINANCE:ETHUSDC&hours=24` - Price history
- `GET /api/crypto/hourly-averages?hours=24` - Hourly averages
- `GET /api/crypto/connection-status` - Connection status
- `GET /api/crypto/stats` - System statistics

## 🚨 Troubleshooting

**"API key not configured"**: Configure your API key through the Settings UI or `.env` file

**"Connection failed"**: Check internet connection and verify API key validity

**Frontend can't connect**: Ensure backend is running on port 3001

---

**Built with NestJS, React, TypeScript, and Docker**
