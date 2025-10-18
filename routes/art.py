from flask import Blueprint, jsonify
import requests


art_bp = Blueprint("art", __name__)

def fetch_art_data(query):
    try:
        search_url = f"https://collectionapi.metmuseum.org/public/collection/v1/search?q={query}"
        res = requests.get(search_url)
        res.raise_for_status()
        data = res.json()
        object_ids = data.get("objectIDs", [])

        if not object_ids:
            return None

        for oid in object_ids[:1000]:  # try first 10 to increase chances
            obj_url = f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}"
            obj_res = requests.get(obj_url)
            obj_res.raise_for_status()
            obj_data = obj_res.json()

            if obj_data.get("isPublicDomain") and obj_data.get("primaryImageSmall"):
                return {
                    "title": obj_data.get("title"),
                    "artist": obj_data.get("artistDisplayName"),
                    "date": obj_data.get("objectDate"),
                    "isPublicDomain": obj_data.get("isPublicDomain"),
                    "primaryImage": obj_data.get("primaryImage"),
                    "primaryImageSmall": obj_data.get("primaryImageSmall"),
                }

        return None

    except requests.exceptions.RequestException as e:
        print(f"Error fetching art: {e}")
        return None


# Route for the frontend (returns as JSON)
@art_bp.route("/<query>")
def get_art(query):
    art_info = fetch_art_data(query)
    if art_info:
        return jsonify(art_info)
    else:
        return jsonify({"erorr": "No suitable artwork has been found."}), 404