import os
import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def generate_api_key(owner: str, expires_days: Optional[int] = None) -> str:
    """Generate a new API key. Returns the raw key — shown only once."""
    raw_key = f"sk-{secrets.token_urlsafe(32)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    key_prefix = raw_key[:10]

    data = {
        "key_hash": key_hash,
        "key_prefix": key_prefix,
        "owner": owner,
    }

    if expires_days:
        expires_at = (datetime.utcnow() + timedelta(days=expires_days)).isoformat()
        data["expires_at"] = expires_at

    supabase.table("api_keys").insert(data).execute()

    print(f"[+] API key generated for '{owner}':")
    print(f"    {raw_key}")
    print("    ⚠️  Save this key — it will NOT be shown again.")
    return raw_key

def validate_api_key(raw_key: str) -> bool:
    """Validate an API key. Returns True if valid and active."""
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

    response = supabase.table("api_keys")\
        .select("*")\
        .eq("key_hash", key_hash)\
        .eq("is_active", True)\
        .execute()
    
    if not response.data:
        return False
    
    row = response.data[0]

    if row.get("expires_at"):
        expires_at = datetime.fromisoformat(row["expires_at"])
        if datetime.utcnow() > expires_at:
            return False
        
    supabase.table("api_keys")\
        .update({"last_used": datetime.utcnow().isoformat()})\
        .eq("key_hash", key_hash)\
        .execute()

    return True

def revoke_api_key(key_prefix: str):
    """Revoke a key by its prefix."""
    supabase.table("api_keys")\
        .update({"is_active": False})\
        .eq("key_prefix", key_prefix)\
        .execute()
    print(f"[!] Key with prefix '{key_prefix}' has been revoked.")


def list_api_keys():
    """List all API keys without exposing the actual key."""
    response = supabase.table("api_keys")\
        .select("key_prefix, owner, created_at, expires_at, is_active, last_used")\
        .execute()
    return response.data