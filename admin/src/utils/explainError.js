// Translate Firebase/Firestore errors into messages an admin can act on.
export default function explainError(e, action = 'save') {
  const code = e?.code || '';
  if (code.includes('permission-denied')) {
    return `Permission denied — your account role is not allowed to ${action} this. ` +
      'Creating groups, deleting events, and managing codes require an admin account ' +
      '(check the role badge at the top right).';
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'Network error — check your internet connection and try again.';
  }
  if (code.includes('not-found')) {
    return 'Document not found — it may have been deleted. Refresh the page.';
  }
  if (code.includes('failed-precondition')) {
    return 'Query needs an index — open the browser console for the index creation link.';
  }
  if (code.includes('unauthenticated')) {
    return 'Session expired — sign out and sign in again.';
  }
  return e?.message || 'Unknown error. Check the browser console for details.';
}
