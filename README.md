# EnxtAI_Assignment_Sub
 Assignment Repo for EnxtAI by Subhanshu

 ## 1. Overview

The backend service for MiniApp_EnxtAI provides APIs for:

• Product listing

• User transactions

• Portfolio tracking

The architecture emphasizes scalability and maintainability through:

Modular routers (productrouter.js, txnrouter.js, portfoliorouter.js, etc.) to enforce separation of concerns.

Authentication middleware (jwthandler.js) that validates JWTs and attaches the user identity to each request.

Prisma ORM with PostgreSQL for structured and type-safe data access.

Redis caching to optimize performance of frequently accessed and aggregation-heavy endpoints.

During testing, aggregation queries were identified as a potential source of database load. This was addressed by introducing a Redis caching layer, which reduced direct pressure on PostgreSQL and improved overall response times.

In production, the service runs on Render, with PostgreSQL and Redis provisioned as independent managed services under the MiniApp_EnxtAI project cluster.

## 2. Project Structure

The codebase is organized to promote modularity, maintainability, and clear separation of concerns:

• server.js – The entry point of the application. All routers are mounted here, establishing the API endpoints.

• routers/ – Contains feature-specific routers:

• productrouter.js – Handles product listing endpoints

• txnrouter.js – Handles transaction-related endpoints

• portfoliorouter.js – Handles portfolio management endpoints

• userrouter.js – Handles user-related endpoints

### middleware

• jwthandler.js – Validates JWTs, extracts the user identity, and attaches it to requests for secure access

• prisma/ – Prisma schema and migration files for PostgreSQL

• prismaclient.js – Exposes a reusable Prisma client instance to all modules

• seed.js – Seeds the database with hypothetical data for testing or development

• redisclient.js – Provides a Redis client instance used for caching frequently accessed or aggregation-heavy data

This structure ensures each concern is isolated, promotes reuse, and simplifies testing and future expansion.

## 3. Authentication

The backend enforces secure access to protected endpoints through JWT-based authentication.

jwthandler.js acts as the authentication middleware for the application.

Incoming requests to protected routes must include a valid JWT in the request headers.

The middleware verifies the token using the configured secret.

Upon successful verification, the userId extracted from the token is attached to the request object (req.userId), enabling downstream route handlers to identify and authorize the user.

Requests with missing, invalid, or expired tokens are rejected with a 401 Unauthorized response, ensuring that sensitive endpoints are protected.

This approach centralizes authentication logic, reduces redundancy, and enforces consistent security across all protected routes.

## 4. Setup Instructions

The backend can be run locally to facilitate testing, development, or evaluation. The following steps outline the environment setup and execution process:

```1. Clone the Repository
git clone <repository-url>
cd <repository-folder>

2. Install Dependencies
npm install

3. Configure Environment Variables

Create a .env file in the project root with the following variables:

PORT=8000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/<dbname>?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="<secure-secret>"

4. Start Services Locally

PostgreSQL (via Docker):

docker run --name postgres-miniapp \
  -e POSTGRES_USER=<user> \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_DB=<dbname> \
  -p 5432:5432 \
  -d postgres:15


Redis (via Docker):

docker run --name redis-miniapp -p 6379:6379 -d redis:7

5. Apply Prisma Migrations
npx prisma migrate dev --name init
npx prisma generate


Optionally, seed the database with sample data:

node prisma/seed.js

6. Start the Backend Server

Development Mode (with auto-reloading):

npm run dev


Production Mode:

npm start

7. Start the Backend Server (Optional but helpful)

Development Mode (with auto-reloading using nodemon):

npm run dev


This command starts the server with nodemon, which automatically reloads the backend whenever changes are made to the source files, facilitating efficient development.

Production Mode:

npm start


The backend will be accessible at: http://localhost:8000
```
## 5. Deployment (Render)

The backend is deployed on Render, providing a fully managed production environment. The deployment encompasses:

Backend service – Node.js/Express server running all API routes

PostgreSQL – managed database service, supporting Prisma ORM operations

Redis – managed caching service, optimizing performance for frequently accessed and aggregation-heavy endpoints

All services are hosted under a single Render project, MiniApp_EnxtAI, ensuring seamless connectivity between the backend, database, and caching layers. This centralized deployment simplifies management, scaling, and monitoring while maintaining high availability.

## 6. API Documentation

The backend exposes the following API endpoints under the base path: /api/v1. All endpoints are secured with JWT authentication, except for user signup/login and product listing.

1. Users

Endpoint: /api/v1/users
Methods: POST
Purpose: User signup and login
Authentication: Not required

Request Example (Signup/Login):
```
{
  "username": "exampleuser",
  "password": "securepassword"
}
```
Response Example:

```
{
  "token": "<jwt-token>",
  "userId": 123
}
```

2. Products

Endpoint: /api/v1/products
Methods: GET
Purpose: Retrieve product listings
Authentication: Not required
Caching: Results are cached in Redis and refreshed every 2 minutes

```
[
  { "id": 1, "name": "Product A", "price": 100.0 },
  { "id": 2, "name": "Product B", "price": 200.0 }
]
```

3. Transactions

Endpoint: /api/v1/txn
Methods: GET, POST
Purpose:

GET → Retrieve transaction history

POST → Execute a buy transaction
Authentication: Required

Request Example (Buy Transaction):
```
{
  "productId": 1,
  "quantity": 5
}
```

Response Example:
```
{
  "transactionId": 101,
  "productId": 1,
  "quantity": 5,
  "status": "completed"
}
```
4. Portfolio

Endpoint: /api/v1/portfolio
Methods: GET
Purpose: Retrieve aggregated portfolio data for the authenticated user
Authentication: Required
Caching: Aggregated results cached in Redis with TTL of 5 minutes to reduce database load

Response Example:
```
{
  "userId": 123,
  "totalValue": 10500.0,
  "holdings": [
    { "productId": 1, "quantity": 10, "currentPrice": 100.0 },
    { "productId": 2, "quantity": 20, "currentPrice": 200.0 }
  ]
}
```

### Notes on Caching and Performance:

Product Listing: Redis cache is refreshed automatically every 2 minutes to balance performance and freshness.

Portfolio Aggregation: Redis cache has a TTL of 5 minutes, ensuring that aggregation queries do not overload the database while maintaining reasonably fresh data.

## 7. Demo Video

Around 8 minutes screen recording demonstrates the backend setup, API usage, and caching behavior.

The demo video is accessible via the following link:
[Watch Demo Video](https://drive.google.com/file/d/19eImzlxeJHfhMeRtWZkWFPdg3FbaDK7h/view)
