# ViaGo - Customer & Delivery Partner Mobile App

## Overview
ViaGo is a multi-service delivery platform mobile application built with Expo (React Native) and FastAPI backend with MongoDB.

## Features

### Customer App
- **Authentication**: OTP-based email login
- **Module Selection**: Food, Grocery, Laundry
- **Store Discovery**: Browse nearby stores with distance calculation
- **Menu/Catalog**: View store items by category
- **Cart Management**: Add/remove items, quantity control
- **Checkout**: Address management, payment method selection
- **Orders**: Order placement, order history
- **Profile**: User profile management

### Delivery Partner App  
- **Authentication**: OTP-based email login
- **Available Deliveries**: View nearby orders ready for pickup
- **Accept/Reject**: Accept or reject delivery requests
- **Active Deliveries**: Track active deliveries with status updates
- **Status Updates**: Picked up → Out for delivery → Delivered
- **Earnings**: View daily/weekly/monthly earnings
- **Delivery History**: Past delivery records
- **Profile**: Delivery partner profile management

## Tech Stack
- **Frontend**: Expo (React Native) with expo-router
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT tokens with OTP verification

## API Endpoints

### Auth
- POST /api/auth/send-otp
- POST /api/auth/verify-otp

### Customer
- GET /api/customer/stores
- GET /api/customer/restaurants/{store_id}
- POST /api/customer/cart/add
- GET /api/customer/cart
- POST /api/customer/orders
- GET /api/customer/orders
- GET /api/customer/addresses
- POST /api/customer/addresses

### Delivery
- GET /api/delivery/available
- POST /api/delivery/accept/{order_id}
- GET /api/delivery/assigned
- PUT /api/delivery/status/{order_id}
- GET /api/delivery/earnings
- GET /api/delivery/history

## Sample Data
The system seeds sample data on startup:
- 4 Stores (2 restaurants, 1 grocery, 1 laundry)
- Multiple categories and items per store
- Tenant configuration with delivery charges
