# DIMO AI Web App

A modern web application for DIMO AI, built with Vite, React, TypeScript, shadcn-ui, and Tailwind CSS.

## Project Overview

This app provides a seamless interface for DIMO-connected vehicle owners to access AI-powered insights, predictive maintenance, and smart vehicle management features. It integrates the Login with DIMO SDK for secure authentication and vehicle data access.

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)

### Setup
1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd dimo-ai-web
   ```
2. **Install dependencies:**
   ```sh
   npm install
   ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` (if provided), or create a `.env` file:
     ```env
     VITE_DIMO_CLIENT_ID=your_client_id
     VITE_DIMO_API_KEY=your_api_key
     VITE_DIMO_REDIRECT_URI=http://localhost:8080
     ```
   - **Never commit your `.env` file or secrets to version control.**

4. **Start the development server:**
   ```sh
   npm run dev
   ```
   The app will be available at [http://localhost:8080](http://localhost:8080).

## Security & Best Practices
- **Secrets:** All API keys and credentials must be stored in `.env` files, which are gitignored by default.
- **No hardcoded secrets:** The codebase is free of hardcoded secrets and credentials.
- **.env files:** Never push `.env` or any secret files to GitHub.

## Technologies Used
- Vite
- React
- TypeScript
- shadcn-ui
- Tailwind CSS
- DIMO Login SDK

## Authentication
This app uses the [Login with DIMO SDK](https://www.npmjs.com/package/@dimo-network/login-with-dimo) for secure authentication and vehicle data access. See the SDK documentation for advanced usage.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
