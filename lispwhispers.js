import "./comfy.js"; const ComfyJS = window.ComfyJS;
console.log("Hello, world");
console.log(ComfyJS);

ComfyJS.onCommand = ( user, command, message, flags, extra ) => {
  if( flags.broadcaster && command == "test" ) {
    console.log( "!test was typed in chat" );
  }
}
ComfyJS.Init( "Rosuav" );
