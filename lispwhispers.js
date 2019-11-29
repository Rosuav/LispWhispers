import "./comfy.js"; const ComfyJS = window.ComfyJS;

ComfyJS.onWhisper = (user, message, flags, self, extra) => {
	console.log("Received whisper from", user);
	console.log(message);
};

ComfyJS.Init("Rosuav");
const here = window.location.toString(); //TODO: Do I need to clean anything off before using it as a redirect?
const url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=q6batx0epp608isickayubi39itsckt&redirect_uri=${here}&scope=chat:read+whispers:read+whispers:edit`;
