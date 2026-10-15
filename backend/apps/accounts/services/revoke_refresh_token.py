from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken


def revoke_refresh_token(refresh_token: str) -> None:
    try:
        # simplejwt annotates `token` as `Token | None`, but it accepts (and here receives) the encoded string.
        RefreshToken(refresh_token).blacklist()  # type: ignore[arg-type]
    except TokenError:
        pass
