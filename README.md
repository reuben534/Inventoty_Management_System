# StockMaster Enterprise - MERN Stack Inventory & Warehouse Management System

A production-ready, full-stack **MERN** (**M**ongoDB, **E**xpress, **R**eact, **N**ode.js) inventory, warehouse, and supply chain management system featuring strict Role-Based Access Control (Admin, Manager, Employee), requisition workflows, procurement tracking, and live audit logging.

---

## 🚀 Tech Stack

- **Database**: MongoDB (via Mongoose schemas with indexed models & population)
- **Backend**: Node.js & Express 4, JWT session authentication, BCrypt password hashing
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion
- **Localization**: South African Rand (`ZAR` / `R`) financial reporting

---

## 📦 Key Features

- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system control, financial PO approvals, user management, and compliance audit trail.
  - **Manager**: Catalog management, manual stock cycle adjustments, requisition reviews, and warehouse transfers.
  - **Employee**: Catalog exploration, requisition creation, and order receiving dock workflows.
- **Product & Stock Management**:
  - Minimum stock, maximum capacity, and automated reorder level alerts.
  - Multi-category classification and supplier mappings.
- **Internal Requisitions**:
  - Departmental stock requests with conflict-of-interest checks (self-approval prevention).
  - Atomic inventory deductions and ledger logging on fulfillment.
- **Procurement & Purchase Orders**:
  - Multi-item purchase orders with tax and discount calculation.
  - Inbound receiving dock workflow with damage reporting and automatic stock increment.
- **Stock Movements & Transfers**:
  - Complete immutable audit ledger for Stock In, Stock Out, Adjustments, Transfers, and Returns.
- **Interactive Dashboards**:
  - Tailored KPI dashboards for Admin, Manager, and Employee roles.
  - 1-Click Demo Account switcher for instant login without manual password entry.
- **Reports & Valuation**:
  - Real-time gross inventory valuation, safety stock alerts, and CSV exports.

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** (v18+ or v20+ recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Review `.env` (a ready-to-use template is available in `.env.example`):
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb://127.0.0.1:27017/inventory_management
   JWT_SECRET=inventory-mgmt-mern-secret-jwt-key-2026
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Accounts

The application automatically seeds an initial dataset on first run with the following accounts (Password: `Password123!`):

| Role | Name | Email | Department |
|---|---|---|---|
| **Admin** | Sarah Jenkins | `admin@inventory.com` | Executive Management |
| **Manager** | Marcus Vance | `manager@inventory.com` | Warehouse Operations |
| **Manager** | Elena Rostova | `elena.manager@inventory.com` | Supply Chain & Procurement |
| **Employee** | David Chen | `employee1@inventory.com` | Inbound Logistics |
| **Employee** | Amara Okafor | `employee2@inventory.com` | Assembly & Packaging |
| **Employee** | Liam Gallagher | `employee3@inventory.com` | Quality Control |

*(Quick 1-Click login buttons are available directly on the login screen).*

---

## 📜 Available Scripts

- `npm run dev` - Starts the development server with Express and Vite middleware.
- `npm run build` - Builds production frontend and bundles backend.
- `npm start` - Starts the production server from `dist/server.cjs`.
- `npm run lint` - Type-checks the entire TypeScript codebase (`tsc --noEmit`).
