from rest_framework import serializers


class LogoutSerializer(serializers.Serializer[dict[str, str]]):
    refresh = serializers.CharField(help_text="The refresh token to revoke.")
