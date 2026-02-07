
import { User } from '../types';

const AUTH_KEY = 'styleswap_user_session';

export const authService = {
  login: (email: string): User => {
    const user: User = {
      email,
      isLoggedIn: true
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data);
  }
};
