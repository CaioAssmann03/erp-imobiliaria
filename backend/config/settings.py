import os
from datetime import timedelta
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent

DEBUG = os.environ.get("DEBUG", "true").lower() == "true"

# The insecure fallback exists only for local development; production must provide SECRET_KEY.
SECRET_KEY = os.environ.get("SECRET_KEY") or (
    "django-insecure-change-me-in-production" if DEBUG else None
)
if SECRET_KEY is None:
    raise ImproperlyConfigured("SECRET_KEY must be set when DEBUG is false.")

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")



INSTALLED_APPS = [
    "unfold",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "drf_spectacular",
    "corsheaders",
    "django_filters",
    "auditlog",
    "apps.accounts",
    "apps.core",
    "apps.persons",
    "apps.condominiums",
    "apps.finance",
    "apps.billing",
    "apps.rentals",
    "apps.sales",
]

MIDDLEWARE = [
    # First: the host's health probe is answered before the HTTPS redirect and the host check.
    "apps.core.api.middleware.HealthCheckMiddleware",
    "django.middleware.security.SecurityMiddleware",
    # Serve os arquivos estáticos (admin) em produção, sem nginx/CDN.
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "auditlog.middleware.AuditlogMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database: PostgreSQL only (trigram indexes need the pg_trgm extension).
# Reads the POSTGRES_* variables (same names as the docker-compose postgres service).

if not os.environ.get("POSTGRES_DB"):
    raise ImproperlyConfigured(
        "POSTGRES_DB is not set. The project runs on PostgreSQL only; "
        "see docs/architecture/operations.md."
    )

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ["POSTGRES_DB"],
        "USER": os.environ.get("POSTGRES_USER", "postgres"),
        "PASSWORD": os.environ.get("POSTGRES_PASSWORD", "postgres"),
        "HOST": os.environ.get("POSTGRES_HOST", "db"),
        "PORT": os.environ.get("POSTGRES_PORT", "5432"),
    }
}


AUTH_USER_MODEL = "accounts.User"

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]



LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True



STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"



REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "apps.core.api.exception_handler.api_exception_handler",
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "apps.accounts.authentication.AuditedJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "apps.core.api.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_THROTTLE_RATES": {
        "auth_login": "5/min",
        "auth_refresh": "30/min",
        "auth_logout": "30/min",
    },
}

# Change audit trail (spec 005): the client address is neither trusted (the header can be forged)
# nor needed, and it is personal data; the actor and the changed fields are what matters.
AUDITLOG_DISABLE_REMOTE_ADDR = True

SPECTACULAR_SETTINGS = {
    "TITLE": "ERP Imobiliária API",
    "DESCRIPTION": "API do sistema de administração de condomínios, locações, vendas e financeiro.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # Two models have a `kind` choice: name them, or the client gets hash-suffixed enum names.
    "ENUM_NAME_OVERRIDES": {
        "AccountKindEnum": "apps.finance.models.AccountKind",
        "EntryKindEnum": "apps.finance.models.CurrentAccountEntry.Kind",
    },
    "POSTPROCESSING_HOOKS": [
        "drf_spectacular.hooks.postprocess_schema_enums",
        "apps.core.api.schema.add_error_contract",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}

# Atrás de proxy HTTPS (Render): confia no cabeçalho do proxy para saber que a requisição
# é segura. Sem isso o login do admin falha por CSRF (origem https x requisição http).
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
# Plain HTTP is redirected to HTTPS outside development; HSTS starts short (an hour, no
# subdomains, no preload) so a wrong domain or certificate cannot trap browsers. Raise it to a year
# once the final domain exists. The health probe is answered before the redirect (HealthCheckMiddleware).
def _env_bool(name: str, default: bool) -> bool:
    value = os.environ.get(name)
    return default if value is None else value.strip().lower() in ("1", "true", "yes")


SECURE_SSL_REDIRECT = _env_bool("SECURE_SSL_REDIRECT", default=not DEBUG)
SECURE_HSTS_SECONDS = int(os.environ.get("SECURE_HSTS_SECONDS", "0" if DEBUG else "3600"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Where the Django Admin lives. The default is the well-known path; production sets a non-obvious one
# (obscurity only: strong passwords and the login rate limit are the real protection).
_admin_url = os.environ.get("ADMIN_URL", "admin/").strip()
if not _admin_url.strip("/") or "://" in _admin_url or ".." in _admin_url:
    raise ImproperlyConfigured("ADMIN_URL must be a relative path such as 'admin/'.")
ADMIN_URL = _admin_url.strip("/") + "/"

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
_LOCAL_HOSTS = {"localhost", "127.0.0.1", "backend"}
CSRF_TRUSTED_ORIGINS = [
    f"https://{host.strip()}"
    for host in ALLOWED_HOSTS
    if host.strip() and host.strip() not in _LOCAL_HOSTS
]

# CORS — libera especificamente o(s) domínio(s) do frontend Next.js
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000"
).split(",")

# Shared cache (Redis): the login rate limit must hold across every gunicorn worker.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.redis.RedisCache",
        "LOCATION": os.environ.get("REDIS_URL", "redis://redis:6379/0"),
    }
}

# Secret shared with the Next server (spec 007): only a request that carries it may tell Django the
# real client address (`X-Forwarded-For`), which the login rate limit uses.
INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "")
if not INTERNAL_API_KEY and not DEBUG:
    raise ImproperlyConfigured("INTERNAL_API_KEY must be set when DEBUG is false.")

# Bucket of the payment receipts (spec 018): Cloudflare R2, S3-compatible. Credentials come only from the
# environment; with any of them empty the receipt endpoints answer 503 and nothing else is affected.
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME", "")
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", "")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "auto")

CELERY_BROKER_URL = os.environ.get("REDIS_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("REDIS_URL", "redis://redis:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

UNFOLD = {
    "SITE_TITLE": "ERP Imobiliária",
    "SITE_HEADER": "ERP Imobiliária",
}
