from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


def revoke_refresh_token(refresh_token: str) -> None:
    """Revoke (blacklist) a refresh token. Idempotent: an expired, already revoked or garbage token
    is ignored (the caller wanted it gone), so nothing says whether the token was valid."""
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        pass
