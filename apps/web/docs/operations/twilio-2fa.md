# Twilio Verify 2FA

MapAble can require SMS verification after a successful email/password check.
OAuth providers continue to use their own upstream security controls.

## Enable in Vercel

Set these variables in the Vercel project environment:

| Variable                    | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `TWILIO_2FA_ENABLED`        | Set to `true` to require SMS 2FA for email/password sign-in.   |
| `TWILIO_ACCOUNT_SID`        | Twilio Account SID.                                            |
| `TWILIO_AUTH_TOKEN`         | Twilio Auth Token or API credential secret with Verify access. |
| `TWILIO_VERIFY_SERVICE_SID` | Verify Service SID (`VA...`).                                  |

Redeploy after changing environment variables.

## User requirements

Users must have a phone number saved on their `User.phone` record. When 2FA is
enabled and a user without a phone number signs in, the login flow blocks with a
message asking them to contact support.

## Flow

1. User submits email and password.
2. Server validates the password.
3. Server sends a Twilio Verify SMS to the saved phone number.
4. User submits the code.
5. Server checks the code with Twilio and issues a short-lived internal sign-in
   token for NextAuth credentials sign-in.
