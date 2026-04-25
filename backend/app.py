from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/")
def root():
    return "Backend running"

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Backend connected"})

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5050)