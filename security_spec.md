# Security Specification & Test Harness

## 1. Data Invariants
- `users`: Document ID must match `request.auth.uid`. A user can only write their own profile (`userId == request.auth.uid`).
- `groups`: Creator UID must match `request.auth.uid`. Only group admins or owners can update group metadata and member lists. Only members of a group can read group details or send messages.
- `messages`: Must belong to an existing group. Sender UID must match `request.auth.uid`. Only members of the parent group can read and post messages in that group.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. **Unauthenticated Read**: Attempting to read `/groups/{groupId}` without an auth session -> Expected: PERMISSION_DENIED.
2. **Identity Spoofing on User Create**: Authenticated as user A, creating `/users/{userB}` -> Expected: PERMISSION_DENIED.
3. **Unauthenticated Message Write**: Posting a message without auth -> Expected: PERMISSION_DENIED.
4. **Sender Impersonation**: User A posting message with `senderId: userB` -> Expected: PERMISSION_DENIED.
5. **Non-Member Message Write**: User not listed in `group.memberIds` attempting to post message -> Expected: PERMISSION_DENIED.
6. **Non-Member Message Read**: User not listed in `group.memberIds` attempting to read messages in a private group -> Expected: PERMISSION_DENIED.
7. **Member Privilege Escalation**: Regular member attempting to promote themselves to `adminIds` -> Expected: PERMISSION_DENIED.
8. **Malicious Group Creation**: Creating a group where `ownerId` is not `request.auth.uid` -> Expected: PERMISSION_DENIED.
9. **Oversized Field / DOS**: Attempting to write message with `text` exceeding 5000 characters -> Expected: PERMISSION_DENIED.
10. **Path Variable Injection**: Attempting to target document with invalid path characters or > 128 chars -> Expected: PERMISSION_DENIED.
11. **Immortal Field Modification**: Attempting to overwrite `ownerId` during group update -> Expected: PERMISSION_DENIED.
12. **Unauthorized Message Deletion**: Member deleting another member's message when not a group admin -> Expected: PERMISSION_DENIED.
