export function shouldSkipProfileRefresh(
  event: string,
  currentUserId: string | null | undefined,
  nextUserId: string | null,
) {
  return event === 'TOKEN_REFRESHED' && nextUserId !== null && currentUserId === nextUserId;
}
