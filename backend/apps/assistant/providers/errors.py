class ProviderError(Exception):
    """A provider could not answer. The message never carries the question, the answer or the key (only e.g. "HTTP 429")."""
