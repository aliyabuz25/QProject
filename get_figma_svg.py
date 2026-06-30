import requests
import json
import os

token = os.environ.get("FIGMA_TOKEN")
if not token:
    raise RuntimeError("Set FIGMA_TOKEN before running this script.")
headers = {"X-Figma-Token": token}
file_key = "caVV6rxU4vHZjILKNKMY5F"
node_id = "89:2217"

# 1. Try to get SVG URL from images API
url = f"https://api.figma.com/v1/images/{file_key}?ids={node_id}&format=svg"
resp = requests.get(url, headers=headers)
print("Images API response:", resp.status_code)
print(resp.text)

# 2. Get node details from files/nodes API to inspect vector path children
url_nodes = f"https://api.figma.com/v1/files/{file_key}/nodes?ids={node_id}"
resp_nodes = requests.get(url_nodes, headers=headers)
print("Nodes API response:", resp_nodes.status_code)
# Print a formatted preview of the JSON structure
try:
    data = resp_nodes.json()
    print(json.dumps(data, indent=2)[:2000])
except Exception as e:
    print("Failed to decode nodes JSON:", e)
