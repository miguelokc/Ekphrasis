import requests

url = "https://collectionapi.metmuseum.org/public/collection/v1/search?q=Rembrandt"
try:
    res = requests.get(url)
    res.raise_for_status()
    data = res.json()
    print(data)
except requests.exceptions.RequestException as e:
    print("Error:", e)