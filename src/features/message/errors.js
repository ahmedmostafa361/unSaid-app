import { AppError } from "../../lib/errors/error.js"; // adjust to your error class

export const cannotMessageSelf = () =>
    new AppError("You can't send a message to yourself", 400, { code: "CANNOT_MESSAGE_SELF" });

export const messageNotFound = () => new AppError("Message not found", 404, { code: "MESSAGE_NOT_FOUND" });

export const receiverNotAcceptingMessages = () =>
    new AppError("This user isn't accepting messages right now", 403, { code: "MESSAGES_DISABLED" });

export const guestMessagesDisabled = () =>
    new AppError("This user only accepts messages from logged-in users", 403, { code: "GUEST_MESSAGES_DISABLED" });

export const cannotMessageUser = () =>
    new AppError("You can't send messages to this user", 403, { code: "BLOCKED" });

export const guestSender = () =>
    new AppError("This message was sent by a guest, so there is no sender to reveal or block", 400, {
        code: "GUEST_SENDER",
    });

export const identityRequestExists = (status) =>
    new AppError(`You already asked who sent this message (status: ${status})`, 409, {
        code: "IDENTITY_REQUEST_EXISTS",
        details: { status },
    });

export const identityRequestNotFound = () =>
    new AppError("Request not found", 404, { code: "IDENTITY_REQUEST_NOT_FOUND" });

export const identityRequestAlreadyHandled = (status) =>
    new AppError(`This request was already ${status}`, 409, {
        code: "IDENTITY_REQUEST_HANDLED",
        details: { status },
    });

export const alreadyReported = () =>
    new AppError("You already reported this message", 409, { code: "ALREADY_REPORTED" });

export const messageNotPublic = () =>
    new AppError("This message is not public", 400, { code: "MESSAGE_NOT_PUBLIC" });

export const conversationNotFound = () =>
    new AppError("Conversation not found", 404, { code: "CONVERSATION_NOT_FOUND" });

export const notConversationParticipant = () =>
    new AppError("Only the two users in this conversation can access it", 403, { code: "NOT_PARTICIPANT" });

export const conversationBlocked = () =>
    new AppError("You can't send messages in this conversation because one of you blocked the other", 403, {
        code: "CONVERSATION_BLOCKED",
    });

export const chatMessageNotFound = () =>
    new AppError("Message not found in this conversation", 404, { code: "CHAT_MESSAGE_NOT_FOUND" });

export const notChatMessageOwner = () =>
    new AppError("You can only change your own messages", 403, { code: "NOT_MESSAGE_OWNER" });
