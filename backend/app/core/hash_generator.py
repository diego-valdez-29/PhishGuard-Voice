import hashlib
from typing import Union
import numpy as np

def generate_sha256_hash(data: Union[bytes, bytearray, np.ndarray]) -> str:
    """
    Computes immutable cryptographic SHA-256 hash for forensic auditability.
    Accepts raw audio bytes or a NumPy float/int array.
    """
    if isinstance(data, np.ndarray):
        raw_bytes = data.tobytes()
    elif isinstance(data, (bytes, bytearray)):
        raw_bytes = data
    else:
        raw_bytes = str(data).encode("utf-8")

    hasher = hashlib.sha256()
    hasher.update(raw_bytes)
    return hasher.hexdigest()

def hash_file_stream(file_bytes: bytes) -> str:
    """Computes SHA-256 hash for uploaded file stream."""
    return hashlib.sha256(file_bytes).hexdigest()
