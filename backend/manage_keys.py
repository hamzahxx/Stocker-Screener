import sys
from api_key_manager import generate_api_key, revoke_api_key, activate_api_key, list_api_keys

if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "help"

    if command == "generate":
        owner = sys.argv[2] if len(sys.argv) > 2 else "default"
        expires = int(sys.argv[3]) if len(sys.argv) > 3 else None
        generate_api_key(owner, expires_days=expires)

    elif command == "revoke":
        prefix = sys.argv[2]
        revoke_api_key(prefix)

    elif command == "reactivate":
        prefix = sys.argv[2]
        expires = int(sys.argv[3]) if len(sys.argv) > 3 else None
        activate_api_key(prefix, expires_days=expires)

    elif command == "list":
        keys = list_api_keys()
        for k in keys:
            print(k)

    else:
        print("Usage:")
        print("  python manage_keys.py generate <owner> [expires_days]")
        print("  python manage_keys.py revoke <key_prefix>")
        print("  python manage_keys.py list")