import { User } from '../types';

const USERS_KEY = 'genesis_v8_users';
const CURRENT_USER_KEY = 'genesis_v8_current_user';
const API_KEY_KEY = 'genesis_v8_api_key';

interface UserRecord {
  password: string;
  createdAt: string;
}

const getUsers = (): Record<string, UserRecord> => {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : {};
};

const saveUsers = (users: Record<string, UserRecord>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const initDefaultUser = () => {
  const users = getUsers();
  if (!users['preetjgfilj2@gmail.com']) {
    users['preetjgfilj2@gmail.com'] = {
      password: 'Latest@23',
      createdAt: new Date().toISOString(),
    };
    saveUsers(users);
    console.log('Default admin user created.');
  }
};

export const signup = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      if (users[email]) {
        return reject(new Error('User with this email already exists.'));
      }
      users[email] = {
        password, // In a real app, hash this password
        createdAt: new Date().toISOString(),
      };
      saveUsers(users);
      const newUser: User = { id: `user_${Date.now()}`, email };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
      localStorage.removeItem(API_KEY_KEY); // Ensure new signups have no key
      resolve(newUser);
    }, 500);
  });
};

export const login = (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const users = getUsers();
      if (!users[email] || users[email].password !== password) {
        return reject(new Error('Invalid email or password.'));
      }
      const user: User = { id: `user_${email}`, email };
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      
      if (email === 'preetjgfilj2@gmail.com') {
        // This is a placeholder for the admin's "inbuilt" key.
        localStorage.setItem(API_KEY_KEY, 'INBUILT_ADMIN_API_KEY_g4f5h6j7k8l');
      } else {
        localStorage.removeItem(API_KEY_KEY);
      }

      resolve(user);
    }, 500);
  });
};

export const logout = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(API_KEY_KEY); // Clear API key on logout
};

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(CURRENT_USER_KEY);
  return user ? JSON.parse(user) : null;
};
