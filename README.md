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
- Create a host alert widget. Transparent normally, but on host, shows custom
  image (possibly GIF) and plays sound. Preload both on startup so it doesn't
  need to be poked. Incorporate custom text - borrow from StilleBot? WS sync?


The MIT License (MIT)

Copyright (c) 2020 Chris Angelico

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
