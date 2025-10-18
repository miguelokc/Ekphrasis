from flask import Flask, jsonify
from routes.weather import weather_bp
from routes.art import art_bp

app = Flask(__name__)

app.register_blueprint(weather_bp, url_prefix="/api/weather")
app.register_blueprint(art_bp, url_prefix="/art")

@app.route('/')
def home():
    return jsonify({"message": "EkphrAIsis API is running!"})

if __name__ == "__main__":
    app.run(debug=True)
