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
