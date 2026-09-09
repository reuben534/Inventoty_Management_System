# StockMaster Enterprise

## A Full-Stack Inventory and Warehouse Management System

> Built and presented by **[Your Name]**

## About Me

Hi, I am Reuben Kgobe, for now im a control room operator but willing to transition, Holding an Advance Diploma in applications development, interested in building practical software that improves everyday business operations.

I created StockMaster Enterprise to demonstrate how modern web technologies can be combined to manage inventory, procurement, warehouse operations, and user access from one reliable workspace.

## About the Application

StockMaster Enterprise is a full-stack inventory and warehouse management platform designed for organizations that need clear visibility into their products, stock levels, suppliers, purchase orders, and internal requests.

The application supports three user roles:

- **Administrators** manage users, approvals, financial purchase orders, and audit activity.
- **Managers** manage products, categories, stock adjustments, requests, and warehouse transfers.
- **Employees** browse the catalog, submit stock requests, and participate in receiving workflows.

The system is localized for South African business operations, including financial reporting in South African Rand (`ZAR`).

## The Problem I Solved

Many organizations rely on disconnected spreadsheets, messages, and manual processes to track stock. This makes it difficult to answer important questions:

- What stock is currently available?
- Which products need to be reordered?
- Who approved or changed a stock record?
- What purchase orders are still outstanding?
- Which requests are waiting for review?

StockMaster Enterprise brings these workflows together in one role-aware application with a shared audit trail and real-time operational dashboards.

## Key Features

### Role-Based Access Control

Each user sees the tools and actions relevant to their responsibilities. This keeps sensitive operations protected while making daily work easier to navigate.

### Product and Stock Management

- Product catalog with SKU, category, supplier, pricing, and stock information
- Minimum stock and reorder-level monitoring
- Stock adjustments with recorded reasons
- Product detail views for quick operational decisions

### Procurement Workflow

- Multi-item purchase order creation
- Tax and discount calculations
- Purchase order approval flow
- Receiving workflow with damage reporting
- Automatic stock increases when goods are received

### Internal Stock Requests

- Employees can submit departmental requests
- Managers can review and approve requests
- Self-approval prevention for conflict-of-interest control
- Atomic stock deductions when requests are fulfilled

### Warehouses and Stock Movements

- Warehouse transfers
- Stock in, stock out, returns, and adjustments
- Immutable movement history for traceability
- Supplier and warehouse management

### Dashboards and Reports

- Role-specific dashboards for administrators, managers, and employees
- Inventory valuation and safety-stock visibility
- Notifications for important operational events
- CSV report exports

## Technology Used

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion
- **Backend:** Node.js, Express, TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT-based sessions with BCrypt password hashing
- **Reporting:** CSV exports and PDF generation

## What This Project Demonstrates

This project demonstrates my ability to:

- Design a multi-role business application
- Build reusable React and TypeScript components
- Create REST API workflows with Express
- Model business data and relationships with MongoDB and Mongoose
- Apply authentication and role-based authorization
- Handle stock updates and operational audit history
- Build responsive dashboards and modal-driven workflows
- Connect frontend experiences to backend services

## Suggested Demo Walkthrough

When presenting the application, I recommend this sequence:

1. Start on the login screen and show the available role-based demo accounts.
2. Log in as an administrator and show the dashboard KPIs, user management, and audit activity.
3. Open the product catalog and demonstrate product details, stock levels, and reorder alerts.
4. Switch to a manager account and create or review a stock request.
5. Open purchase orders and demonstrate the receiving workflow.
6. Show the stock movement history to explain how actions remain traceable.
7. Finish with reports and explain how the system supports operational decision-making.

## Project Highlights

- Full-stack MERN application
- Responsive business-focused interface
- Role-aware navigation and permissions
- Realistic seeded demo data
- Inventory valuation and stock alerts
- Procurement and receiving workflows
- Audit-friendly stock movement ledger
- South African Rand financial localization

## Running the Project

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

The application includes seeded demo accounts. The default demo password is `Password123!`.

## Closing Statement

StockMaster Enterprise reflects my interest in building software that is both technically solid and useful in real working environments. The project combines a structured backend, a responsive frontend, secure role-based workflows, and business rules that reflect how inventory operations work in practice.

**Thank you for taking the time to explore my application.**

---

### Personal Details to Replace

Before sharing this file, update:

- `[Your Name]`
- `[your role, for example: Full-Stack Developer]`
- The closing statement with your preferred contact details or portfolio link
