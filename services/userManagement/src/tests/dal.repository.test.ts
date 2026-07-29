jest.mock('../model/userModel', () => ({
  user: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

import { user } from '../model/userModel';
import {
  findUserByFilter,
  saveUser,
  createUser,
} from '../dal/authentication.repository';
import { findUserAndUpdateFields } from '../dal/userManagement.repository';

const mockedUser = user as unknown as {
  findOne: jest.Mock;
  create: jest.Mock;
  findByIdAndUpdate: jest.Mock;
};

beforeEach(() => jest.clearAllMocks());

describe('authentication.repository', () => {
  describe('findUserByFilter', () => {
    it('delegates to user.findOne and returns the result', async () => {
      const doc = { _id: '1', email: 'a@b.com' };
      mockedUser.findOne.mockResolvedValue(doc);

      const result = await findUserByFilter({ email: 'a@b.com' });

      expect(mockedUser.findOne).toHaveBeenCalledWith({ email: 'a@b.com' });
      expect(result).toBe(doc);
    });

    it('returns null when no user matches', async () => {
      mockedUser.findOne.mockResolvedValue(null);
      expect(await findUserByFilter({ email: 'nope' })).toBeNull();
    });
  });

  describe('saveUser', () => {
    it('calls save() on the document and returns the saved value', async () => {
      const saved = { _id: '1' };
      const doc = { save: jest.fn().mockResolvedValue(saved) };

      const result = await saveUser(doc as never);

      expect(doc.save).toHaveBeenCalled();
      expect(result).toBe(saved);
    });
  });

  describe('createUser', () => {
    it('delegates to user.create', async () => {
      const created = { _id: '2' };
      mockedUser.create.mockResolvedValue(created);

      const result = await createUser({ email: 'x@y.com' } as never);

      expect(mockedUser.create).toHaveBeenCalledWith({ email: 'x@y.com' });
      expect(result).toBe(created);
    });
  });
});

describe('userManagement.repository - findUserAndUpdateFields', () => {
  it('updates the user by id with $set and safe options', async () => {
    const updated = { _id: '1', firstName: 'New' };
    mockedUser.findByIdAndUpdate.mockResolvedValue(updated);

    const result = await findUserAndUpdateFields('1', { firstName: 'New' } as never);

    expect(mockedUser.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { $set: { firstName: 'New' } },
      { new: true, runValidators: true },
    );
    expect(result).toBe(updated);
  });
});
