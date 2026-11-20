import type { Message, Session } from '../types/index.js';
import { generateId } from '../types/schema.js';

/** Add a message to a session (mutates in place) */
export function appendMessage(
  session: Session,
  role: Message['role'],
  content: string,
): void {
  const msg: Message = {
    id: generateId(),
    role,
    content,
    timestamp: Date.now(),
  };
  session.messages.push(msg);
  session.updatedAt = Date.now();
}

