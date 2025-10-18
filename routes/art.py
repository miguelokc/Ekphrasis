from flask import Blueprint, jsonify
art_bp = Blueprint("art", __name__)

@art_bp.route("/")
def get_art():
    return jsonify({"title": "Starry Night", "artist": "Van Gogh"})