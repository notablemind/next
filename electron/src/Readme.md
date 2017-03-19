
How this is going down

e: startup!
e: start the "restore user" process
e: also determining whether we're offline, listening for changes in connectivity
e: create a window w/ the last opened thing
Oh! A wild Window appears!
w -> e: hello
e -> w: offline status, user status, file metadata (all push-based updatable)
w -> e: let's sync databases (A)
w -> e: here's a new database to sync

Data that wants to be always synced
- offline status // TODO
- login status & user
- files metadata
- the current database

Actions w -> e
- login please
- logout please
- get remote files list (for "file sync" window)
- sync settings page ops
  - start syncing local
  - download remote
  - delete local // TODO these should really just be "trashed" and then we remove trash periodically
  - copy file
  - remove remote file (low-pri)
- db data
- update current file metadata

Actions e -> w
- new offline status
- new user status
- db data
- new files metadata





A: database sync
w -> e: docid, uid
e -> w: all docs
...
w -> e: changes!
...
e -> w: changes!
...
w -> e: done w/ that doc, stop syncing
-or-
w (closes): e should cleanup



----------
First pass
----------

- list my files n stuff
- propagate file name changes

-----------
Second pass
-----------

- login
- list remote files
- restore user
- refresh token n stuff

----------
Third pass
----------

- start syncing this file w/ remote
- for documents that are syncing, do a throttled push to google drive w/
  updates n stuff

-----------
Fourth pass
-----------

- maybe trashes?
- idk. might care more about realtime by that point? probably not tho

