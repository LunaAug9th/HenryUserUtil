import {
    Sequelize,
    DataTypes,
    Model,
    InferAttributes,
    InferCreationAttributes,
    CreationOptional,
    Op
} from "sequelize";
import crypto from "crypto";

export class UserModel extends Model<
    InferAttributes<UserModel>,
    InferCreationAttributes<UserModel>
> {
    declare ID: CreationOptional<string>;
    declare username: string;
    declare passwd: Buffer;
    declare created_at: number;
    declare last_edited_at: number;
    declare disabled: CreationOptional<boolean>;
}

export class SessionModel extends Model<
    InferAttributes<SessionModel>,
    InferCreationAttributes<SessionModel>
> {
    declare ID: CreationOptional<string>;
    declare Token: Buffer;
    declare Expire_at: number;
}

export interface UserUtilOptions {
    sequelize: Sequelize;
    UsersTableName?: string;
    SessionsTableName?: string;
    SessionExpires?: number;
}

export default class UserUtil {
    private sequelize: Sequelize;
    private UsersTableName: string;
    private SessionsTableName: string;
    private SessionExpires: number;

    public Users: typeof UserModel | null;
    public Sessions: typeof SessionModel | null;

    private crypto: typeof crypto;

    constructor(opts: UserUtilOptions) {
        this.sequelize = opts.sequelize;
        this.UsersTableName = opts.UsersTableName || "Users";
        this.SessionsTableName = opts.SessionsTableName || "Sessions";
        this.SessionExpires = opts.SessionExpires || 3600;

        this.Users = null;
        this.Sessions = null;

        this.crypto = crypto;
    }

    async Init(): Promise<void> {
        try {
            this.Users = this.sequelize.define<UserModel>(
                this.UsersTableName,
                {
                    ID: {
                        type: DataTypes.UUID,
                        primaryKey: true,
                        defaultValue: DataTypes.UUIDV4
                    },
                    username: {
                        type: DataTypes.STRING,
                        unique: true,
                        allowNull: false
                    },
                    passwd: {
                        type: DataTypes.BLOB,
                        allowNull: false
                    },
                    created_at: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    last_edited_at: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    },
                    disabled: {
                        type: DataTypes.BOOLEAN,
                        defaultValue: false
                    }
                },
                { timestamps: false }
            ) as typeof UserModel;

            this.Sessions = this.sequelize.define<SessionModel>(
                this.SessionsTableName,
                {
                    ID: {
                        type: DataTypes.UUID,
                        primaryKey: true,
                        defaultValue: DataTypes.UUIDV4
                    },
                    Token: {
                        type: DataTypes.BLOB,
                        allowNull: false
                    },
                    Expire_at: {
                        type: DataTypes.INTEGER,
                        allowNull: false
                    }
                },
                { timestamps: false }
            ) as typeof SessionModel;

            await this.Users.sync();
            await this.Sessions.sync();
        } catch (err) {
            console.error("[INIT ERROR]", err);
            process.exit(1);
        }
    }

    async CreateUser(username: string, hashedpasswd: Buffer | string): Promise<19 | null> {
        try {
            if (!this.Users) return null;

            const exists = await this.Users.findOne({ where: { username } });
            if (exists) return 19;

            const now = Math.floor(Date.now() / 1000);

            await this.Users.create({
                username,
                passwd: Buffer.isBuffer(hashedpasswd)
                    ? hashedpasswd
                    : Buffer.from(hashedpasswd),
                created_at: now,
                last_edited_at: now
            });

            return null;
        } catch (err) {
            console.error("[CreateUser ERROR]", err);
            return null;
        }
    }

    async EditUserInfo(ID: string, updates: Partial<{ username: string; passwd: Buffer | string }>) {
        if (!this.Users) return null;
        const user = await this.Users.findOne({ where: { ID } });
        if (!user) return null;
    
        const updatedData: any = {};
        if (updates.username) updatedData.username = updates.username;
        if (updates.passwd) updatedData.passwd = Buffer.isBuffer(updates.passwd) ? updates.passwd : Buffer.from(updates.passwd);
        updatedData.last_edited_at = Math.floor(Date.now() / 1000);
    
        await user.update(updatedData);
        return true;
    }

    async getUserInfo(ID: string) {
        try {
            if (!this.Users) return null;
            const row = await this.Users.findOne({ where: { ID } });
            if (!row) return null;

            return {
                ID: row.ID,
                username: row.username,
                passwd: row.passwd,
                created_at: row.created_at,
                last_edited_at: row.last_edited_at,
                disabled: row.disabled
            };
        } catch (err) {
            console.error("[getUserInfo ERROR]", err);
            return null;
        }
    }

    async deleteUser(ID: string): Promise<true | null> {
        try {
            if (!this.Users) return null;
            const deleted = await this.Users.destroy({ where: { ID } });
            if (deleted === 0) return null;
            return true;
        } catch (err) {
            console.error("[deleteUser ERROR]", err);
            return null;
        }
    }

    async getID(username: string): Promise<string | null> {
        try {
            if (!this.Users) return null;
            const row = await this.Users.findOne({ where: { username } });
            return row?.ID ?? null;
        } catch (err) {
            console.error("[getID ERROR]", err);
            return null;
        }
    }

    async CreateSession(ID: string, hashedpasswd: Buffer | string): Promise<Buffer | null> {
        try {
            if (!this.Users || !this.Sessions) return null;

            const user = await this.Users.findOne({ where: { ID } });
            if (!user) return null;

            const passbuf = Buffer.isBuffer(hashedpasswd)
                ? hashedpasswd
                : Buffer.from(hashedpasswd);

            if (Buffer.compare(user.passwd, passbuf) !== 0) return null;

            const token = this.crypto.randomBytes(32);
            const expire = Math.floor(Date.now() / 1000) + this.SessionExpires;

            await this.Sessions.create({
                Token: token,
                Expire_at: expire
            });

            return token;
        } catch (err) {
            console.error("[login ERROR]", err);
            return null;
        }
    }
    
    async SessionsFromUser(ID: string) {
        if (!this.Sessions) return null;
        const rows = await this.Sessions.findAll({ where: { ID } });
        return rows.map(r => ({ Token: r.Token, Expire_at: r.Expire_at }));
    }
    
    async RenewSession(Token: Buffer | string, extendSeconds?: number) {
        if (!this.Sessions) return null;
        const buf = Buffer.isBuffer(Token) ? Token : Buffer.from(Token);
        const session = await this.Sessions.findOne({ where: { Token: buf } });
        if (!session) return null;
    
        const now = Math.floor(Date.now() / 1000);
        const newExpire = now + (extendSeconds || this.SessionExpires);
        await session.update({ Expire_at: newExpire });
        return true;
    }
    
    async CleanSession() {
        if (!this.Sessions) return null;
        const now = Math.floor(Date.now() / 1000);
        await this.Sessions.destroy({ where: { Expire_at: { [Op.lt]: now } } });
    }
    
    async getSessionInfo(Token: Buffer | string) {
        if (!this.Sessions) return null;
        const buf = Buffer.isBuffer(Token) ? Token : Buffer.from(Token);
        const row = await this.Sessions.findOne({ where: { Token: buf } });
        if (!row) return null;
        return { ID: row.ID, Token: row.Token, Expire_at: row.Expire_at };
    }

    async checkSession(Token: Buffer | string): Promise<boolean | null> {
        try {
            if (!this.Sessions) return null;

            const buf = Buffer.isBuffer(Token) ? Token : Buffer.from(Token);

            const row = await this.Sessions.findOne({
                where: { Token: buf }
            });

            if (!row) return false;

            const now = Math.floor(Date.now() / 1000);
            if (row.Expire_at < now) {
                await row.destroy();
                return false;
            }

            return true;
        } catch (err) {
            console.error("[checkSession ERROR]", err);
            return null;
        }
    }

    async terminateSession(Token: Buffer | string): Promise<true | null> {
        try {
            if (!this.Sessions) return null;

            const buf = Buffer.isBuffer(Token) ? Token : Buffer.from(Token);

            const deleted = await this.Sessions.destroy({ where: { Token: buf } });
            if (deleted === 0) return null;
            return true;
        } catch (err) {
            console.error("[terminateSession ERROR]", err);
            return null;
        }
    }

    async DisableUser(ID: string): Promise<true | null> {
        try {
            if (!this.Users) return null;

            const user = await this.Users.findOne({ where: { ID } });
            if (!user) return null;

            await user.update({
                disabled: true,
                last_edited_at: Math.floor(Date.now() / 1000)
            });

            return true;
        } catch (err) {
            console.error("[DisableUser ERROR]", err);
            return null;
        }
    }

    async EnableUser(ID: string): Promise<true | null> {
        try {
            if (!this.Users) return null;

            const user = await this.Users.findOne({ where: { ID } });
            if (!user) return null;

            await user.update({
                disabled: false,
                last_edited_at: Math.floor(Date.now() / 1000)
            });

            return true;
        } catch (err) {
            console.error("[EnableUser ERROR]", err);
            return null;
        }
    }
}
