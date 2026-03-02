import { getDraftsByAuthor } from '~~/server/utils/adventures/DraftUtils';

export default defineEventHandler(async (event) => {
    const user = event.context.user;

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const drafts = await getDraftsByAuthor(user._id);
    
    return drafts;
});
