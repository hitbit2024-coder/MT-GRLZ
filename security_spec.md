# Firestore Security Specification - Webcam Talent Recruitment Hub

## Data Invariants
1. **Applicant Creation**: Anyone can submit a recruitment application (both guest and signed-in users), but they cannot query or read existing applications to prevent massive privacy/PII leaks.
2. **Access Control**: Administrative reads (`get`, `list`), updates, and deletes are strictly restricted to the Bootstrapped Admin (`hitbit2024@gmail.com`).
3. **Data Integrity**: 
   - Applications must contain a valid `email`, `fullName`, `displayName`, and an `age` of at least 18.
   - Any new application must default to `status: 'new'`. Only administrators can advance or edit the status.
   - Timestamps `createdAt` and `updatedAt` must match `request.time`.
   - String sizes and object sizes must be bounded to prevent wallet denial-of-service (DoS) attacks.

## The Dirty Dozen Payloads
To assure absolute zero-trust verification, the following 12 malicious payloads must be blocked and return `PERMISSION_DENIED`:

1. **Self-Approve Status**: A guest attempting to submit a new application with `"status": "accepted"`.
2. **PII Lease Leak (Get)**: An unauthorized visitor attempting to read (`get`) an existing applicant doc containing names and emails.
3. **Admin Email Spoof (No Verification)**: A user with email `hitbit2024@gmail.com` but `email_verified == false` trying to list applicants.
4. **Credential Poisoning (Unbounded bio)**: Attempting to create an applicant document with a `15MB` string bio.
5. **ID Poisoning Attack**: Attempting to create a document with an ID exceeding 128 characters or containing illegal path symbols.
6. **Timeline Hijacking**: Attempting to submit a `createdAt` timestamp set in the future (e.g., year 2030) or spoofed, rather than `request.time`.
7. **Social Override**: An unauthenticated user attempting to `update` another applicant's record.
8. **Malicious Administrative Note Injection**: An applicant trying to inject positive or fake evaluation comments (`"notes": "Excellent candidate! Hire immediately."`) on submission.
9. **Minor Bypassing**: Submitting a registration where `"age": 15` to bypass the adult content legal age requirement (under 18).
10. **Shadow Field Attack**: Creating an applicant document with illegal, unregistered ghost keys (`"isVerifiedAdmin": true`).
11. **Mass System Deletion**: An unauthorized user attempting to bulk purge (`delete`) applications from the database.
12. **Bypassing App Limits via Empty Keys**: Attempting to save an incomplete form missing mandatory details like email or age.
