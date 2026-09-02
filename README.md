# PayRecover AI

**AI-Powered Payment Recovery & Revenue Recovery Platform**

PayRecover AI is a full-stack intelligent payment recovery platform designed to help businesses identify failed payments, understand why revenue is at risk, prioritize recovery opportunities, and execute compliant recovery actions.

The platform provides a centralized SaaS-style dashboard for monitoring payments, managing recovery operations, analyzing recovery performance, generating recovery communications, and tracking recovered revenue.

Built for **Razorpay Buildathon — Track 03: AI Revenue Recovery**.

---

## Problem Statement

Failed payments can create significant revenue leakage for businesses. Manually identifying failed transactions, understanding failure reasons, deciding which customers to contact, and tracking recovery attempts can be time-consuming and inconsistent.

Businesses need a system that can:

* Detect revenue at risk
* Analyze payment failures
* Prioritize recovery opportunities
* Recommend appropriate recovery actions
* Generate customer communication
* Apply compliance and safety rules
* Track recovery attempts
* Measure recovered revenue
* Maintain an audit trail

PayRecover AI addresses these challenges through an intelligent, structured recovery workflow.

---

## Solution

PayRecover AI transforms failed payment events into actionable recovery opportunities.

```text
Failed Payment
      ↓
AI Failure Diagnosis
      ↓
Risk & Priority Scoring
      ↓
Recovery Decision
      ↓
Compliance & Safety Check
      ↓
Message Generation
      ↓
Recovery Action
      ↓
Recovery Outcome
      ↓
Recovered Revenue
      ↓
Analytics & Audit Trail
```

The platform combines payment monitoring, recovery intelligence, customer communication, compliance controls, and analytics into one recovery command center.

---

## Core Recovery Workflow

```text
DETECT
Identify failed payments and revenue at risk
        ↓
DIAGNOSE
Understand the payment failure reason
        ↓
DECIDE
Determine the most suitable recovery strategy
        ↓
PROTECT
Apply compliance, contact, attempt, and approval rules
        ↓
ENGAGE
Generate a contextual recovery message
        ↓
EXECUTE
Perform an allowed recovery action
        ↓
MEASURE
Track recovery status and recovered revenue
        ↓
AUDIT
Record recovery activity and decisions
```

---

## Key Features

### Payment Intelligence

* Real-time payment monitoring
* Payment status tracking
* Failed payment detection
* Failure reason classification
* Payment method analysis
* Retry count tracking
* Customer and transaction details
* Payment search and filtering
* Payment details view
* Paginated payment management

### AI Recovery Intelligence

* AI-assisted failure diagnosis
* Recovery opportunity identification
* Recovery priority scoring
* Recovery probability
* Recommended recovery action
* Failure-specific recovery reasoning
* Signal-based decision making
* Recovery candidate scanning
* AI recovery decision center

### Recovery Command Center

* Recovery queue
* Active recovery tracking
* Recovery status management
* Recovery priority management
* Recovery attempts
* Recovery actions
* Mark recovered workflow
* Mark unrecoverable workflow
* Recovery outcome tracking

### AI Recovery Message Center

Generate contextual recovery communication for customers using:

* Email
* SMS
* Payment retry

Supported message styles include:

* English
* Hindi
* Hinglish

The message workflow includes:

* AI-assisted message generation
* Regenerate message
* Copy message
* Compliance checks
* Message quality checks
* Recovery context

### Compliance & Safety

PayRecover AI includes bounded recovery controls designed to prevent uncontrolled customer outreach.

Controls include:

* Contact permission
* Maximum recovery attempts
* Recovery expiry
* Approval requirements
* Automated recovery controls
* Allowed communication channels
* Recovery stopping conditions
* Escalation controls
* Audit logging

### AI Recovery Agent

The platform includes an end-to-end AI-assisted recovery orchestration flow:

```text
Scan Candidates
      ↓
Diagnose Failure
      ↓
Calculate Recovery Priority
      ↓
Select Recommended Action
      ↓
Check Compliance
      ↓
Generate Recovery Message
      ↓
Execute Permitted Action
      ↓
Track Outcome
      ↓
Record Audit Event
```

The recovery agent respects configured safety settings and approval requirements before executing state-changing actions.

### Analytics

The analytics dashboard provides visibility into:

* Total recovery opportunities
* Total revenue at risk
* Recovered revenue
* Active recovery value
* Unrecoverable value
* Recovery rate
* Recovery status breakdown
* Priority breakdown
* Recovery channel breakdown
* Failure reason breakdown

### Notifications

The application provides a notification center based on payment and recovery activity, including recovery-related events and important operational signals.

### Account Management

The account section supports management of:

* Personal information
* Business information
* Contact details
* Account preferences

### Settings

Configurable recovery settings include:

* Automated recovery
* Maximum recovery attempts
* Recovery channels
* Message language
* Notifications
* Compliance controls
* Approval requirements
* Recovery preferences

---

## Technology Stack

### Frontend

* React
* Vite
* React Router
* Axios
* Lucide React
* Recharts
* CSS

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* REST APIs

### Payments

* Razorpay integration

### Communication

* Gmail SMTP
* Nodemailer
* Recovery email workflow

### Intelligence

* AI-assisted recovery engine
* Failure analysis
* Recovery prioritization
* Recovery recommendations
* Recovery probability
* Compliance-aware recovery decisions

---

## System Architecture

```text
                         ┌─────────────────────────┐
                         │      PayRecover AI       │
                         │     React Frontend       │
                         └────────────┬────────────┘
                                      │
                                  REST API
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │     Node.js / Express    │
                         │      Backend API         │
                         └────────────┬────────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 │                    │                    │
                 ▼                    ▼                    ▼
        ┌────────────────┐   ┌─────────────────┐   ┌────────────────┐
        │    MongoDB     │   │ Recovery Engine │   │ Razorpay       │
        │                │   │                 │   │ Integration    │
        │ Payments       │   │ Failure Analysis│   │                │
        │ Recoveries     │   │ Risk Scoring    │   │ Payments       │
        │ Audit Data     │   │ Recovery Rules  │   │ Orders         │
        └────────────────┘   └────────┬────────┘   └────────────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ AI Recovery Services│
                           │                     │
                           │ Recommendations     │
                           │ Message Generation  │
                           │ Recovery Decisions  │
                           └──────────┬──────────┘
                                      │
                                      ▼
                           ┌─────────────────────┐
                           │ Communication Layer │
                           │                     │
                           │ Email / Recovery    │
                           │ Actions / Tracking  │
                           └─────────────────────┘
```

---

## Application Pages

The PayRecover AI frontend contains the following major application areas:

```text
Dashboard
│
├── Payments
│   └── Payment Details
│
├── Recoveries
│   ├── Recovery Queue
│   ├── Recovery Decision Center
│   ├── Recovery Message Center
│   └── Recovery Operations
│
├── Analytics
│
├── Notifications
│
├── Account
│
└── Settings
```

Additional recovery and checkout interfaces are included as part of the project architecture.

---

## Project Structure

```text
payrecover-ai/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── Styles/
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
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── services/
│   ├── utils/
│   ├── SeedDemoData.js
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Backend API

The application currently uses the following core API routes.

### Health

```text
GET /api/health
```

### Payments

```text
GET  /api/payments
GET  /api/payments/stats
GET  /api/payments/recent
GET  /api/payments/:id
POST /api/payments/create-order
POST /api/payments/verify
```

### Recovery

```text
GET  /api/recovery
GET  /api/recovery/queue
GET  /api/recovery/analytics
GET  /api/recovery/:id

POST /api/recovery/create
POST /api/recovery/send
POST /api/recovery/:id/recovered
POST /api/recovery/:id/unrecoverable
```

The frontend is designed to use the existing backend routes rather than relying on fictional API endpoints.

---

## Database

PayRecover AI uses MongoDB with Mongoose for persistence.

Core data includes:

* Payments
* Recoveries
* Users
* Settings
* Notifications
* Recovery rules
* Recovery audit events
* Revenue events
* Revenue opportunities
* Checkout sessions

Recovery records maintain operational information such as:

* Recovery status
* Priority
* AI score
* Recovery probability
* Recommended action
* Attempt count
* Maximum attempts
* Recovery channel
* Customer communication
* Recovered amount
* Recovery timestamps
* Stopping reason
* Audit information

---

## Environment Variables

Sensitive configuration must be stored in environment variables.

**Never commit real credentials, API keys, passwords, or secrets to GitHub.**

### Backend

Create:

```text
backend/.env
```

Example:

```env
PORT=3001

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

Use the exact variable names expected by the backend configuration.

### Frontend

If required, create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:3001/api
```

The frontend also defaults to the local backend API when the environment variable is not provided.

---

## Installation

### Prerequisites

Install:

* Node.js
* npm
* Git
* MongoDB Atlas account or MongoDB
* Razorpay account for payment integration

### Clone the repository

```bash
git clone https://github.com/vaishnavisrinath8-bit/payrecover-ai.git
```

```bash
cd payrecover-ai
```

---

## Run the Backend

Open a terminal:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Start the backend:

```bash
npm start
```

The backend runs on:

```text
http://localhost:3001
```

---

## Run the Frontend

Open a second terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Demo Data

The project includes a demo-data seeding system for development and presentation.

The seeded dataset contains realistic payment and recovery scenarios including:

* Successful payments
* Failed payments
* Card declines
* Bank declines
* Authentication failures
* Insufficient funds
* Network failures
* Timeouts
* Expired cards
* Invalid payment details
* Different payment methods
* Recovery opportunities
* Recovery priorities
* Recovery statuses

This allows the dashboard and analytics views to demonstrate the complete recovery lifecycle without requiring production payment traffic.

---

## Security & Safety Principles

PayRecover AI is designed around bounded recovery automation.

The system should not blindly contact customers or repeatedly attempt recovery actions.

Recovery decisions are constrained by:

```text
Recovery Eligibility
        ↓
Contact Permission
        ↓
Attempt Limits
        ↓
Expiry Rules
        ↓
Approval Requirements
        ↓
Allowed Action
        ↓
Audit Event
```

This approach makes the recovery workflow more suitable for real-world business operations.

---

## Buildathon Alignment

PayRecover AI is designed for the **AI Revenue Recovery** problem space.

The platform demonstrates:

| Requirement                       | PayRecover AI |
| --------------------------------- | ------------- |
| Detect revenue at risk            | ✓             |
| Diagnose payment failure          | ✓             |
| Prioritize recovery opportunities | ✓             |
| Recommend recovery action         | ✓             |
| Apply safety/compliance controls  | ✓             |
| Generate recovery communication   | ✓             |
| Execute recovery workflow         | ✓             |
| Track recovery outcome            | ✓             |
| Measure recovered revenue         | ✓             |
| Recovery analytics                | ✓             |
| Recovery operations               | ✓             |
| Audit trail                       | ✓             |

---

## Screenshots

Screenshots of the actual application can be added here.

Recommended screenshots:

```text
screenshots/
├── dashboard.png
├── payments.png
├── payment-details.png
├── recoveries.png
├── recovery-decision-center.png
├── recovery-message-center.png
├── analytics.png
├── notifications.png
├── account.png
└── settings.png
```

Only screenshots from the actual working application should be included.

---

## Project Status

PayRecover AI is a working full-stack application demonstrating an intelligent payment recovery workflow.

The current implementation includes:

* Payment monitoring
* Failed payment analysis
* Recovery prioritization
* AI-assisted recovery recommendations
* Recovery command center
* Recovery queue
* Recovery message generation
* Compliance and safety controls
* Recovery workflow orchestration
* Recovery actions
* Recovery outcome tracking
* Recovered revenue measurement
* Analytics
* Notifications
* Account management
* Settings and preferences
* Audit-oriented recovery tracking
* Razorpay integration
* MongoDB persistence
* Email recovery workflow

The project is intended as an **internship portfolio and Razorpay Buildathon demonstration project**.

---

## Future Enhancements

Potential future improvements include:

* Production-grade ML recovery prediction
* Advanced customer-level behavioral models
* Additional payment providers
* More sophisticated recovery strategy optimization
* Automated retry scheduling
* Advanced revenue forecasting
* Multi-tenant SaaS architecture
* Role-based access control
* Real-time event processing
* Advanced experimentation and A/B testing
* Production-grade observability
* More communication channels

These are future enhancements and are not represented as currently implemented functionality.

---

## Author

**PayRecover AI**

Built as a full-stack AI-powered payment recovery platform for internship and buildathon demonstration.
