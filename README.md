# PayRecover AI

## Overview

PayRecover AI is an intelligent payment recovery platform designed to monitor payment transactions, analyze failed payments, and recommend suitable recovery actions.

The platform provides a centralized dashboard for tracking payment activity, failed transactions, recovery records, and recovery performance.

It combines a React-based frontend with a Node.js/Express backend, MongoDB persistence, payment integration, a recovery engine, and an AI recovery service.

---

## Problem Statement

Payment failures can result in lost revenue and require manual intervention to identify, analyze, and recover unsuccessful transactions.

Businesses need a system that can:

* Monitor payment transactions
* Identify failed payments
* Analyze payment failures
* Prioritize recovery opportunities
* Recommend appropriate recovery actions
* Track recovery attempts and outcomes

PayRecover AI addresses these challenges through an integrated payment recovery workflow.

---

## Solution

PayRecover AI processes payment failures through an intelligent recovery pipeline:

```text
Payment
   ↓
Failure Analysis
   ↓
Recovery Engine
   ↓
AI Recovery Service
   ↓
Recommended Action + Priority
   ↓
Recovery Record
   ↓
Recovery Email / Recovery Action
```

The platform helps organize failed-payment recovery into a structured workflow and provides visibility through an analytics dashboard.

---

## Key Features

* Payment monitoring
* Failed payment detection
* Intelligent recovery engine
* Recovery priority
* AI-powered recovery recommendations
* Recovery tracking
* Recovery email workflow
* Analytics dashboard
* Payment statistics
* Recovery statistics

---

## Architecture

```text
┌─────────────────────────────┐
│       React Frontend        │
│   Dashboard / Payments /    │
│ Recoveries / Analytics etc. │
└──────────────┬──────────────┘
               │
               │ REST API
               ▼
┌─────────────────────────────┐
│      Node.js / Express      │
│ Controllers / Routes /      │
│ Services / Business Logic   │
└──────────────┬──────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────────┐
│   MongoDB   │  │ Recovery Engine │
│             │  │                 │
│ Payments &  │  │ Failure         │
│ Recoveries  │  │ Analysis        │
└─────────────┘  └────────┬────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │ AI Recovery       │
                 │ Service           │
                 │                  │
                 │ Recommendations  │
                 └──────────────────┘
```

---

## Technology Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Lucide React
* Recharts

### Backend

* Node.js
* Express.js
* MongoDB
* Razorpay integration
* REST APIs

### Recovery & AI

* Recovery Engine
* AI Recovery Service
* Recovery prioritization
* Recovery recommendation workflow

### Communication

* Email recovery workflow
* SMTP/Nodemailer-based email service

---

## Project Structure

```text
payrecover-ai/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── index.css
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── seed/
│   ├── aiRecovery.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

Make sure the following are installed:

* Node.js
* npm
* MongoDB
* Git

Clone the repository:

```bash
git clone https://github.com/vaishnavisrinath8-bit/payrecover-ai.git
```

Move into the project:

```bash
cd payrecover-ai
```

---

## Environment Variables

Environment variables are required for configuration and security.

**Never commit real credentials or secret keys to GitHub.**

### Backend

Create:

```text
backend/.env
```

Example:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_email_password
SMTP_FROM=your_sender_email

JWT_SECRET=your_jwt_secret
```

Use the actual variable names required by your local backend configuration.

### Frontend

If your frontend requires environment variables, create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:5000
```

Use the environment variable names expected by the existing frontend configuration.

**Do not use the example values above as real credentials.**

---

## Running the Project

### Backend

Open a terminal in:

```text
payrecover-ai/backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

The backend will run according to the port configured in your environment.

---

### Frontend

Open another terminal in:

```text
payrecover-ai/frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Then open the local URL displayed by Vite, typically:

```text
http://localhost:5173/
```

---

## Payment Recovery Workflow

The platform follows a structured recovery process:

```text
Payment Transaction
        ↓
Payment Failure
        ↓
Failure Analysis
        ↓
Recovery Engine
        ↓
AI Recovery Recommendation
        ↓
Priority Assignment
        ↓
Recovery Record
        ↓
Recovery Action
        ↓
Recovery Tracking
```

This workflow provides a foundation for systematically handling failed payment recovery.

---

## Screenshots

Screenshots of the actual PayRecover AI application can be added here to demonstrate the working interface.

Suggested screenshots:

1. Dashboard
2. Payment monitoring page
3. Recoveries page
4. Analytics dashboard
5. Recovery details
6. Settings / account interface

Example:

```text
screenshots/
├── dashboard.png
├── payments.png
├── recoveries.png
└── analytics.png
```

Only add screenshots of the actual working application.

---

## Future Improvements

Potential future enhancements include:

* ML-based recovery prediction
* More payment-provider integrations
* Automated retry scheduling
* Recovery performance prediction
* Advanced analytics
* More sophisticated failure classification
* Recovery success probability scoring
* Automated recovery strategy optimization

These are future improvements and are not represented as currently implemented features.

---

## Project Status

PayRecover AI is a working full-stack project demonstrating payment monitoring, payment failure analysis, recovery processing, recovery recommendations, recovery tracking, and analytics.


