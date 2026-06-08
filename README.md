# Ecommerce NodeJS

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-5.1.0-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-yellow.svg)](LICENSE)

A comprehensive RESTful API backend for e-commerce platforms built with Node.js, Express, and MongoDB.

## Description

Backend API system for e-commerce applications featuring product management, shopping cart, checkout processing, discount codes, user authentication, and role-based access control. Supports multiple storage options including AWS S3 and Cloudinary for media files.

## Key Features

### Authentication & Security
- JWT-based authentication with refresh tokens
- API Key validation
- Role-Based Access Control (RBAC)
- bcrypt password hashing
- Secure headers with Helmet

### Product Management
- CRUD operations for products
- Product publishing/unpublishing
- Product type categorization
- Search and filtering

### Shopping & Checkout
- Shopping cart management
- Checkout processing
- Inventory management
- Discount code system

### Additional Features
- Comment/review system
- Notification system with message queue integration
- File upload (Multer, S3, Cloudinary)
- Comprehensive logging with Winston
- Email notifications via Nodemailer

## Installation

```bash
# Navigate to project directory
cd server-backend-ecommerce

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and fill local values
```

## Usage

```bash
# Start the server
npm start

# The server will run on http://localhost:5500
```

## API Documentation

Swagger UI is available after starting the backend:

```txt
http://localhost:5500/docs
```

The raw OpenAPI document is available at:

```txt
http://localhost:5500/docs/openapi.json
```

Authorization in Swagger:
- Public APIs: set `x-api-key`.
- Customer protected APIs: set `x-api-key`, `Authorization: Bearer <accessToken>`, `x-client-id`, and `x-auth-kind: user`.
- Admin protected APIs: set `x-api-key`, `Authorization: Bearer <accessToken>`, `x-client-id`, and `x-auth-kind: admin`.

### API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/v1/api/product` | Product management |
| `/v1/api/cart` | Shopping cart |
| `/v1/api/checkout` | Checkout processing |
| `/v1/api/discount` | Discount codes |
| `/v1/api/inventory` | Inventory control |
| `/v1/api/comment` | Product reviews |
| `/v1/api/notification` | Notifications |
| `/v1/api/upload` | File uploads |
| `/v1/api/access` | Authentication |
| `/v1/api/profile` | User profiles |
| `/v1/api/rbac` | Role management |

## Directory Structure

```
server-backend-ecommerce/
├── src/
│   ├── auth/                    # Authentication utilities
│   │   ├── authUtils.js
│   │   └── checkAuthen.js
│   ├── config/                  # Configuration files
│   │   ├── cloudinary.config.js
│   │   ├── config.mongodb.js
│   │   ├── multer.config.js
│   │   └── s3.config.js
│   ├── controller/              # Request handlers
│   │   ├── access.controller.js
│   │   ├── cart.controller.js
│   │   ├── checkout.controller.js
│   │   ├── comment.controller.js
│   │   ├── discount.controller.js
│   │   ├── inventory.controller.js
│   │   ├── notification.controller.js
│   │   ├── product.controller.js
│   │   ├── profile.controller.js
│   │   ├── rbac.controller.js
│   │   ├── upload.controller.js
│   │   └── user.controller.js
│   ├── core/                    # Core utilities
│   │   ├── error.response.js
│   │   └── success.response.js
│   ├── dbs/                     # Database initialization
│   │   ├── init.mongodb.js
│   │   ├── init.redis.js
│   │   └── init.nodemailer.js
│   ├── helpers/                 # Helper functions
│   │   ├── asyncHandler.js
│   │   └── check.connect.js
│   ├── loggers/                 # Logging configuration
│   │   └── myLogger.log.js
│   ├── middlewares/             # Express middlewares
│   │   ├── rbac.middleware.js
│   │   └── role.middleware.js
│   ├── model/                   # Mongoose models
│   │   ├── apiKey.model.js
│   │   ├── cart.model.js
│   │   ├── comment.model.js
│   │   ├── discount.model.js
│   │   ├── inventory.model.js
│   │   ├── keytoken.model.js
│   │   ├── notification.model.js
│   │   ├── order.model.js
│   │   ├── otp.model.js
│   │   ├── product.model.js
│   │   ├── resource.model.js
│   │   ├── role.model.js
│   │   ├── shop.model.js
│   │   ├── template.model.js
│   │   ├── user.model.js
│   │   └── repositories/        # Data access layer
│   ├── routes/                  # API routes
│   └── services/                # Business logic
├── docs/                        # Documentation
├── .env.example                 # Environment variable template
├── .gitignore
├── package.json
├── package-lock.json
├── server.js                    # Entry point
└── README.md
```

## License
MIT © Bao Bui
