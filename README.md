<div align="center">

</div>
  <br />
      <img src="https://ik.imagekit.io/wxbqpn4hbe/stockpilot_banner.png?updatedAt=1786216405146" alt="Project Banner">
  <br />

<p align="center">
  <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=next.js&color=black" alt="next-js"/> 
  <img src="https://img.shields.io/badge/-Better Auth-black?style=for-the-badge&logoColor=white&logo=betterauth&color=black" alt="better-auth"/>
  <img src="https://img.shields.io/badge/-Shadcn-black?style=for-the-badge&logoColor=white&logo=shadcnui&color=black" alt="shadcn-ui"/>
  <img src="https://img.shields.io/badge/-Inngest-black?style=for-the-badge&logoColor=white&logo=inngest&color=black" alt="inngest"/><br>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind--CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
</p>

---

# 🚀 StockPilot

**StockPilot** is a modern, high-performance stock monitoring and alert system built to provide investors with real-time insights and automated portfolio tracking. Leveraging a robust event-driven architecture, it ensures you never miss a market move.

## 📖 Table of Contents
1. [🌟 Introduction](#-introduction)
2. [🛠 Tech Stack](#--tech-stack)
3. [✨ Key Features](#-features)
4. [🚀 Quick Start](#-quick-start)
5. [👨‍💻 Developer Details](#-developer-details)
6. [📜 License](#-license)

---

## 🌟 Introduction
StockPilot is designed for investors who need more than just a watchlist. It combines a sleek, responsive interface with powerful background processing to deliver automated alerts, daily newsletters, and a secure user experience. Whether you're a day trader or a long-term investor, StockPilot helps you stay ahead of the curve.

---

## 🛠 ⚙️ Tech Stack

- **[Better Auth](https://www.better-auth.com/)**: A robust, framework-agnostic authentication library that secures StockPilot with email/password logins, social SSO, and multi-factor authentication for maximum account safety.

- **[CodeRabbit](https://jsm.dev/stocks-coderabbit)**: An AI-driven code review partner integrated into our workflow to ensure high code quality, catch potential bugs early, and maintain industry-standard best practices.

- **[Finnhub](https://finnhub.io/)**: Our primary financial data engine, providing real-time stock, forex, and crypto market data, along with deep fundamental insights and economic indicators.

- **[Inngest](https://jsm.dev/stocks-inngest)**: The backbone of our event-driven architecture, enabling reliable background jobs for real-time price alerts, automated notifications, and AI-powered workflows.

- **[MongoDB](https://www.mongodb.com/)**: A flexible NoSQL database that powers StockPilot's high-performance data storage, handling user profiles and stock data with dynamic schema support.

- **[Nodemailer](https://nodemailer.com/)**: A dependable Node.js service for dispatching transactional emails, ensuring users receive their OTPs and market alerts instantly and reliably.

- **[Next.js 15](https://nextjs.org/docs)**: The core framework providing lightning-fast performance through server-side rendering, static generation, and optimized full-stack React capabilities.

- **[Shadcn UI](https://ui.shadcn.com/docs)**: A collection of beautiful, accessible, and fully customizable components that ensure StockPilot delivers a premium and consistent user experience.

- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first styling framework that allows us to build a highly responsive and modern interface with precision and speed.

- **[TypeScript](https://www.typescriptlang.org/)**: Ensures a rock-solid codebase with static typing, improving maintainability and significantly reducing runtime errors.

---

## ✨🔋 Features

👉 **Stock Dashboard**: Stay on top of the market with real-time price tracking and interactive charts (line/candlestick), featuring historical data and advanced filtering by industry or performance.

👉 **Intelligent Search**: Navigate the financial world effortlessly with a powerful, fast-search system designed to help you find and analyze stocks in seconds.

👉 **Smart Watchlist & Alerts**: Curate your personal portfolio and set custom alert thresholds for price movements or volume surges, with instant email notifications to keep you informed.

👉 **Deep Company Insights**: Access comprehensive financial metrics, including PE ratios, EPS, and revenue trends, alongside real-time news, analyst ratings, and sentiment scores.

👉 **Event-Driven Workflows**: Powered by Inngest, our system automates critical tasks like price monitoring, alert scheduling, and generating AI-driven market reports.

👉 **AI-Powered Digests**: Receive personalized market summaries and daily earnings reports, leveraging AI to help you make data-driven investment decisions.

👉 **Tailored Notifications**: Fully customizable alert settings that adapt to your specific watchlist and trading preferences for a truly personal experience.

👉 **Advanced Analytics**: Gain a competitive edge with insights into stock trends and engagement metrics, enabling smarter, evidence-based trading decisions.

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/TheHarmanCodes/StockPilot_stock_tracker_app stocks_app
cd stocks_app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
NODE_ENV='development'
NEXT_PUBLIC_BASIC_URL=http://localhost:3000

#database MONGODB
MONGODB_URI=

#BETTER AUTH
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

#GEMINI
GEMINI_API_KEY=


#NODEMAILER
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=

#FINNHUB
FINNHUB_API_KEY=
EMAIL_LINK_TOKEN_SECRET=
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 👨‍💻 Developer Details

**Harman Singh**  
*Full Stack Developer*

- 📧 Email: [Harman.in@outlook.com](mailto:Harman.in@outlook.com)
---

## 📜 License

This project is proprietary and all rights are reserved by **Harman Singh**. See the [LICENSE](LICENSE) file for more information on usage restrictions.

© 2026 Harman Singh. All rights reserved.
