Lisp Whispers
=============

Simple web page permitting you to view your Twitch whispers while live.

- Show all whispers by default
  - Optionally separate them out by origin
  - See CSS for notes on how to do this; I don't think it's possible w/o some
    dynamically-generated CSS
- Retain the last X whispers seen
  - Is there a way to query Twitch for whisper history?
    - The Twitch UI uses gql for this, so there probably isn't any documented way.
  - If not, retain only for the current session
  - It'll be wonky anyway w/o that query, so just accept the wonk
- Mark the window Urgent on new whisper (if possible)
- Available on GH Pages: https://rosuav.github.io/LispWhispers/
  - Uses [ComfyJS](https://github.com/instafluff/ComfyJS) for connectivity
  - Uses [Choc Factory](https://github.com/Rosuav/shed/blob/master/chocfactory.js)
    for rendering
  - Auth is stored in LocalStorage (TODO: tell the user this)
- Note: Local testing requires a web server (eg `python3 -m http.server`).
- TODO: Also show highlighted messages in the streamer's channel?
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
  - Does Chrome have facilities for synchronized storage??
- TODO: Pin the send box to the floor and have a separate scroll container
- TODO (locally): Create a popup link like for dashboard. Provide example?
