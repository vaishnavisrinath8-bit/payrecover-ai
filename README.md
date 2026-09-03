# PayRecover AI

### Intelligent Payment Recovery & Revenue Protection Platform

PayRecover AI is an AI-powered payment recovery platform designed to help businesses identify failed payments, understand why payments fail, prioritize revenue at risk, and execute intelligent recovery workflows.

The platform provides a centralized SaaS-style dashboard for monitoring payment failures, managing recovery actions, tracking recovered revenue, and analyzing recovery performance.

Built for **Razorpay Buildathon — Track 03: AI Revenue Recovery**.

---

## 🚀 Project Overview

Failed payments can result in significant revenue leakage for businesses.

PayRecover AI addresses this problem by creating an intelligent recovery workflow:

```text
Payment Failure
      ↓
Failure Analysis
      ↓
Revenue Risk Assessment
      ↓
Recovery Recommendation
      ↓
Recovery Workflow
      ↓
Customer Communication
      ↓
Retry / Recovery
      ↓
Recovery Tracking
      ↓
Analytics & Audit Trail
```

Instead of treating every failed payment the same way, PayRecover AI uses payment information, failure reasons, recovery history, priority, and configurable recovery rules to determine an appropriate recovery action.

---

## 🎯 Problem Statement

Payment failures are a major source of avoidable revenue loss.

A typical payment failure can require businesses to:

* Identify the failed transaction
* Understand the failure reason
* Determine whether the payment is recoverable
* Prioritize high-value recovery opportunities
* Contact the customer
* Retry the payment
* Track the recovery process
* Measure recovered revenue

Managing these processes manually becomes difficult as transaction volume increases.

PayRecover AI provides a centralized system for automating and monitoring this workflow.

---

## 💡 Solution

PayRecover AI combines payment monitoring, recovery intelligence, automated communication, and analytics into a single platform.

The platform can:

* Detect failed payments
* Analyze payment failure information
* Assign recovery priority
* Generate recovery recommendations
* Create recovery workflows
* Generate customer-facing recovery messages
* Send recovery communication through email
* Track recovery attempts
* Record successful recoveries
* Mark unrecoverable cases
* Maintain recovery history and audit information
* Provide recovery analytics

---

# ✨ Key Features

## 📊 Revenue Recovery Dashboard

The dashboard provides an overview of the payment and recovery ecosystem.

It includes information such as:

* Total payments
* Payment performance
* Failed payments
* Recovery activity
* Recovery queue
* Recent payment activity
* Revenue-related metrics

The dashboard is connected to the backend API and displays live application data.

---

## 💳 Payment Management

The Payments section provides a centralized view of transactions.

Payment information includes:

* Customer name
* Customer email
* Payment amount
* Currency
* Payment status
* Payment method
* Failure reason
* Failure code
* Retry count
* Recovery status
* Recovery priority
* AI recommendation
* Creation/update timestamps

Payments can be inspected individually to understand their recovery context.

---

## 🔄 Intelligent Recovery Workflow

PayRecover AI converts failed payments into actionable recovery cases.

A recovery can move through stages such as:

```text
Created
   ↓
Pending
   ↓
Email Sent
   ↓
Recovered
```

Cases can also become:

```text
Failed / Unrecoverable / Stopped
```

The recovery system maintains information about attempts, recommended actions, recovery status, and timing.

---

## 🤖 AI-Powered Recovery Intelligence

The platform contains an AI recovery layer designed to help determine the appropriate recovery strategy.

The system considers information such as:

* Payment failure reason
* Failure code
* Payment value
* Previous recovery attempts
* Recovery priority
* Customer information
* Recovery history
* Compliance rules

Based on this information, the platform can generate:

* Recovery recommendations
* Recovery priority
* Recovery probability
* Customer recovery messages
* Suggested recovery actions

The objective is to move from simple payment-failure detection toward **intelligent revenue recovery decisions**.

---

## 📧 Automated Customer Communication

PayRecover AI integrates customer communication into the recovery workflow.

Recovery messages can be generated based on the payment and recovery context and sent through the configured email service.

This enables a workflow such as:

```text
Failed Payment
      ↓
Failure Analysis
      ↓
Recovery Decision
      ↓
Message Generation
      ↓
Email Communication
      ↓
Customer Payment Retry
```

---

## 📈 Recovery Analytics

The platform provides recovery analytics to help understand recovery performance.

Analytics can be used to evaluate:

* Recovery volume
* Recovery outcomes
* Recovered revenue
* Recovery attempts
* Recovery performance
* Recovery trends

This allows businesses to measure the financial impact of their recovery strategy rather than only monitoring failed transactions.

---

## ⚙️ Recovery Rules & Compliance

The recovery workflow includes bounded recovery logic and compliance-oriented controls.

The system can track concepts such as:

* Maximum recovery attempts
* Next permitted action
* Recovery expiry
* Contact permission
* Recovery stopping conditions
* Escalation level
* Audit events

This helps prevent uncontrolled retry or communication behavior.

---

## 📝 Audit Trail

Recovery activity can be recorded through audit information associated with recovery cases.

This provides visibility into:

* Recovery actions
* Recovery status changes
* Attempts
* Communication activity
* System decisions
* Recovery outcomes

An audit trail improves transparency and makes the recovery workflow easier to investigate.

---

# 🖥️ Application Sections

The frontend is structured as a SaaS-style dashboard with dedicated application areas.

### Dashboard

Provides an overview of payment and recovery performance.

### Payments

Provides transaction-level payment information and failure details.

### Recoveries

Provides recovery cases, recovery status, recommended actions, and recovery workflow management.

### Analytics

Provides recovery and revenue performance insights.

### Notifications

Provides a centralized area for application notifications.

### Account

Provides account-related information.

### Settings

Provides application configuration and preferences.

---

# 🏗️ System Architecture

```text
                     ┌───────────────────────┐
                     │       Customer        │
                     │    Failed Payment     │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   PayRecover AI       │
                     │   Recovery Engine     │
                     └───────────┬───────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
              Failure       AI Recovery    Compliance
              Analysis      Intelligence    Rules
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │   Recovery Workflow   │
                     └───────────┬───────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
             Retry          Email Recovery    Stop /
             Payment         Communication    Unrecoverable
                │                │                │
                └────────────────┼────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ Recovery Analytics    │
                     │ & Audit Trail         │
                     └───────────────────────┘
```

---

# 🧩 Technology Stack

## Frontend

* React
* Vite
* React Router
* Axios
* Lucide React
* Recharts
* Modern responsive CSS

## Backend

* Node.js
* Express.js
* REST APIs

## Database

* MongoDB Atlas
* Mongoose

## Payments

* Razorpay

## Communication

* Gmail SMTP

## Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB Atlas — Database

---

# 📁 Project Structure

```text
payrecover-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── public/
│   ├── package.json
│   └── vercel.json
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── controllers/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🔌 Backend API Structure

The backend exposes REST APIs for the frontend.

### Payments

```text
GET  /api/payments
GET  /api/payments/stats
GET  /api/payments/recent
GET  /api/payments/status/:paymentId
POST /api/payments/create-order
POST /api/payments/verify
```

### Recovery

```text
GET  /api/recovery
GET  /api/recovery/:id
GET  /api/recovery/queue
GET  /api/recovery/analytics

POST /api/recovery/create
POST /api/recovery/send

POST /api/recovery/:id/recovered
POST /api/recovery/:id/unrecoverable
```

### Health

```text
GET /api/health
GET /api/db-status
```

---

# 🗃️ Core Data Models

## Payment

Payment records contain information including:

```text
razorpayPaymentId
razorpayOrderId
amount
currency
customerName
customerEmail
customerPhone
paymentStatus
failureReason
failureCode
paymentMethod
retryCount
recoveryStatus
recoveryPriority
aiRecommendation
createdAt
updatedAt
```

## Recovery

Recovery records contain information including:

```text
paymentId
customerEmail
customerName
reason
status
recoveryMessage
paymentLink
attempts
lastAttemptAt
amount
currency
recoveryType
aiScore
recoveryProbability
recommendedAction
priority
currentStep
maxAttempts
attemptCount
nextActionAt
lastActionAt
recoveredAmount
recoveredAt
recoveryChannel
promiseToPay
stoppingReason
escalationLevel
contactAllowed
messageLanguage
generatedMessage
campaignId
metadata
auditTrail
```

---

# 🔐 Environment Variables

Create environment files locally and **never commit real credentials**.

## Frontend

```env
VITE_API_URL=http://localhost:3001/api
```

For production:

```env
VITE_API_URL=https://payrecover-ai-backend.onrender.com/api
```

## Backend

The backend requires environment variables for configuration, including the MongoDB connection and external service credentials.

Example:

```env
PORT=3001
MONGO_URI=your_mongodb_connection_string
```

Additional payment and email configuration should be supplied through environment variables.

**Never commit API keys, passwords, SMTP credentials, database credentials, or other secrets to GitHub.**

---

# ▶️ Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/vaishnavisrinath8-bit/payrecover-ai.git
cd payrecover-ai
```

---

## 2. Install backend dependencies

```bash
cd backend
npm install
```

Configure the backend environment variables and start the server:

```bash
npm start
```

The backend runs on:

```text
http://localhost:3001
```

---

## 3. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Configure:

```env
VITE_API_URL=http://localhost:3001/api
```

Start the frontend:

```bash
npm run dev
```

The frontend will be available through the Vite development server.

---

# 🌐 Production Deployment

The current architecture uses:

```text
Vercel
   │
   │ HTTPS API requests
   ▼
Render
   │
   │ Mongoose
   ▼
MongoDB Atlas
```

### Frontend

Deployed using Vercel.

### Backend

Deployed using Render.

### Database

Hosted using MongoDB Atlas.

---

# 🔗 Live Demo

### Frontend

https://payrecover-ai-black.vercel.app

### Backend

https://payrecover-ai-backend.onrender.com

The frontend communicates with the production backend through the configured API URL.

---

# 🏆 Razorpay Buildathon Alignment

PayRecover AI is designed around the **AI Revenue Recovery** problem.

The project addresses the key stages of revenue recovery:

| Revenue Recovery Requirement      | PayRecover AI                 |
| --------------------------------- | ----------------------------- |
| Detect revenue at risk            | Failed payment monitoring     |
| Diagnose payment failures         | Failure reason/code analysis  |
| Prioritize recovery opportunities | Recovery priority             |
| Determine intervention            | AI recovery recommendation    |
| Execute recovery workflow         | Recovery creation and actions |
| Communicate with customers        | Recovery email workflow       |
| Track recovery                    | Recovery status and attempts  |
| Measure recovered money           | Recovery analytics            |
| Apply bounded workflows           | Compliance and recovery rules |
| Maintain transparency             | Audit trail                   |

---

# 🔄 Example Recovery Scenario

Consider a customer whose payment fails.

### Step 1 — Payment Failure

The payment is recorded with its failure reason and payment information.

### Step 2 — Risk Evaluation

The recovery engine evaluates the payment and determines whether recovery should be attempted.

### Step 3 — Recovery Recommendation

The system generates an appropriate recovery recommendation and priority.

### Step 4 — Recovery Case

A recovery record is created and linked to the payment.

### Step 5 — Customer Communication

A recovery message can be generated and sent through the configured email workflow.

### Step 6 — Recovery Attempt

The customer can retry the payment.

### Step 7 — Outcome

The recovery can ultimately be marked as:

```text
Recovered
```

or

```text
Unrecoverable / Stopped
```

### Step 8 — Measurement

The recovery outcome contributes to recovery analytics and revenue measurement.

---

# 🧠 Why PayRecover AI?

Traditional payment dashboards primarily answer:

> "Which payments failed?"

PayRecover AI aims to answer a more valuable set of questions:

> "Why did it fail?"

> "Is it worth recovering?"

> "What should we do next?"

> "How should we communicate with the customer?"

> "Did we recover the revenue?"

This transforms payment failure monitoring into an **action-oriented revenue recovery system**.

---

# 🔮 Future Enhancements

Potential future improvements include:

* More advanced ML-based recovery probability prediction
* Customer-level behavioral models
* Multi-channel recovery communication
* WhatsApp/SMS recovery workflows
* Intelligent payment-method recommendations
* Adaptive retry scheduling
* Automated recovery campaigns
* A/B testing of recovery messages
* More advanced revenue forecasting
* Role-based access control
* Multi-tenant SaaS architecture
* Advanced fraud/risk signals
* Real-time event processing
* Production-grade observability and monitoring

---

# 👨‍💻 Project Purpose

PayRecover AI was developed as a practical demonstration of how AI, payment infrastructure, backend services, databases, and modern frontend technologies can be combined to solve a real-world revenue problem.

The project focuses on moving beyond payment-status monitoring toward:

**Detection → Diagnosis → Decision → Action → Recovery → Measurement**

---

# 📌 Project Status

**Status: Production Demo Ready**

Current deployment:

```text
Frontend  → Vercel
Backend   → Render
Database  → MongoDB Atlas
Payments  → Razorpay
Email     → Gmail SMTP
```

---

## Built with React, Node.js, MongoDB, Razorpay and AI-powered recovery logic.

**PayRecover AI — Turning failed payments into recoverable revenue.**
