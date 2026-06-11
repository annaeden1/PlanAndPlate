import { user } from '../model/userModel';

export const findUserAndUpdateFields = async (
  userId: string,
  updatePayload: Record<string, unknown>,
) => {
  return await user.findByIdAndUpdate(
    userId,
    { $set: updatePayload },
    { new: true, runValidators: true },
  );
};
