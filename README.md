# BigQuery Release Pulse 🚀

BigQuery Release Pulse is an interactive, modern, and dark-themed web dashboard that fetches Google Cloud BigQuery release notes and allows you to easily filter, search, and share updates on X (Twitter).

Built with **Python Flask** on the backend and **Vanilla HTML, CSS, and JS** on the frontend, this app features a sleek Matte Obsidian and Amber Gold console-style theme.

---

## ✨ Features

- **Granular Feed Parsing**: Automatically fetches and segments the official Google Cloud BigQuery Atom XML feed, separating multi-item daily logs into singular, clean cards.
- **Advanced Real-Time Filtering**: Instant client-side search indexing and category filters (Features, Announcements, Changes, Deprecations, and Fixes) with zero reload latency.
- **Single & Multi-Select Tweet Compiler**:
  - Click **Tweet This** on any single update card to open a pre-formatted tweet.
  - Check multiple checkboxes to activate a sliding bottom drawer, allowing you to compile and summarize multiple updates into one single digest.
- **Smart Twitter Auto-Optimiser**: Dynamically compresses your tweet text, replacing lengthy words and collapsing spacing to fit under Twitter's 280-character limit while keeping target URLs intact.
- **Caching & Fallbacks**: Utilizes a 5-minute server-side memory cache to reduce network latency. Automatically falls back to stale cache data with user-facing warnings if the GCP feed server goes offline.
- **Responsive Layout**: Two-column dashboard design (sticky sidebar control panel on desktop, scrollable feed on the right) that fits mobile screens.
- **Theme Switcher Toggle**: A header control switch that swaps between Matte Obsidian dark mode and slate light mode instantly, with LocalStorage persistence.
- **Collapsible Mobile Panel**: Prevents scroll fatigue on mobile by collapsing sidebar controls into an expander panel.
- **Handy Utility & UX Helpers**:
  - **Copy Text**: Copies a formatted plain-text description (date, category, content, and links) in one click.
  - **Copy Code**: Hover copier button on code blocks (`pre` tags) to instantly copy code snippets.
  - **Export to CSV**: Download the *currently filtered list* of updates as a UTF-8 BOM CSV spreadsheet.
  - **Keyword Highlighting**: Glowing amber markers highlight search matches inside text segments (avoiding HTML anchor/code tags).
  - **Back to Top Scroll**: A floating circle button appearing after scrolling down 400px to quickly snap back to top controls.
  - **Keyboard Shortcut (`/`)**: Pressing `/` instantly focuses and selects the search input.
  - **Drawer Character Estimator**: Displays a warning indicator in the bottom drawer if the selection length exceeds 280 characters.

---

## 📂 Project Structure

```text
bigquery-release-notes/
│
├── app.py                 # Flask server (routing, caching, XML parsing logic)
├── .gitignore             # Standard git exclusions (cache, virtual envs, logs)
├── README.md              # Project documentation
│
├── static/
│   ├── app.js             # Client-side filtering, selection drawer, and Tweet builder
│   └── style.css          # CSS Grid layout, matte glassmorphism styling, and variables
│
└── templates/
    └── index.html         # Main dashboard markup, modals, and templates
```

---

## ⚡ Prerequisites

To run this application locally, you will need:
- **Python 3.8+**
- **pip** (Python package installer)

Install the required Python dependencies:
```bash
pip install flask requests
```

---

## 🚀 Getting Started

1. **Clone or navigate to the directory**:
   ```bash
   cd C:\Users\dwiky\bigquery-release-notes
   ```

2. **Start the Flask server**:
   ```bash
   python app.py
   ```

3. **Open the application**:
   Navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## 📝 How it Works

### Server-Side
The backend ([app.py](file:///C:/Users/dwiky/bigquery-release-notes/app.py)) queries the GCP feeds URL, parses the XML document into standard nodes, and uses regular expressions to find `<h3>` headings inside the CDATA content block. Each subsection becomes its own structured JSON record.

### Client-Side
The frontend Javascript ([static/app.js](file:///C:/Users/dwiky/bigquery-release-notes/static/app.js)) fetches the parsed JSON payload, runs instant query lookups, updates check boxes, aggregates selected cards into a compilation modal, and uses Twitter's web intents to launch the share window.

---

## 🎨 Styling Details
The interface utilizes a custom dark theme defined in [static/style.css](file:///C:/Users/dwiky/bigquery-release-notes/static/style.css):
- **Primary Background**: Matte Obsidian Black (`#08080a`)
- **Card Background**: Semi-transparent Slate (`rgba(22, 22, 26, 0.75)`)
- **Accents**: Warm Amber Gold (`#f59e0b`) & Mint Emerald (`#10b981`)
- **Typography**: `Outfit` (Headings) and `Inter` (Body Text) imported from Google Fonts.
- **Icons**: Lucide Icons loaded via CDN.

---

## 📄 License
This project is open-source and available under the MIT License.
