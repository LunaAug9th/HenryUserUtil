import { Sequelize, Model, InferAttributes, InferCreationAttributes, CreationOptional } from "sequelize";
export declare class UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>> {
    ID: CreationOptional<string>;
    username: string;
    passwd: Buffer;
    created_at: number;
    last_edited_at: number;
    disabled: CreationOptional<boolean>;
}
export declare class SessionModel extends Model<InferAttributes<SessionModel>, InferCreationAttributes<SessionModel>> {
    ID: CreationOptional<string>;
    Token: string;
    Expire_at: number;
}
export interface UserUtilOptions {
    sequelize: Sequelize;
    UsersTableName?: string;
    SessionsTableName?: string;
    SessionExpires?: number;
}
export default class UserUtil {
    private sequelize;
    private UsersTableName;
    private SessionsTableName;
    private SessionExpires;
    Users: typeof UserModel | null;
    Sessions: typeof SessionModel | null;
    private crypto;
    constructor(opts: UserUtilOptions);
    Init(): Promise<void>;
    CreateUser(username: string, hashedpasswd: Buffer | string): Promise<19 | null>;
    EditUserInfo(ID: string, updates: Partial<{
        username: string;
        passwd: Buffer | string;
    }>): Promise<true | null>;
    getUserInfo(ID: string): Promise<any>;
    deleteUser(ID: string): Promise<true | null>;
    getID(username: string): Promise<string | null>;
    CreateSession(ID: string, hashedpasswd: Buffer | string): Promise<string | null>;
    SessionsFromUser(ID: string): Promise<{
        Token: string;
        Expire_at: number;
    }[] | null>;
    RenewSession(Token: string, extendSeconds?: number): Promise<true | null>;
    CleanSession(): Promise<null | undefined>;
    getSessionInfo(Token: string): Promise<{
        ID: string;
        Token: string;
        Expire_at: number;
    } | null>;
    checkSession(Token: string): Promise<boolean | null>;
    terminateSession(Token: string): Promise<true | null>;
    DisableUser(ID: string): Promise<true | null>;
    EnableUser(ID: string): Promise<true | null>;
}
