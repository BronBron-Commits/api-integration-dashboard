from flask import Flask, jsonify
from flask_cors import CORS
import requests
import time

app = Flask(__name__)
CORS(app)

def fetch_json(url, timeout=5):
    try:
        res = requests.get(url, timeout=timeout)
        res.raise_for_status()
        return {"ok": True, "data": res.json(), "error": None}
    except Exception as e:
        return {"ok": False, "data": None, "error": str(e)}

@app.get("/")
def root():
    return jsonify({"ok": True, "service": "api-integration-dashboard"})

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "time": time.strftime("%Y-%m-%d %H:%M:%S")
    })

@app.get("/api/weather")
def weather():
    result = fetch_json(
        "https://api.open-meteo.com/v1/forecast?latitude=39.9526&longitude=-75.1652&current=temperature_2m,wind_speed_10m,precipitation"
    )

    if not result["ok"]:
        return jsonify({
            "source": "open-meteo",
            "ok": False,
            "error": result["error"]
        }), 502

    current = result["data"].get("current", {})

    return jsonify({
        "source": "open-meteo",
        "ok": True,
        "location": "Philadelphia, PA",
        "temperatureF": round((current.get("temperature_2m", 0) * 9 / 5) + 32, 1),
        "windMph": round(current.get("wind_speed_10m", 0) * 0.621371, 1),
        "precipitation": current.get("precipitation", 0),
        "updatedAt": current.get("time")
    })

@app.get("/api/github-status")
def github_status():
    result = fetch_json("https://www.githubstatus.com/api/v2/status.json")

    if not result["ok"]:
        return jsonify({
            "source": "github-status",
            "ok": False,
            "error": result["error"]
        }), 502

    status = result["data"].get("status", {})

    return jsonify({
        "source": "github-status",
        "ok": True,
        "indicator": status.get("indicator"),
        "description": status.get("description"),
        "updatedAt": result["data"].get("page", {}).get("updated_at")
    })

@app.get("/api/ip-info")
def ip_info():
    result = fetch_json("https://ipapi.co/json/")

    if not result["ok"]:
        return jsonify({
            "source": "ipapi",
            "ok": False,
            "error": result["error"]
        }), 502

    data = result["data"]

    return jsonify({
        "source": "ipapi",
        "ok": True,
        "ip": data.get("ip"),
        "city": data.get("city"),
        "region": data.get("region"),
        "country": data.get("country_name"),
        "org": data.get("org")
    })

@app.get("/api/summary")
def summary():
    return jsonify({
        "ok": True,
        "services": [
            {"name": "Weather", "endpoint": "/api/weather"},
            {"name": "GitHub Status", "endpoint": "/api/github-status"},
            {"name": "IP Info", "endpoint": "/api/ip-info"}
        ]
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
