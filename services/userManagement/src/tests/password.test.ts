import bcrypt from 'bcrypt';
import { hashPassword } from '../utils/password';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

beforeEach(() => jest.clearAllMocks());

describe('hashPassword', () => {
  it('generates a salt and hashes the password with it', async () => {
    (mockedBcrypt.genSalt as jest.Mock).mockResolvedValue('salt123');
    (mockedBcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');

    const result = await hashPassword('secret');

    expect(mockedBcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(mockedBcrypt.hash).toHaveBeenCalledWith('secret', 'salt123');
    expect(result).toBe('hashed-pw');
  });

  it('propagates errors from bcrypt', async () => {
    (mockedBcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('bcrypt fail'));
    await expect(hashPassword('secret')).rejects.toThrow('bcrypt fail');
  });
});
