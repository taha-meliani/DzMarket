# DzMarket Backend (Express + Prisma)

## Structure

```txt
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── test/
│   ├── utils/
│   └── app.js
├── .env
├── .env.example
└── package.json
```

## Run

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Create and apply migrations:

```bash
npm run prisma:migrate -- --name init
```

4. Start server:

```bash
npm run dev
```

5. Run tests:

```bash
npm test
```

6. Seed demo sellers and products:

```bash
npm run seed:demo
```
