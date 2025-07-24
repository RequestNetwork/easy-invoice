# Easy Invoice - Streamlined Invoice Management with Request Network

Easy Invoice is a modern, user-friendly web application that demonstrates the power and simplicity of creating and managing invoices using the Request Network API. Built with Next.js and modern web technologies, this application showcases how easy it is to implement crypto-powered payment solutions in your applications.

## ✨ Features

- 🧾 **Simple Invoice Creation**: Create professional invoices in minutes
- 💰 **Crypto Payments**: Accept payments in various cryptocurrencies
- 🔄 **Real-time Updates**: Track payment status in real-time
- 🌐 **Web3 Integration**: Seamless integration with blockchain technology

## 🚀 Getting Started

### Prerequisites

- Node.js 18+

  - It is recommended to use `nvm` (Node Version Manager) to install and manage your Node.js versions. You can install `nvm` from [here](https://github.com/nvm-sh/nvm) and then run the following commands:

  ```bash
  $ nvm install 18
  $ nvm use 18
  ```

- PostgreSQL database
- Google OAuth credentials (for authentication)
- Request Network API key
- Reown Project ID

### Environment Setup

1. Clone the repository:

```bash
git clone git@github.com:RequestNetwork/easy-invoice.git
cd easy-invoice
```

2. Copy the environment variables file:

```bash
cp .env.example .env
```

3. Fill in the required environment variables in `.env`:

- `DATABASE_URL`: Your PostgreSQL connection string
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `REQUEST_API_KEY`: Your Request Network API key
- `REQUEST_API_URL`: Request Network API URL
- `NEXT_PUBLIC_REOWN_PROJECT_ID`: Your Reown project ID
- Other required environment variables as specified in `.env.example`

### Installation

#### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

#### 2. Start the Development Server

This command runs the Easy Invoice Next.js app (frontend and backend) and starts the PostgreSQL database container.

```bash
npm run dev
# or
yarn dev
```

> **Note:** If the PostgreSQL database container does not exist, it will be created automatically when you start the development server.

The application will be available at [http://localhost:3000](http://localhost:3000).

#### 3. Set Up the Database

> **Note:** Ensure the database container is running before interacting with the database. The container starts automatically when you run `npm run dev` or `yarn dev`.

```bash
# For development:
npm run db:push    # Pushes schema changes directly to the database
# or
yarn db:push

# For production:
npm run db:generate  # Generates migration files based on schema changes
npm run db:migrate   # Applies the generated migrations to the database
# or
yarn db:generate
yarn db:migrate
```

### Development

#### Access the Database with Drizzle Studio

You can use Drizzle Studio to inspect and manage your PostgreSQL database:

```bash
npm run db:studio
# or
yarn db:studio
```

Drizzle Studio runs on port `4983` by default. If you see an error like `Error: listen EADDRINUSE: address already in use 127.0.0.1:4983`, it means the port is already in use (possibly by another Drizzle Studio instance). You can specify a different port:

```bash
npm run db:studio -- --port=4984
# or
yarn db:studio --port=4984
```

#### Resetting the Database for Development

The PostgreSQL database container stores its data in the `/dev/postgres-data` directory (mounted as a volume).

To fully reset the database:

1. **Delete the PostgreSQL container.**
2. **Delete the `/dev/postgres-data` directory.**

This will remove all persisted data and ensure a fresh database instance is created on the next startup.

## 🏗️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Authentication**: Google OAuth
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **State Management**: React Query & tRPC
- **Payment Integration**: Request Network API
- **Web3**: Ethers.js & Viem

## 📖 Documentation

For more information about the technologies used:

- [Request Network Documentation](https://docs.request.network/)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
