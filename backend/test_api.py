import requests
import json

def test_api():
    print("1. Testing /api/jobs/search ...")
    search_payload = {
        "keyword": "developpeur web",
        "max_pages": 1
    }
    try:
        res = requests.post("http://127.0.0.1:8000/api/jobs/search", json=search_payload)
        search_data = res.json()
        print(f"Found {search_data.get('count', 0)} jobs.")
        
        if search_data.get("count", 0) > 0:
            print("\n2. Testing /api/recommend with the first 2 jobs...")
            jobs_list = search_data["jobs"][:2]
            
            rec_payload = {
                "skills": ["python", "sql", "react", "javascript"],
                "jobs": jobs_list
            }
            
            rec_res = requests.post("http://127.0.0.1:8000/api/recommend", json=rec_payload)
            rec_data = rec_res.json()
            
            print("\nRecommendation Response (First Item):")
            print(json.dumps(rec_data[0] if rec_data else {}, indent=2))
        else:
            print("No jobs found, cannot test recommendation.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api()
