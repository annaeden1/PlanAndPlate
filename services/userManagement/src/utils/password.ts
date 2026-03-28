import bcrypt from 'bcrypt';

export const hashPassword = async (password: string): Promise<string> => {
  const salt: string = await bcrypt.genSalt(10);
  const encryptedPassword: string = await bcrypt.hash(password, salt);
  return encryptedPassword;
};
