# Overview

Tab & Shift Tab take you between actions, where the actions are
Quick Add | Sticky Note | Time tracker | ... | New window

I think I'll want a way for other plugins to add quick-add things...

## Quick Add
Type some note.
<Enter> moves you down to the document selector, where you pick where this
thing should go.
<Cmd+Enter> adds it to the default document.

When a thing is added to a document, it becomes the last child of the
"quick-add target", which is configurable, and by default the root node.

## Sticky Note
Create an always-on-top window into one of your documents.
The default location is zoomed to a new child in the `sticky notes` document.
(which document is the sticky notes document can be configured if you really
want, probably. it'll be specified in the meta.json).
Buut you can also select an existing document, and *search within that
document* for the place you want to pin.
// the searching might be annoying, and you can search once the doc is loaded
anyway, right? Maybe I'll ditch that idea.



# Chrome extension

Dunno if this has overlap w/ the quick-add thing. Perhaps.
