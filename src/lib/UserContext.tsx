import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type User = {
  id: string;
  username: string;
};

type UserContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage
    const savedUser = localStorage.getItem('dnd_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleSetUser = (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem('dnd_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('dnd_user');
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser: handleSetUser,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
