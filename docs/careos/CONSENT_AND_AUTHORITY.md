# Consent and authority

CareOS builds context from NextAuth, participant profiles, permissions and
existing consent records. It does not accept participant IDs, roles,
permissions, authority or consent assertions from request JSON.

Consent is purpose-specific and request-scoped. Accessibility-profile use is
off by default. The UI explains the data, reason, CareOS function, storage
behaviour and non-AI alternative. Delegates have no implied booking authority;
they must have explicit existing consent and are read-only in this increment.
