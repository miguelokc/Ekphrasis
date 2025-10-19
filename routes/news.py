print("Newsapi loaded")
from flask import Blueprint, jsonify
from newsapi import NewsApiClient
import os
from dotenv import load_dotenv
load_dotenv()


news_bp = Blueprint("news", __name__)
newsapi = NewsApiClient(api_key=os.getenv("NEWS_API_KEY"))

# This is main helper function, grabs news data, reterns dict to be used directly by llm
def fetch_news_data(max_articles=5):
    """
    Returns Python dict/list of top recent news articles.
    Can be used by LLM or other backend logic.
    """
    articles = newsapi.get_top_headlines(
        language='en',
        country='us',
        category='general',
        page_size=max_articles
    ).get("articles", [])

    return [
        {
            "title": a.get("title"),
            "source": a.get("source", {}).get("name"),
            "description": a.get("description")
        }
        for a in articles
    ]

#This function is for the front end, converts new data dict into json
@news_bp.route("/")
def get_news():
    """
    HTTP endpoint for frontend. Calls the helper function,
    then converts the Python dict/list to JSON.
    """
    articles = fetch_news_data()
    if articles:
        return jsonify(articles)  # converts Python dict/list -> JSON
    return jsonify({"error": "No top news found."}), 404
