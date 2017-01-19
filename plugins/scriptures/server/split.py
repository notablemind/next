
import json
import os

base = 'json'
for name in os.listdir(base):
    print name
    full = os.path.join(base, name)
    data = json.load(open(full))
    json.dump(data['contents'], open(full + '-contents', 'w'))
    json.dump({'collections': data['collections'], 'items': data['items']}, open(full, 'w'))

