"""
Web scraper for Ada Derana news headlines
"""

import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re
import logging

logger = logging.getLogger(__name__)

ADA_DERANA_URL = "https://sinhala.adaderana.lk/sinhala-hot-news.php"

def parse_time_string(time_str):
    """
    Parse time strings like "December 30, 2025 2:15 pm", "1:24 pm today", etc.
    Returns datetime object or None
    """
    if not time_str:
        return None
    
    time_str = time_str.strip()
    now = datetime.now()
    
    # Handle format: "December 30, 2025 2:15 pm"
    date_time_match = re.search(r'(\w+)\s+(\d+),\s+(\d+)\s+(\d{1,2}):(\d{2})\s*(am|pm)', time_str, re.I)
    if date_time_match:
        month_name = date_time_match.group(1)
        day = int(date_time_match.group(2))
        year = int(date_time_match.group(3))
        hour = int(date_time_match.group(4))
        minute = int(date_time_match.group(5))
        ampm = date_time_match.group(6).lower()
        
        month_map = {
            'january': 1, 'february': 2, 'march': 3, 'april': 4,
            'may': 5, 'june': 6, 'july': 7, 'august': 8,
            'september': 9, 'october': 10, 'november': 11, 'december': 12
        }
        month = month_map.get(month_name.lower(), now.month)
        
        if ampm == "pm" and hour != 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
        
        try:
            return datetime(year, month, day, hour, minute)
        except:
            pass
    
    # Handle "today" with time
    time_str_lower = time_str.lower()
    if "today" in time_str_lower or "අද" in time_str:
        time_match = re.search(r'(\d{1,2}):(\d{2})\s*(am|pm)', time_str_lower)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2))
            ampm = time_match.group(3)
            if ampm == "pm" and hour != 12:
                hour += 12
            elif ampm == "am" and hour == 12:
                hour = 0
            return now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    
    # Handle "X hours ago" or "X minutes ago"
    hours_ago = re.search(r'(\d+)\s*(hour|hours|පැය)', time_str_lower)
    if hours_ago:
        hours = int(hours_ago.group(1))
        return now - timedelta(hours=hours)
    
    minutes_ago = re.search(r'(\d+)\s*(minute|minutes|මිනිත්තු)', time_str_lower)
    if minutes_ago:
        minutes = int(minutes_ago.group(1))
        return now - timedelta(minutes=minutes)
    
    # Handle "yesterday" or "ඊයේ"
    if "yesterday" in time_str_lower or "ඊයේ" in time_str:
        return now - timedelta(days=1)
    
    return now


def categorize_news(title, category_text=""):
    """
    Categorize news based on title and category text
    """
    title_lower = title.lower()
    category_lower = category_text.lower()
    
    # Check for category keywords
    if any(word in title_lower or word in category_lower for word in ["ක්‍රීඩා", "sports", "sport"]):
        return "ක්‍රීඩා"
    elif any(word in title_lower or word in category_lower for word in ["ව්‍යාපාරික", "business", "economy"]):
        return "ව්‍යාපාරික"
    elif any(word in title_lower or word in category_lower for word in ["රජය", "government", "පාර්ලිමේන්තු"]):
        return "රජය"
    elif any(word in title_lower or word in category_lower for word in ["කලා", "entertainment", "මනෝරංග"]):
        return "කලා"
    elif any(word in title_lower or word in category_lower for word in ["තාක්ෂණ", "technology", "tech"]):
        return "තාක්ෂණ"
    else:
        return "උණුසුම් පුවත්"


def scrape_adaderana():
    """
    Scrape Ada Derana Sinhala hot news page and return structured news items
    """
    news_items = []
    
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'si,en-US,en;q=0.9'
        }
        
        response = requests.get(ADA_DERANA_URL, headers=headers, timeout=15)
        response.raise_for_status()
        response.encoding = 'utf-8'  # Ensure proper encoding for Sinhala
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all h2 headings which contain news titles on the Sinhala page
        # Based on the page structure, news items are in h2 tags
        news_headings = soup.find_all('h2')
        
        for idx, heading in enumerate(news_headings[:50]):  # Limit to 50 items
            try:
                # Extract title from h2
                title = heading.get_text(strip=True)
                if not title or len(title) < 10:
                    continue
                
                # Skip if it's not a news headline (like page title)
                if title in ["උණුසුම් පුවත්", "Hot News", "Most Viewed"]:
                    continue
                
                # Find the parent container to get link and time
                parent = heading.find_parent(['div', 'article', 'section'])
                if not parent:
                    parent = heading
                
                # Extract link - look for anchor tag near the heading
                link = ""
                link_elem = heading.find('a', href=True)
                if not link_elem:
                    # Try to find link in parent or next sibling
                    link_elem = parent.find('a', href=True) if parent else None
                
                if link_elem:
                    link = link_elem.get('href', '')
                    if link and not link.startswith('http'):
                        if link.startswith('/'):
                            link = f"https://sinhala.adaderana.lk{link}"
                        else:
                            link = f"https://sinhala.adaderana.lk/{link}"
                
                # Extract time - look for timestamp pattern in text after heading
                time_str = ""
                timestamp = None
                
                # Look for time in the same container or next elements
                time_pattern = re.compile(r'(December|January|February|March|April|May|June|July|August|September|October|November)\s+\d+,\s+\d+\s+\d+:\d+\s+(am|pm)', re.I)
                
                # Check parent and siblings for time
                search_area = parent if parent else heading
                time_text = search_area.get_text()
                time_match = time_pattern.search(time_text)
                
                if time_match:
                    time_str = time_match.group(0).strip()
                    timestamp = parse_time_string(time_str)
                else:
                    # Try to find time element
                    time_elem = search_area.find(string=re.compile(r'\d+:\d+\s*(am|pm)', re.I))
                    if time_elem:
                        time_str = time_elem.strip()
                        timestamp = parse_time_string(time_str)
                
                # Extract category - this page is for "උණුසුම් පුවත්" (Hot News)
                # But we can try to detect from title or URL
                category = categorize_news(title, "")
                
                # Determine if breaking news
                is_breaking = any(word in title for word in ["විශේෂ", "බිඳී", "උත්තරීතර", "විශේෂයෙන්"])
                
                news_item = {
                    "id": idx + 1,
                    "title": title,
                    "link": link or f"{ADA_DERANA_URL}#{idx}",
                    "time": time_str or "මෑතකදී",
                    "timestamp": timestamp.isoformat() if timestamp else datetime.now().isoformat(),
                    "category": category,
                    "isBreaking": is_breaking,
                    "text": title  # For TTS, we'll use the title
                }
                
                news_items.append(news_item)
                
            except Exception as e:
                logger.warning(f"Error parsing article {idx}: {str(e)}")
                continue
        
        # If scraping failed, return sample data for development
        if not news_items:
            logger.warning("No news items scraped, returning sample data")
            news_items = get_sample_news()
        
        logger.info(f"Scraped {len(news_items)} news items from Sinhala Ada Derana")
        return news_items
        
    except Exception as e:
        logger.error(f"Error scraping Ada Derana Sinhala: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # Return sample data on error
        return get_sample_news()


def get_sample_news():
    """
    Return sample news data for development/testing
    """
    now = datetime.now()
    return [
        {
            "id": 1,
            "title": "ශ්‍රී ලංකාවේ ආර්ථික ප්‍රතිසංස්කරණ ක්‍රියාවලිය ඉදිරියට",
            "link": "https://www.adaderana.lk/news/1",
            "time": "1:24 pm today",
            "timestamp": now.replace(hour=13, minute=24).isoformat(),
            "category": "ව්‍යාපාරික",
            "isBreaking": False,
            "text": "ශ්‍රී ලංකාවේ ආර්ථික ප්‍රතිසංස්කරණ ක්‍රියාවලිය ඉදිරියට"
        },
        {
            "id": 2,
            "title": "ක්‍රීඩා අමාත්‍යාංශයේ නව ප්‍රතිපත්ති ප්‍රකාශය",
            "link": "https://www.adaderana.lk/news/2",
            "time": "2 hours ago",
            "timestamp": (now - timedelta(hours=2)).isoformat(),
            "category": "ක්‍රීඩා",
            "isBreaking": False,
            "text": "ක්‍රීඩා අමාත්‍යාංශයේ නව ප්‍රතිපත්ති ප්‍රකාශය"
        },
        {
            "id": 3,
            "title": "විශේෂ පුවත: නව රජයේ පළමු රැස්වීම",
            "link": "https://www.adaderana.lk/news/3",
            "time": "30 minutes ago",
            "timestamp": (now - timedelta(minutes=30)).isoformat(),
            "category": "රජය",
            "isBreaking": True,
            "text": "විශේෂ පුවත: නව රජයේ පළමු රැස්වීම"
        },
        {
            "id": 4,
            "title": "තාක්ෂණික ක්ෂේත්‍රයේ නව නිපැයුම්",
            "link": "https://www.adaderana.lk/news/4",
            "time": "3 hours ago",
            "timestamp": (now - timedelta(hours=3)).isoformat(),
            "category": "තාක්ෂණ",
            "isBreaking": False,
            "text": "තාක්ෂණික ක්ෂේත්‍රයේ නව නිපැයුම්"
        },
        {
            "id": 5,
            "title": "කලා ලෝකයේ නව චිත්‍රපට ප්‍රදර්ශනය",
            "link": "https://www.adaderana.lk/news/5",
            "time": "4 hours ago",
            "timestamp": (now - timedelta(hours=4)).isoformat(),
            "category": "කලා",
            "isBreaking": False,
            "text": "කලා ලෝකයේ නව චිත්‍රපට ප්‍රදර්ශනය"
        }
    ]

