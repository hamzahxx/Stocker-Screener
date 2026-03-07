from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader
from api_key_manager import validate_api_key

api_key_header = APIKeyHeader(name="X-API-Key")

def verify_api_key(api_key: str = Security(api_key_header)):
    if not validate_api_key(api_key):
        raise HTTPException(status_code=403, detail="Invalid or expired API key")
    return api_key