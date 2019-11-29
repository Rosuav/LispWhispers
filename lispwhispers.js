import choc, {set_content} from "https://rosuav.github.io/shed/chocfactory.js";
import "./comfy.js"; const ComfyJS = window.ComfyJS;
const {A} = choc;

ComfyJS.onError = error => {
	if (error === "Login authentication failed")
	{
		window.localStorage.removeItem("lispwhispers_access_key");
		init();
		return;
	}
	console.error("Error:", error);
};

ComfyJS.onWhisper = (user, message, flags, self, extra) => {
	console.log("Received whisper from", user);
	console.log(message);
};

async function init()
{
	const stored_token = window.localStorage.getItem("lispwhispers_access_key");
	let token = new URLSearchParams(window.location.hash.slice(1)).get("access_token");
	if (token)
	{
		//We just came back from the login page. Save the token.
		window.localStorage.setItem("lispwhispers_access_key", token);
		if (token !== stored_token)
		{
			const info = await (await fetch("https://id.twitch.tv/oauth2/validate",
				{headers: {"Authorization": "OAuth " + token}})).json();
			window.localStorage.setItem("lispwhispers_username", info.login);
			console.log("Logged in as", info.login);
		}
	}
	else token = stored_token;
	if (!token)
	{
		const here = window.location.origin + window.location.path;
		const url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=cg9pw2xmxgdlqeqfk7yn8rxrhxonpj&redirect_uri=${here}&scope=chat:read+whispers:read+whispers:edit`;
		set_content("main", A({href: url, target: "_blank"}, "Authenticate"));
		return;
	}
	let username = window.localStorage.getItem("lispwhispers_username");
	ComfyJS.Init(username, token);
}

init();
