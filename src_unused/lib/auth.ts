
export const Auth = {
  setToken: (token: string) => {
    localStorage.setItem('edupay_token', token);
  },
  
  getToken: (): string | null => {
    return localStorage.getItem('edupay_token');
  },
  
  clearToken: () => {
    localStorage.removeItem('edupay_token');
  },
  
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('edupay_token');
  }
};
