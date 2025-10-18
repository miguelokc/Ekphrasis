from flask import Blueprint, jsonify
weather_bp = Blueprint("weather", __name__)

@weather_bp.route("/<city>")
def get_weather(city):
    return jsonify({"city": city, "temp": 25, "condition": "Sunny"})