from dotenv import load_dotenv
load_dotenv()

from huggingface_hub import InferenceClient

client = InferenceClient(token="YOUR_HUGGINGFACE_API_KEY")

print(client.list_models())