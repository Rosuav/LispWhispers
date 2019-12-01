Lisp Whispers
=============

Simple web page permitting you to view your Twitch whispers while live.

- Show all whispers by default
- Optionally separate them out by origin
  - Default is "evil mode", because sending will go by wreply semantics
- Retain the last X whispers seen
  - Is there a way to query Twitch for whisper history?
    - The Twitch UI uses gql for this, so there probably isn't any documented way.
  - If not, retain only for the current session
  - It'll be wonky anyway w/o that query, so just accept the wonk
- Mark the window Urgent on new whisper (if possible)
- Will be available on GH Pages
  - Use ComfyJS
  - Get dedicated client ID? Or use TMI?
  - Store auth in LocalStorage (and tell the user this)
  - Check the required scopes
  - Use Choc Factory
- For local testing, will need a web server (eg `python3 -m http.server`).
- TODO: Also show highlighted messages in the streamer's channel?
- Sending of whispers.
  - Maintain a list of likely recipients
    - By default, add to recipients when a whisper arrives.
    - By default, add to recipients when you manually send.
    - By default, zero permanent recipients; can prepopulate the list.
    - By default, all recipient names are sorted affabeck together.
      - Alternative: Prepopulated ones come first (in an optgroup) and the
        names of those whispering you are in a separate optgroup
      - Alternative: Prepopulated names are kept in the order you put them,
        and recipient names are in order of most recently seen.
    - wreply semantics: incoming whisper automatically switches destination.
      - Prompt if you send a whisper within, say, 500ms of such a switch
        (only if it actually changed the name, of course).
  - Quick re-send in case you sent to the wrong name (or you're multisending).
  - As there's no server, all this configuration will be kept in LocalStorage.
    Offer a way to download a backup file, or to copy a backup to clipboard.
