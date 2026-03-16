import { createContext, useContext } from 'react';

export const AuthModalContext = createContext({
  openLogin: () => {},
  openRegister: () => {},
});

export function useAuthModal() {
  return useContext(AuthModalContext);
}
