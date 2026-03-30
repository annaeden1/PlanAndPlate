import { user } from '../model/userModel';

export const findUserAndUpdateFields = async (
  userId: string,
  updatePayload: Record<string, any>,
) => {
  return await user
    .findByIdAndUpdate(
      userId,
      { $set: updatePayload },
      { new: true, runValidators: true },
    )
    .select('preferences');
};
