from flask import Flask, jsonify
from flask_cors import CORS  
from routes.weather import weather_bp
from routes.art import art_bp
from routes.news import news_bp

app = Flask(__name__)
CORS(app, resources={
    r"/api/*":  {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]},
    r"/news/*": {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]},
    r"/art/*":  {"origins": ["http://127.0.0.1:5500", "http://localhost:5500"]},
})

app.register_blueprint(weather_bp, url_prefix="/api/weather")
app.register_blueprint(art_bp, url_prefix="/art")
app.register_blueprint(news_bp, url_prefix="/news/")
@app.route('/')
def home():
    return jsonify({"message": "EkphrAIsis API is running!"})

if __name__ == "__main__":
    app.run(debug=True)
