Lisp Whispers
=============

Simple web page permitting you to view your Twitch whispers while live.

TIP: Open a popup window with minimal chrome with this link:
    `javascript:window.open('https://rosuav.github.io/LispWhispers/', 'whispers', 'width=600, height=400')`

Available on GH Pages: https://rosuav.github.io/LispWhispers/
  - Uses [ComfyJS](https://github.com/instafluff/ComfyJS) for connectivity
  - Uses [Choc Factory](https://github.com/Rosuav/shed/blob/master/chocfactory.js)
    for rendering
  - Auth is stored in LocalStorage (TODO: tell the user this)
  - Note: Local testing requires a web server (eg `python3 -m http.server`).

TODO:
- Mark the window Urgent on new whisper (if possible)
- Also show highlighted messages in the streamer's channel?
- Sending of whispers.
  - Type a recipient name, or use a drop-down of "likely recipients"
    - By default, adds to recipients when a whisper arrives.
    - By default, adds to recipients when you manually send.
    - By default, zero permanent recipients; can prepopulate the list.
    - By default, recipient names are ordered by recently seen.
      - Alternative: Prepopulated ones come first (in an optgroup) and the
        names of those whispering you are in a separate optgroup. Not in the
	current HTML standards, so this can wait for now. Maybe a disabled
	element to separate them will be sufficient?
      - Alternative: Sort everything affabeck.
    - wreply semantics: incoming whisper automatically switches destination.
      - Prompt if you send a whisper within, say, 500ms of such a switch
        (only if it actually changed the name, of course).
      - Not currently implemented.
  - Quick re-send in case you sent to the wrong name (or you're multisending).
  - As there's no server, all this configuration will be kept in LocalStorage.
    Offer a way to download a backup file, or to copy a backup to clipboard.
