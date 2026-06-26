# Security Specification & Threat Model - OrdoMed TN 🇹🇳

This document details the Zero-Trust security rules, data invariants, and access control models for the OrdoMed TN application.

## 1. Core Data Invariants

1. **Strict Doctor Isolation**: Every doctor has an isolated workspace. A doctor can only read, write, or query their own profile config, patient database, prescriptions, and prescription lines.
2. **Secretary Privilege Limitation**: A secretary is restricted to patient management only. They can read, create, and update patients belonging to their employing doctor. They are strictly blocked from reading, writing, or querying prescriptions or prescription items, and cannot modify the doctor's configuration.
3. **Immutability of Key Ownership**: Fields like `doctorUid` or `uid` on any resource cannot be modified after creation, preventing spoofing or hijacking.
4. **Data Validation Integrity**: Every document creation and update must adhere to strict schemas.

---

## 2. The "Dirty Dozen" Threat Payloads (Blocked Vectors)

The following 12 specific exploit attempts must return `PERMISSION_DENIED` under all conditions:

1. **Doctor Data Harvesting**: A doctor attempts to read another doctor's config document `/doctorConfigs/other-doc-uid`.
2. **Secretary Privilege Escalation (Read Prescriptions)**: A secretary tries to read prescriptions at `/prescriptions/some-prescription-id`.
3. **Secretary Privilege Escalation (Create Prescriptions)**: A secretary tries to write a prescription to `/prescriptions/new-id`.
4. **Impersonate Doctor on Patient Creation**: A secretary attempts to create a patient record with a `doctorUid` pointing to a different doctor than their employer.
5. **Hijack Doctor Account**: An unauthenticated user attempts to write to `/users/any-uid`.
6. **Self-Assign Doctor Role**: A user registers as `role: "doctor"` but attempts to bypass system constraints by editing their role afterward.
7. **Cross-Doctor Patient Modification**: Doctor A attempts to update a patient belonging to Doctor B.
8. **Orphaned Prescription Line Injection**: A doctor attempts to write a prescription line with an invalid or foreign `doctorUid` or `prescriptionId` that they do not own.
9. **Tamper with Signed Prescription**: A doctor attempts to modify or delete a prescription that has already reached the terminal status `"signed"`.
10. **Bypass Schema Constraints on Patient Creation**: A user attempts to create a patient document with a 1MB string in the `name_first` field.
11. **Spoofed Ownership on Profile Creation**: A user logs in with UID `A` but attempts to create a user profile under document ID `B`.
12. **Unauthenticated Read of All Profiles**: An anonymous guest attempts to list or query `/users`.

---

## 3. Recommended Firestore Rules Structure

The rules will enforce:
- Exact path variable validation using `isValidId()`.
- Validations of schema in `isValidUser()`, `isValidDoctorConfig()`, `isValidPatient()`, `isValidPrescription()`, `isValidPrescriptionItem()`.
- Checking roles and relations using `get(/databases/$(database)/documents/users/$(request.auth.uid))`.
