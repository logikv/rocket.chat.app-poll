import { IModify, IPersistence, IRead } from '@rocket.chat/apps-engine/definition/accessors';

import { createPollBlocks } from './createPollBlocks';
import { getPoll } from './getPoll';
import { storeVote } from './storeVote';

export async function votePoll({ data, read, persistence, modify }: {
    data,
    read: IRead,
    persistence: IPersistence,
    modify: IModify,
}) {
    if (!data.message) {
        return {
            success: true,
        };
    }

    const poll = await getPoll(String(data.message.id), read);
    if (!poll) {
        throw new Error('no such poll');
    }

    await storeVote(poll, parseInt(String(data.value), 10), data.user, { persis: persistence });

    const message = await modify.getUpdater().message(data.message.id as string, data.user);
    message.setEditor(message.getSender());

    const block = modify.getCreator().getBlockBuilder();

    createPollBlocks(block, poll.question, poll.options, poll);

    message.setBlocks(block);

    return modify.getUpdater().finish(message);
}