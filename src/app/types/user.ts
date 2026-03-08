export interface CustomUser {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    roles: string[];
    firstName?: string;
    lastName?: string;
}