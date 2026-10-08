from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


def revoke_refresh_token(refresh_token: str) -> None:
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        pass
