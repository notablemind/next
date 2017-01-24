
import json
import os

titles = []
for name in os.listdir('json'):
    if name == 'library.json': continue
    if name.endswith('-contents'): continue
    full = os.path.join('json', name)
    data = json.load(open(full))
    # prefixes = defaultdict(int)
    for uri in data['items']:
        titles.append({
            'uri': uri,
            'title': data['items'][uri]['title_html'],
            'subtitle': data['items'][uri]['subtitle'],
            'id': name.split('.')[0],
        })

        '''
        parts = uri.split('/')
        for i in range(1, len(parts)):
            prefixes[tuple(parts[:i])] += 1
    top = sorted(prefixes.values())[-1]
    fulls = ['/'.join(x) for x in prefixes if prefixes[x] == top]
    longest = sorted(fulls)[-1]
    # print sorted(fulls), prefixes.keys()
    index[longest] = name.split('.')[0]
    '''

json.dump(titles, open('./titles.json', 'w'))

