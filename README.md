# Sense

### Where did sense spawn from?

-> Be Lou <br>
-> Want to send messages in my Slack channel through my Slack bot about my spending <br>
-> Bank doesn't have an API <br>
-> WHAT SHOULD I DO??

So that's where Sense came in but it was a little different because I never actually used it as intended lol.

### "You've yapped alot Lou, what is Sense?"

Sense is a YNAB replica (a budgetting app I loved using but I'm not dropping ~$49.99 a month man) that hopes to solve issues YNAB is having:

1. Being paid and EXPENSIVE
2. A somewhat complex UI

#### Sense lets you do a lot:

- You can have multiple spending accounts
  ![]()
- Set spending goals!
  ![]()
- Use categories to split your spending
  ![]()
- Track how much you spend and get weekly statistics about your spending.

This was originally made for Neighborhood but I moved it over to Shipwrecked :) This was my first mobile app and I got lots of help from expo docs, Cursor and guesswork!

---

### Demos + Pics of Demo!

[Video!](https://files.catbox.moe/o5lewo.MOV)

![](/imgs/IMG_8800.png)

> Sign Up! - Where you uhm...yk...sign up

![](/imgs/IMG_8799.png)

> Sign In! - where you sign in (if that's not obvious already)

![](/imgs/IMG_8794.png)

> Home page :) - Has little bits of everything

![](/imgs/IMG_8798.png)

> Transactions! - View all your recent transactions!

![](/imgs/IMG_8797.png)

> Add Transaction! - Add a transaction you just made

![](/imgs/IMG_8796.png)

> Spending summary! - Get updates on your spending!

![](/imgs/IMG_8795.png)

> Profile page! - Customise and edit your profile

---

### Wanna replicate this locally?

#### 1. You should have

- Node + npm
- Git
- Docker _or_ your own Postgres install (Docker is easier, trust me)

#### 2. Clone & install dependencies

Clone my repo and in the folder run:

```bash
cd frontend && npm install
cd ../server && npm install
```

#### 3. Postgres stuff with Docker

```bash
docker run --name sense-db \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 -d postgres:16-alpine
```

That gives you a DB at `postgres://postgres:postgres@localhost:5432/postgres`.

#### 4. Add your envs in `server/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres?schema=public
JWT_SECRET=REALLYLONGTEXT
```

#### 5. Run migrations

```bash
cd server
npx prisma generate
npx prisma migrate dev --name init
```

#### 6. Start the backend

```bash
npm run dev
```

#### 7. Launch the app

```bash
cd ../frontend
npx expo start
```

---

### License

MIT - Do as you please with this code, I don't care.
<br><br><br>
Made with <3 and :3 by [@v1peridae](github.com/v1peridae)
