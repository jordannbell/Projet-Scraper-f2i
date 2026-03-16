import requests
from bs4 import BeautifulSoup
import json

def test_hellowork():
    url = "https://www.hellowork.com/fr-fr/emploi/recherche.html?k=Data+Analyst"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    }
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        # Find all h3 tags which contain the job titles
        titles = soup.find_all('h3')
        
        for t in titles[:5]:
            # The closest link might be the parent or sibling
            parent_a = t.find_parent('a')
            
            # The company is usually nearby, maybe in a span or div
            company_elem = None
            if parent_a:
                company_elem = parent_a.find_next_sibling('div') or t.find_next_sibling()
                
            results.append({
                "h3_text": t.get_text(strip=True),
                "has_parent_a": parent_a is not None,
                "parent_a_href": parent_a['href'] if parent_a and parent_a.has_attr('href') else None,
            })
            
        with open("hellowork_extract.json", "w", encoding="utf-8") as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    test_hellowork()
