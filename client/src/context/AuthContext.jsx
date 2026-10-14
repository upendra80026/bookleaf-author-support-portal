import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bookleaf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bookleaf_token') || null);
  const [demoUsers, setDemoUsers] = useState({ authors: [], admins: [] });
  const [loading, setLoading] = useState(true);

  // Fetch demo users for the rapid switcher
  useEffect(() => {
    fetch('/api/auth/demo-users')
      .then(res => res.json())
      .then(data => {
        setDemoUsers(data);
        // Default to first author (Priya Sharma) if not logged in
        if (!user && data.authors && data.authors.length > 0) {
          switchUser(data.authors[0], 'author');
        }
      })
      .catch(err => console.error('Failed to load demo users:', err))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('bookleaf_user', JSON.stringify(data.user));
    localStorage.setItem('bookleaf_token', data.token);
    return data.user;
  };

  const switchUser = async (targetUser, role = null) => {
    try {
      const email = targetUser.email;
      const pwd = (role || targetUser.role) === 'admin' ? 'admin123' : 'author123';
      const u = await login(email, pwd);
      return u;
    } catch (err) {
      console.error('Quick switch failed:', err);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bookleaf_user');
    localStorage.removeItem('bookleaf_token');
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      switchUser,
      demoUsers,
      loading,
      isAdmin: user?.role === 'admin',
      isAuthor: user?.role === 'author'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
