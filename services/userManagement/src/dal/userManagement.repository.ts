import { user } from '../model/userModel';
import type { UserUpdatePayload } from '../types/userManagement.types';

export const findUserAndUpdateFields = async (
  userId: string,
  updatePayload: UserUpdatePayload,
) => {
  return await user.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { new: true, runValidators: true },
  );
};
