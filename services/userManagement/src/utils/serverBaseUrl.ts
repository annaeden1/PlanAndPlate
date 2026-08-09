const serverProtocol = (): 'http' | 'https' =>
  process.env.NODE_ENV === 'production' ? 'https' : 'http';

export const getServerBaseUrl = (): string => {
  const domain = process.env.DOMAIN_BASE || 'localhost';
  const port = process.env.PORT || '8000';
  return `${serverProtocol()}://${domain}:${port}`;
};