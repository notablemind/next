
import sqlite3
import json
import bs4

def dict_factory(cursor, row):
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}

def opendb(file):
    con = sqlite3.connect(file)
    con.row_factory = dict_factory
    return con

def get_all(cur, table):
    cur.execute('select * from ' + table)
    return cur.fetchall()

def parse_node(content):
    doc = bs4.BeautifulSoup(content, 'html.parser')
    nmap = {}
    order = []
    extras = []
    title = None
    titleNumber = None
    summary = None
    intro = None
    for node in doc.find_all(attrs={'data-aid': lambda x: x}):
        if node.name == 'html':
            continue
        cls = node.attrs.get(u'class', None)
        if cls: cls = cls[0]
        if node.name == 'h1':
            title = node.decode_contents()
        elif cls == u'title-number':
            titleNumber = node.decode_contents()
        elif cls == u'study-summary':
            summary = node.decode_contents()
        elif cls == u'study-intro':
            intro = node.decode_contents()
        elif cls == u'intro':
            intro = node.decode_contents()
        else:
            aid = node.attrs.get(u'data-aid')
            verse = node.find(attrs={'class': 'verse-number'})
            if verse:
                verse = verse.decode_contents().strip()
            order.append(aid)
            extras.append({
                'verse': verse,
                'type': cls,
                'aid': aid,
                'id': node.attrs.get(u'id'),
                'contents': node.decode_contents(),
            })
    return {'order': order, 'nodes': nmap, 'extras': extras, 'summary': summary, 'intro': intro}

def process_book(file):
    con = opendb(file)
    cur = con.cursor()

    collections = get_all(cur, 'nav_collection')
    # sections = get_all(cur, 'nav_section')
    items = get_all(cur, 'nav_item')
    content = get_all(cur, 'subitem_content')

    colid = {}
    cold = {}
    for col in collections:
        colid[col['_id']] = col['uri']
        cold[col['uri']] = col
        col['children'] = []

    itemid = {}
    itemd = {}
    for item in items:
        itemid[item['_id']] = item['uri']
        itemd[item['uri']] = item
        if item['nav_section_id'] not in colid:
            item['nav_section_id'] = colid.keys()[0]
        cold[colid[item['nav_section_id']]]['children'].append(item['_id'])

    raws = {}

    contentd = {}
    for one in content:
        uri = itemid[one['subitem_id']]
        raws[uri] = one['content_html']
        contentd[uri] = parse_node(one['content_html'])

    data = {'collections': cold, 'items': itemd, 'contents': contentd}

    title = cold[colid[1]]['title_html'] # .replace(' ', '_')

    return title, data, raws

item_keys = '_id title language_id uri item_cover_renditions'.split()

def process_catalog(file):
    con = opendb(file)
    cur = con.cursor()

    categories = get_all(cur, 'item_category')
    items = get_all(cur, 'item')

    library = {}
    for category in categories:
        library[category['_id']] = category
        category['items'] = []

    for item in items:
        keep = {}
        for name in item_keys:
            keep[name] = item[name]
        library[item['item_category_id']]['items'].append(keep)

    return library

import os
import os.path

library = process_catalog('./files/catalog/catalog')
json.dump(library, open('./json/library.json', 'w')) # , indent=2)

base = './files/content/content-databases/'
for name in os.listdir(base):
    dest = os.path.join('json', name + '.json')
    if os.path.exists(dest): continue
    full = os.path.join(base, name, 'package.sqlite')
    print 'parsing', full
    title, data, raws = process_book(full)
    print 'found', title
    json.dump(data, open(dest, 'w')) # , indent=2)

    try:
        os.mkdir('html/' + name)
    except:
        pass
    for key in raws:
        open(os.path.join('html', name, key.replace('/', '_') + '.html'), 'w').write(raws[key])

