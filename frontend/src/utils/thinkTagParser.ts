/**
 * Result of parsing think tags from content.
 */
export interface ThinkTagResult {
  /** Array of thinking content extracted from <think> tags */
  thinkingBlocks: string[];
  /** The remaining content with think tags removed */
  remainingContent: string;
}

/**
 * Parses <think>...</think> tags from message content.
 *
 * Supports multiple think blocks in a single message.
 * Content outside of think tags is returned as remainingContent.
 *
 * @param content - The message content string that may contain <think> tags
 * @returns An object with thinkingBlocks array and remainingContent string
 */
export function parseThinkTags(content: string): ThinkTagResult {
  const thinkingBlocks: string[] = [];

  // First pass: collect all think tag contents
  const collectRegex = /<think>([\s\S]*?)<\/think>/g;
  let match: RegExpExecArray | null;
  while ((match = collectRegex.exec(content)) !== null) {
    const thinkContent = match[1].trim();
    if (thinkContent) {
      thinkingBlocks.push(thinkContent);
    }
  }

  // Second pass: remove all think tags (fresh regex instance to avoid lastIndex issues)
  const remainingContent = content
    .replace(/<think>[\s\S]*?<\/think>/g, '')
    .trim();

  return { thinkingBlocks, remainingContent };
}
