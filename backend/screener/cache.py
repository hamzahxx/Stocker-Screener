import redis
import pickle
import os
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv

load_dotenv()

IST = pytz.timezone("Asia/Kolkata")

PRIORITY_INDEXES = [
    "NIFTY 200",
    "NIFTY MIDCAP 150",
    "NIFTY SMALLCAP 250"
]

_redis_client = None

def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL")
        if redis_url:
            _redis_client = redis.from_url(redis_url, decode_responses=False)
            print("[cache] Connected to cloud Redis")
        else:
            _redis_client = redis.Redis(host="localhost", port=6379, db=0)
            print("[cache] Connected to local Redis")

    return _redis_client

def _seconds_until_next_refresh() -> int:
    now = datetime.now(IST)
    next_refresh = now.replace(hour=9, minute=15, second=0, microsecond=0)

    if now >= next_refresh:
        next_refresh += timedelta(days=1)

    if next_refresh.weekday() == 5:
        next_refresh += timedelta(days=2)
    elif next_refresh.weekday() == 6:
        next_refresh += timedelta(days=1)

    seconds = int((next_refresh - now).total_seconds())
    print(f"[cache] TTL -> {seconds}s (expires {next_refresh.strftime('%Y-%m-%d %H:%M')} IST)")
    return seconds

def cache_get(key: str):
    try:
        raw = get_redis().get(key)
        if raw:
            print(f"[cache] HIT -> {key}")
            return pickle.loads(raw)
        print(f"[cache] MISS -> {key}")
        return None
    except Exception as e:
        print(f"[cache] ERROR on GET [{key}]: {e}")
        return None
    
def cache_set(key: str, value):
    try:
        ttl = _seconds_until_next_refresh()
        get_redis().setex(key, ttl, pickle.dumps(value))
        print(f"[cache] SET -> {key} | TTL: {ttl}s")
    except Exception as e:
        print(f"[cache] ERROR on SET [{key}]: {e}")