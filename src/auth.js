// AuthManager - User Authentication & Session Management for TempoKoç

const USERS_STORAGE_KEY = 'tempokoc_users_v1';
const CURRENT_USER_KEY = 'tempokoc_current_user_v1';

export class AuthManager {
  static listeners = [];

  // Simple string hash helper for mock passwords
  static hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(36);
  }

  static getUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Failed to load users:', e);
      return [];
    }
  }

  static saveUsers(users) {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  }

  static getCurrentUser() {
    try {
      const data = localStorage.getItem(CURRENT_USER_KEY);
      if (!data) return null;
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  static setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
      this.notifyListeners(user);
    } catch (e) {
      console.error('Failed to update current user session:', e);
    }
  }

  static isLoggedIn() {
    const user = this.getCurrentUser();
    return user !== null && !user.isGuest;
  }

  static getUserId() {
    const user = this.getCurrentUser();
    return user && !user.isGuest ? user.id : 'guest';
  }

  static register({ name, email, password }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (name || '').trim();
    
    if (!cleanName || !cleanEmail || !password) {
      return { success: false, message: 'Lütfen tüm alanları doldurun.' };
    }

    if (password.length < 4) {
      return { success: false, message: 'Şifre en az 4 karakter olmalıdır.' };
    }

    const users = this.getUsers();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (existing) {
      return { success: false, message: 'Bu e-posta adresi ile zaten kayıtlı bir hesap var.' };
    }

    const newUser = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: cleanName,
      email: cleanEmail,
      passwordHash: this.hashPassword(password),
      createdAt: new Date().toISOString(),
      avatarBg: this.getRandomColor(),
    };

    users.push(newUser);
    this.saveUsers(users);

    // Auto login after registration
    const sessionUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatarBg: newUser.avatarBg,
      createdAt: newUser.createdAt,
      isGuest: false
    };

    this.setCurrentUser(sessionUser);
    return { success: true, user: sessionUser, message: 'Hesabınız başarıyla oluşturuldu!' };
  }

  static login({ email, password }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'E-posta ve şifrenizi giriniz.' };
    }

    const users = this.getUsers();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Bu e-posta adresine ait hesap bulunamadı.' };
    }

    if (user.passwordHash !== this.hashPassword(password)) {
      return { success: false, message: 'Hatalı şifre. Lütfen tekrar deneyin.' };
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarBg: user.avatarBg || '#6366f1',
      createdAt: user.createdAt,
      isGuest: false
    };

    this.setCurrentUser(sessionUser);
    return { success: true, user: sessionUser, message: 'Başarıyla giriş yapıldı!' };
  }

  static logout() {
    this.setCurrentUser(null);
    return { success: true, message: 'Oturum kapatıldı. Misafir moduna geçildi.' };
  }

  static onAuthChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  static notifyListeners(user) {
    this.listeners.forEach(cb => {
      try {
        cb(user);
      } catch (e) {
        console.error('Auth listener error:', e);
      }
    });
  }

  static getRandomColor() {
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#06b6d4', '#3b82f6', '#f59e0b'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}
