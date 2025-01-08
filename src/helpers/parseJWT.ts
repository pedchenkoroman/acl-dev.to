export const parseJwt = (token: string | undefined): Record<string, any> => {
  if (!token) {
    return {};
  }
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
};
