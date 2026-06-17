from flask import Flask, jsonify, render_template, request
import xml.etree.ElementTree as ET
import urllib.request
import re
import time

app = Flask(__name__)

# Cache dictionary to avoid hitting the GCP server on every single refresh/page load
cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION = 300  # 5 minutes

def parse_feed_content(content_html):
    """
    Parses the CDATA HTML content of a release note entry.
    GCP release notes group all updates of a single day under one entry, 
    with different items separated by <h3>Category</h3> tags (e.g., <h3>Feature</h3>).
    This function splits them so we can show and select individual updates.
    """
    matches = list(re.finditer(r'<h3>(.*?)</h3>', content_html, re.IGNORECASE))
    if not matches:
        return [{'category': 'Update', 'content': content_html.strip()}]
    
    items = []
    for i, match in enumerate(matches):
        category = match.group(1).strip()
        start_idx = match.end()
        end_idx = matches[i+1].start() if i + 1 < len(matches) else len(content_html)
        item_content = content_html[start_idx:end_idx].strip()
        items.append({
            'category': category,
            'content': item_content
        })
    return items

def get_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Antigravity/1.0'}
    )
    # 10 second timeout for responsiveness
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_data = response.read()
    
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    parsed_items = []
    
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        date_str = title.text if title is not None else "Unknown Date"
        
        entry_id = entry.find('atom:id', ns)
        base_id = entry_id.text if entry_id is not None else date_str.replace(" ", "_")
        # Sanitize base_id to be safe for HTML IDs/selectors
        base_id = re.sub(r'[^a-zA-Z0-9_\-#]', '_', base_id)
        
        updated = entry.find('atom:updated', ns)
        updated_iso = updated.text if updated is not None else ""
        
        link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href', '') if link_elem is not None else ''
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ""
        
        sections = parse_feed_content(content_html)
        category_counts = {}
        for idx, sec in enumerate(sections):
            cat = sec['category']
            cat_key = cat.lower().replace(" ", "_")
            category_counts[cat_key] = category_counts.get(cat_key, -1) + 1
            sec_idx = category_counts[cat_key]
            
            parsed_items.append({
                'id': f"{base_id}_{cat_key}_{sec_idx}",
                'date': date_str,
                'updated_iso': updated_iso,
                'link': link,
                'category': cat,
                'content': sec['content']
            })
            
    return parsed_items

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def api_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if force_refresh or cache["data"] is None or (now - cache["last_fetched"]) > CACHE_DURATION:
        try:
            cache["data"] = get_release_notes()
            cache["last_fetched"] = now
        except Exception as e:
            # If fetching fails, return cached data as fallback if it exists, otherwise return error
            if cache["data"] is not None:
                return jsonify({
                    "success": False,
                    "error": f"Failed to fetch fresh feed: {str(e)}. Displaying cached data.",
                    "notes": cache["data"],
                    "cached_at": cache["last_fetched"],
                    "is_fallback": True
                }), 200
            return jsonify({"success": False, "error": f"Failed to fetch feed: {str(e)}"}), 500
            
    return jsonify({
        "success": True,
        "notes": cache["data"],
        "cached_at": cache["last_fetched"],
        "is_fallback": False
    })

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
