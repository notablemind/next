
# List view
- multi-select & associated keyboard shortcuts

# Whiteboard view
- keyboard shortcut to line things up vertically

# Not local-only

- the "default view type & settings" for a given node
- maybe allow to save "view states" so if you've got some complex setup, you
  can name it n stuff.


# Things I gotta do

- split panes!
- electron viewer
- table view! also w/ sorting
- tags
- view settings - like the "bullets vs lines" thing in the list view, and
  maybe a "compact vs spacious node size" in whiteboard
- jupyter plugin

- export to markdown
  - I want a bunch of options like
  - "number of headings to `##` instead of making into lists"
  - [x] toplevel is paragraphs instead of list items

# Local-only data

Things I want to save local-only
[x] collapse state for each node; I'm now thinking default-closed is the best
  way. Anyway, probably debounce to save to every second or so? Keep
  everything in a giant object that get's JSON.stringifyied to localStorage
[x] "last view state for this doc"

# Other stuff

Authentication!

api endpoints
```
hmmm i really need to be able to tap into the user auth
/ensure-user ? username
/create-doc ? username, docid // it'll be called 'userid-docid' probably
/add-collaborator ? docid, username
  // then they get added as readers/writers
/remove-collaborator ? docid, username
  // then they get removed
/add-viewer ? docid, username
/remove-viewer ? docid, username
```

I think that's it?

- do the signup / login dance
- hit an endpoint that's like "ensure user database"
  - it will create one for you if it's not there
  - then your user database
- hit an endpoint "make me a database" with username & db name
- then the database is made, and it's added to

## Data formatting

User db
- `settings` -> user settings
- {type: 'folder', id: string, title: string, folder: string}
- {type: 'doc', id: string, title: string, ...}
- {type: 'theme', } // custom theming

Doc db
- `settings`
  - latest view config (might to something w/ having multiple view configs?)
  - any theme stuff
  - plugin configs
  - ???
- {type: 'node', ...}
- {type: 'tag', ...}
- {type: ..., ...} open to storing other types of things if plugins want to.

Any other DBs?
maybe not.




    /**
     * This will contain
     * - the settings blob
     * - entries for all of your documents
     *   {id: docid,
     *    folder: ?folderid,
     *    title: string,
     *    type: 'doc',
     *    size: number,
     *    last_modified: number(date),
     *    last_updated: number(date),
     *    }
     *   on the server, document ids will be `doc_userid_docid`, but locally,
     *   they will be `doc_docid` b/c you don't intrinsically have a userid
     *   anyway, these things will be a little denormalized between the doc
     *   db and this list, but I don't think we can avoid that.
     * - entries for all of your folders
     *   {id: string, title: string, folder: string, type: 'folder'} // anything else? don't think so
     * - what are the kinds of configuration things that files can have?
     *   these will live *in* the collection, under a special key, like
     *   `settings`
     *    view configuration (windows, panes, etc)
     *    plugin config
     *    - OOhh maybe this will need to be readable too
     *    - orr actually maybe it'll just be a document in the doc collection.
     *      yeah!
     * - how about system-wide settings?
     * - themes!
     *   if you're using a custom theme, you'll have to share the theme
     *   but the default will be to use a built-in theme & make small
     *   modifications. A custom theme could be a single document that you
     *   fetch from a user's db; and others who are listed in the document
     *   would have read-only access to it. I think that will work.
     *   so I can probably worry about themes later.
     *
    const db = new PouchDB('notablemind_user', 'idb')
    RxDB.create('notablemind', 'idb', null, true).then(db => {
      this.setState({localDb: db})
      return db.collection('user', userSchema).then(userCol => {
        this.setState({userCol})
        // TODO do I need the settings here?
      })
    }, err => console.log('er', err))
     */

