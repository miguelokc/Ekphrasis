from flask import Blueprint, jsonify
import os, requests
from dotenv import load_dotenv

load_dotenv()

# This function is for the LLM (returns as dict)
def fetch_weather_data(city): 
    # Makes the requests call and returns the dict
    data = requests.get(...).json()
    return {
        "city": data.get("name"),
        "temperature": data["main"].get("temp"),
        "condition": data["weather"][0].get("description")
    }

weather_bp = Blueprint("weather", __name__)

#This funtion is for the frontend (returns as response object)
@weather_bp.route("/<city>")
def get_weather(city):
    api_key = os.getenv("WEATHER_API_KEY")
    if not api_key:
        return jsonify({"error": "API key not found"}), 500

    url = f"http://api.openweathermap.org/data/2.5/weather?q={city}&appid={api_key}&units=imperial"
    try:
        res = requests.get(url)
        res.raise_for_status()  #Raises an error if status code is not 200, (Went wrong)
        data = res.json()
       #Send data back to frontend

        output = {
            "city": data.get("name"),
            "temperature": data["main"].get("temp"),
            "condition": data["weather"][0].get("description")
        }
        return jsonify(output)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500

    