# Notablemind
v2

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

