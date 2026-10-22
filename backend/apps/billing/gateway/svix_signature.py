import base64
import hashlib
import hmac
import time

TOLERANCE_SECONDS = 300


def verify_svix_signature(secret: str, message_id: str, timestamp: str, signatures: str, body: bytes) -> bool:
    """Check a Resend (Svix) webhook: HMAC-SHA256 of `id.timestamp.body` with the decoded `whsec_` secret.

    The timestamp must be recent (a replayed old request is refused); `signatures` is a space-separated list of `v1,<base64>`.
    """
    if not (secret and message_id and timestamp and signatures):
        return False
    try:
        if abs(time.time() - int(timestamp)) > TOLERANCE_SECONDS:
            return False
        key = base64.b64decode(secret.removeprefix("whsec_"))
    except ValueError:
        return False
    signed = f"{message_id}.{timestamp}.".encode() + body
    expected = base64.b64encode(hmac.new(key, signed, hashlib.sha256).digest()).decode()
    return any(
        hmac.compare_digest(expected, candidate.removeprefix("v1,")) for candidate in signatures.split() if candidate.startswith("v1,")
    )
