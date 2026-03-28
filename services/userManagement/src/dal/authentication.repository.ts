import { user, UserDocument } from '../model/userModel';
import { User } from '../utils/types';

export const findUserByFilter = async (
  filter: Partial<User>,
): Promise<UserDocument | null> => {
  return await user.findOne(filter);
};

export const saveUser = async (userToSave: UserDocument) => {
  return await userToSave.save();
};

export const createUser = async (newUser: User): Promise<UserDocument> => {
  return await user.create(newUser);
};
