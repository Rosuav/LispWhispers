import choc, {set_content} from "https://rosuav.github.io/shed/chocfactory.js";
import "./comfy.js"; const ComfyJS = window.ComfyJS;
const {A, IMG, LI, SPAN} = choc;

let active = false; //True if we (appear to) have a connection, false on critical error
ComfyJS.onChatMode = () => active = true;

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
	//console.log("Received whisper from", user); console.log(message, flags, self, extra);
	//window.localStorage.setItem("last_received", JSON.stringify({user, message, flags, self, extra})); //For #hack
	if (extra.messageEmotes)
	{
		//First, parse the weird mapping into a sortable array of emotes.
		let emotes = [];
		for (let emote in extra.messageEmotes) for (let position of extra.messageEmotes[emote])
		{
			const [from, to] = position.split("-");
			emotes.push({position: +from, length: to-from+1, emote: emote});
		}
		emotes.sort((a,b) => a.position - b.position);
		//This is now very similar to the way Twitch gives us the info in the
		//first place - sorted by position, not emote.
		let text = message, position = 0;
		message = [];
		for (let emote of emotes)
		{
			if (emote.position > position)
			{
				message.push(text.slice(0, emote.position - position));
				text = text.slice(emote.position - position);
				position = emote.position;
			}
			message.push(IMG({src: `https://static-cdn.jtvnw.net/emoticons/v1/${emote.emote}/1.0`,
					alt: text.slice(0, emote.length), title: text.slice(0, emote.length)}));
			text = text.slice(emote.length);
			position += emote.length;
		}
		message.push(text);
	}
	document.getElementById("messages").appendChild(LI([
		SPAN({className: "username"}, user),
		": ",
		SPAN({className: "message"}, message),
	]));
	setTimeout(() => document.getElementById("send_whisper").scrollIntoView(false), 10);
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
			if (!info.login) token = null;
			else console.log("Logged in as", info.login);
		}
	}
	else token = stored_token;
	if (!token)
	{
		const here = window.location.origin + window.location.pathname;
		const url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=cg9pw2xmxgdlqeqfk7yn8rxrhxonpj&redirect_uri=${here}&scope=chat:read+whispers:read+whispers:edit`;
		set_content("main", A({href: url, target: "_blank"}, "Authenticate"));
		active = false;
		return;
	}
	let username = window.localStorage.getItem("lispwhispers_username");
	ComfyJS.Init(username, token);
}

if (window.location.hash === "#hack")
{
	const data = window.localStorage.getItem("last_received");
	if (data) {const {user, message, flags, self, extra} = JSON.parse(data); ComfyJS.onWhisper(user, message, flags, self, extra);}
}
else init();
