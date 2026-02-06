const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const environment = {
  production: false,
  apiBaseUrl: `http://${hostname}:3000`
};
