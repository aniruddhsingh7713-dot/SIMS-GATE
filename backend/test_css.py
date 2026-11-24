import urllib.request
import re

html = urllib.request.urlopen('http://localhost:3000/').read().decode('utf-8')
print('HTML length:', len(html))

# Look for CSS link or style tags
css_links = re.findall(r'href="([^"]+\.css[^"]*)"', html)
print('CSS links:', css_links)

for link in css_links:
    url = 'http://localhost:3000' + link if link.startswith('/') else link
    try:
        content = urllib.request.urlopen(url).read().decode('utf-8')
        print(f'{link} length: {len(content)}')
        if 'faculty-editorial-section' in content:
            print('  -> FOUND faculty-editorial-section in', link)
        else:
            print('  -> NOT FOUND in', link)
    except Exception as e:
        print(f'Error fetching {link}:', e)

if 'faculty-editorial-section' in html:
    print('HTML contains faculty-editorial-section')
else:
    print('HTML DOES NOT contain faculty-editorial-section')
