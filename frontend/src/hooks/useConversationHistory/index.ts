// Re-export types for backward compatibility
export type { AddEntryType, OnEntriesUpdated, PatchTypeWithKey } from './types';

// Use old WebSocket-based hook for history loading
export { useConversationHistoryOld as useConversationHistory } from './useConversationHistoryOld';
