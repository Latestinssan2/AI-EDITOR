// This is a mock service that interacts with localStorage for demonstration purposes.
// In a real app, this would make authenticated API calls to a backend server.

const USERS_KEY = 'genesis_v8_users';

interface UserRecord {
  password: string;
  createdAt: string;
}

export interface UserDetails {
    email: string;
    createdAt: string;
}

export const adminService = {
    getAllUsers: (): Promise<UserDetails[]> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const users = localStorage.getItem(USERS_KEY);
                const userDb: Record<string, UserRecord> = users ? JSON.parse(users) : {};
                const userDetails = Object.entries(userDb).map(([email, data]) => ({
                    email,
                    createdAt: data.createdAt,
                }));
                resolve(userDetails);
            }, 300);
        });
    },

    deleteUser: (email: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = localStorage.getItem(USERS_KEY);
                if (!users) return reject(new Error('User database not found.'));

                const userDb = JSON.parse(users);
                if (!userDb[email]) {
                    return reject(new Error('User not found.'));
                }

                delete userDb[email];
                localStorage.setItem(USERS_KEY, JSON.stringify(userDb));
                resolve();
            }, 300);
        });
    },

    resetPassword: (email: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = localStorage.getItem(USERS_KEY);
                if (!users) return reject(new Error('User database not found.'));

                const userDb = JSON.parse(users);
                if (!userDb[email]) {
                    return reject(new Error('User not found.'));
                }

                const newPassword = 'TempPass@123';
                userDb[email].password = newPassword;
                localStorage.setItem(USERS_KEY, JSON.stringify(userDb));
                resolve(newPassword);
            }, 300);
        });
    },

    deleteAllUserData: (): Promise<void> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    const users = localStorage.getItem(USERS_KEY);
                    if (!users) {
                        console.log("No users to delete.");
                        return resolve();
                    }
                    const userDb: Record<string, UserRecord> = JSON.parse(users);
                    const adminEmail = 'preetjgfilj2@gmail.com';
                    const adminData = userDb[adminEmail];

                    const clearedUsers = adminData ? { [adminEmail]: adminData } : {};
                    
                    localStorage.setItem(USERS_KEY, JSON.stringify(clearedUsers));
                    resolve();
                } catch (error) {
                    reject(new Error("Failed to delete user data."));
                }
            }, 300);
        });
    }
};