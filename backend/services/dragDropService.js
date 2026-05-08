import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  assertPlacementSafe,
  DEFAULT_PLACEMENT_SIDE,
  refreshBinaryState,
} from './placementService.js';

/**
 * Admin drag-drop: re-parents `userId` under `newSponsorId` in the binary tree.
 * Optionally sets a side; default fills left.
 * Operates atomically inside a transaction.
 */
export async function moveNode({
  userId,
  newSponsorId,
  newSide = null,
  actorUserId = null,
  reason = 'admin drag-drop',
}) {
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(newSponsorId)) {
    const err = new Error('Invalid ids');
    err.statusCode = 400;
    throw err;
  }

  await assertPlacementSafe(userId, newSponsorId);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(userId).session(session);
    if (!user) {
      const err = new Error('User to move not found');
      err.statusCode = 404;
      throw err;
    }

    const oldParentId = user.parentId ? String(user.parentId) : null;

    const newParent = await User.findById(newSponsorId).session(session);
    if (!newParent) {
      const err = new Error('Target sponsor not found');
      err.statusCode = 404;
      throw err;
    }

    const oldSide = user.placementSide;
    const targetSide = newSide ?? DEFAULT_PLACEMENT_SIDE;
    const targetField = targetSide === 'left' ? 'leftChild' : 'rightChild';
    if (newParent[targetField] && String(newParent[targetField]) !== String(user._id)) {
      const err = new Error(`${targetSide.toUpperCase()} leg is already occupied`);
      err.statusCode = 409;
      throw err;
    }

    if (oldParentId) {
      const oldParent = await User.findById(oldParentId).session(session);
      if (oldParent) {
        if (oldSide === 'left' && String(oldParent.leftChild) === String(user._id)) {
          oldParent.leftChild = null;
        }
        if (oldSide === 'right' && String(oldParent.rightChild) === String(user._id)) {
          oldParent.rightChild = null;
        }
        oldParent.children.pull(user._id);
        await oldParent.save({ session });
        await refreshBinaryState(oldParent._id, session);
      }
    }

    newParent[targetField] = user._id;
    newParent.children.addToSet(user._id);
    await newParent.save({ session });

    user.placementHistory.push({
      fromSponsorId: oldParentId ? new mongoose.Types.ObjectId(oldParentId) : null,
      toSponsorId: newParent._id,
      fromSide: oldSide,
      toSide: targetSide,
      fromIndex: user.placementSequence ?? null,
      toIndex: user.placementSequence ?? null,
      movedBy: actorUserId,
      movedAt: new Date(),
      reason,
    });
    user.sponsorId = newParent._id;
    user.parentId = newParent._id;
    user.directSponsor = newParent._id;
    user.placementSide = targetSide;
    user.manualPlacement = true;
    await user.save({ session });

    const newCredit = await refreshBinaryState(newParent._id, session);

    if (oldParentId) {
      const c = await User.countDocuments({ sponsorId: oldParentId }).session(session);
      await User.findByIdAndUpdate(oldParentId, { $set: { sponsoredUsersCount: c } }, { session });
    }
    {
      const c = await User.countDocuments({ sponsorId: newParent._id }).session(session);
      await User.findByIdAndUpdate(newParent._id, { $set: { sponsoredUsersCount: c } }, { session });
    }

    await session.commitTransaction();

    return {
      changed: true,
      user: {
        id: String(user._id),
        sponsorId: String(user.sponsorId),
        parentId: String(user.parentId),
        placementSide: user.placementSide,
        placementSequence: user.placementSequence,
      },
      newSponsor: {
        id: String(newParent._id),
        deltaPairs: newCredit?.deltaPairs ?? 0,
      },
      oldSponsor: oldParentId ? { id: oldParentId } : null,
    };
  } catch (err) {
    await session.abortTransaction().catch(() => {});
    throw err;
  } finally {
    await session.endSession();
  }
}
