# UserUtil
**a library that automatically manages users**

---

### exmaple code
```
import { Sequelize } from "sequelize";
import UserUtil from "henryuserutil";

const sequelize = new Sequelize("testdb", "postgres", "postgres", {
    host: "localhost",
    port: 5432,
    dialect: "postgres",
});

const userUtil = new UserUtil({
    sequelize,
    UsersTableName: "Users",
    SessionsTableName: "Sessions",
    SessionExpires: 3600
});

await userUtil.Init(); // only need to do it once for the first time after creating the DB

const username = "henry";
const hashedPassword = Buffer.from("hashed_password_here");

const result = await userUtil.CreateUser(username, hashedPassword);

if (result === 19) {
    console.log("Already Exists Username");
} else {
    console.log("");
}

const userID = await userUtil.getID("henry");
if (userID) {
    const userInfo = await userUtil.getUserInfo(userID);
    console.log(userInfo);
}

const token = await userUtil.CreateSession(userID, hashedPassword);

if (token) {
    console.log("Successfully logged in, Created Session Token:", token);

    const valid = await userUtil.checkSession(token);
    console.log("Checked Token:", valid);

    const terminated = await userUtil.terminateSession(token);
    console.log("Terminated Session:", terminated);
}

const deleted = await userUtil.deleteUser(userID);
if (deleted) console.log("successfully Deleted");
```

### Return Types

* ``declare class UserModel extends Model<InferAttributes<UserModel>``
* ``InferCreationAttributes<UserModel>>``
  * ``ID: CreationOptional<string>;``
  * ``username: string;``
  * ``passwd: Buffer;``
  * ``created_at: number;``
  * ``last_edited_at: number;``
  * ``disabled: CreationOptional<boolean>;``

* ``declare class SessionModel extends Model<InferAttributes<SessionModel>``
* ``InferCreationAttributes<SessionModel>>``
  * ``ID: CreationOptional<string>;``
  * ``Token: string;``
  * ``Expire_at: number;``

* ``interface UserUtilOptions``
    * ``sequelize: Sequelize;``
    * ``UsersTableName?: string;``
    * ``SessionsTableName?: string;``
    * ``SessionExpires?: number;``

* ``default class UserUtil``
    * ``private sequelize;``
    * ``private UsersTableName;``
    * ``private SessionsTableName;``
    * ``private SessionExpires;``
    * ``Users: typeof UserModel | null;``
    * ``Sessions: typeof SessionModel | null;``
    * ``private crypto;``
    * ``constructor(opts: UserUtilOptions);``
    * ``Init(): Promise<void>;``
    * ``CreateUser(username: string, hashedpasswd: Buffer | string): Promise<19 | null>;``
    * ```EditUserInfo(ID: string, updates: Partial<{ username: string; passwd: Buffer | string; }>): Promise<true | null>;```
    * ``getUserInfo(ID: string): Promise<any>;``
    * ``deleteUser(ID: string): Promise<true | null>;``
    * ``getID(username: string): Promise<string | null>;``
    * ``CreateSession(ID: string, hashedpasswd: Buffer | string): Promise<string | null>;``
    * ``SessionsFromUser(ID: string): Promise<{ Token: string; Expire_at: number; }[] | null>;``
    * ``RenewSession(Token: string, extendSeconds?: number): Promise<true | null>;``
    * ``CleanSession(): Promise<null | undefined>;``
    * ``getSessionInfo(Token: string): Promise<{ ID: string; Token: string; Expire_at: number; } | null>;``
    * ``checkSession(Token: string): Promise<boolean | null>;``
    * ``terminateSession(Token: string): Promise<true | null>;``
    * ``DisableUser(ID: string): Promise<true | null>;``
    * ``EnableUser(ID: string): Promise<true | null>;``

### Return Contents

* ``UserModel``
  * ``ID: UUID(Primary Column);``
  * ``username: string(Unique);``
  * ``passwd: Buffer(Hashed);``
  * ``created_at: UNIX Time Integer;``
  * ``last_edited_at: UNIX Time Integer;``
  * ``disabled: boolean;``

It's User schema expressed in Nodejs type, And ``Disable`` doesn't
really mean anything but you can slightly alter the logic to
stop it at the session creation stage

* ``SessionModel``
  * ``ID: UUID(UserID);``
  * ``Token: UUID(Primary Column);``
  * ``Expire_at: UNIX Time Integer;``

* ``interface UserUtilOptions``
    * ``sequelize: Sequelize Class;``
    * ``UsersTableName?: string;``
    * ``SessionsTableName?: string;``
    * ``SessionExpires?: UNIX Time Integer;``

* ``default class UserUtil``
    * ``Init(): Promise<void>;``
    * ``CreateUser(username: string, hashedpasswd: Hashed Passwd Buffer): Promise<19 | null>;``
    * ``EditUserInfo(ID: string, updates: Partial<{ username: string; passwd: Hashed Passwd Buffer; string; }>): Promise<true | null>;``
    * ``getUserInfo(ID: string): Promise<any>;``
    * ``deleteUser(ID: string): Promise<true | null>;``
    * ``getID(username: string): Promise<string | null>;``
    * ``CreateSession(ID: string, hashedpasswd: Hashed Passwd Buffer | string): Promise<string | null>;``
    * ``SessionsFromUser(ID: string): Promise<{ Token: string; Expire_at: number; }[] | null>;``
    * ``RenewSession(Token: string, extendSeconds?: number): Promise<true | null>;``
    * ``CleanSession(): Promise<null | undefined>;``
    * ``getSessionInfo(Token: string): Promise<{ ID: string; Token: string; Expire_at: number; } | null>;``
    * ``checkSession(Token: string): Promise<boolean | null>;``
    * ``terminateSession(Token: string): Promise<true | null>;``
    * ``DisableUser(ID: string): Promise<true | null>;``
    * ``EnableUser(ID: string): Promise<true | null>;``

### Meaning of return code

* Same Username Error: ``19``
* does not exist: ``null``
* Successfully completed: ``true``

## License

MIT
