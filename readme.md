# UserUtil

library that provides easy user management

---

## Features

- User management:
  - Create, edit, enable, disable, and delete users
  - Retrieve user information
- Session management:
  - Login and generate session tokens
  - Validate and terminate sessions
  - Renew and clean expired sessions
  - Retrieve session details
- Secure password storage using `Buffer`
- Customizable session expiration time
- Works with any database supported by Sequelize (MySQL, PostgreSQL, SQLite, etc.)

---

## Install

```bash
npm install github:LunaAug9th/HenryUserUtil
````

> Ensure you have configured Sequelize and connected to your database before using `UserUtil` and You must run `init()` before you use it

---

## Usage

```ts
import { Sequelize } from "sequelize";
import UserUtil from "./UserUtil";

const sequelize = new Sequelize("sqlite::memory:"); // Example: SQLite in-memory

const userUtil = new UserUtil({
    sequelize,
    UsersTableName: "Users",
    SessionsTableName: "Sessions",
    SessionExpires: 3600 // seconds
});

await userUtil.Init();

// Create a user
const errCode = await userUtil.CreateUser("alice", Buffer.from("hashedpassword"));
if (errCode === 19) console.log("Username already exists");

// Login
const token = await userUtil.login("user-id", Buffer.from("hashedpassword"));
if (token) console.log("Login success, token:", token);

// Check session
const isValid = await userUtil.checkSession(token!);
console.log("Session valid:", isValid);

// Retrieve session info
const sessionInfo = await userUtil.getSessionInfo(token!);
console.log(sessionInfo);

// Clean expired sessions
await userUtil.CleanSession();
```

---

## API

### Error Codes

* 19: Already Exist
* null: Not Exist User

### User Methods

* `CreateUser(username: string, hashedpasswd: Buffer | string): Promise<19 | null>` (19: Already Exists Username)
* `getUserInfo(ID: string): Promise<UserInfo | null>`
* `EditUserInfo(ID: string, updates: Partial<{ username: string; passwd: Buffer | string }>): Promise<true | null>`
* `deleteUser(ID: string): Promise<true | null>`
* `DisableUser(ID: string): Promise<true | null>`
* `EnableUser(ID: string): Promise<true | null>`
* `getID(username: string): Promise<string | null>`

### Session Methods

* `login(ID: string, hashedpasswd: Buffer | string): Promise<Buffer | null>`
* `checkSession(Token: Buffer | string): Promise<boolean | null>`
* `terminateSession(Token: Buffer | string): Promise<true | null>`
* `SessionsFromUser(ID: string): Promise<Array<{ Token: Buffer, Expire_at: number }> | null>`
* `RenewSession(Token: Buffer | string, extendSeconds?: number): Promise<true | null>`
* `CleanSession(): Promise<void>`
* `getSessionInfo(Token: Buffer | string): Promise<{ ID: string, Token: Buffer, Expire_at: number } | null>`

---

## Options

When creating a `UserUtil` instance:

```ts
interface UserUtilOptions {
    sequelize: Sequelize;           // Sequelize instance
    UsersTableName?: string;        // Optional, default: "Users"
    SessionsTableName?: string;     // Optional, default: "Sessions"
    SessionExpires?: number;        // Optional, default: 3600 seconds
}
```

---

## License

MIT
