import choc, {set_content} from "https://rosuav.github.io/shed/chocfactory.js";
import "./comfy.js"; const ComfyJS = window.ComfyJS;
const {A, IMG, INPUT, LABEL, LI, OPTION, OPTGROUP, SPAN} = choc;

let config = {};
try {config = JSON.parse(window.localStorage.getItem("lispwhispers_config")) || {};} catch (e) { }
if (typeof config !== "object") config = {};
function save_config() {window.localStorage.setItem("lispwhispers_config", JSON.stringify(config));}
if (!config.recent_recip) config.recent_recip = [];

function update_recipient_list() {
	let recip = config.standard_recip || [];
	let map = {}; recip.forEach(r => map[r] = 1);
	config.recent_recip.forEach(r => map[r] || recip.push(r));
	if (config.sort_recipients) recip.sort();
	set_content("#recipients", recip.map(OPTION));
}

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

const msgs = document.getElementById("messages");
function scroll_down() {setTimeout(() => msgs.scrollTop = msgs.scrollHeight, 50);};

function filter_messages(username) {
	document.querySelectorAll("#messages li").forEach(li =>
		li.classList.toggle("hidden", !!(li.dataset.channel && li.dataset.channel !== username)));
	scroll_down();
}

document.getElementById("merged").onchange = () => {
	document.querySelectorAll("#messages li").forEach(li => li.classList.remove("hidden"));
	scroll_down();
}

const user_filters = {};
function add_recipient(displayname, username) {
	//TODO: If you send, retain case from a previously-seen entry.
	//But if you receive, override previously-seen entries with the
	//case from the new one (as currently happens).
	config.recent_recip = config.recent_recip.filter(r => r.toLowerCase() !== displayname.toLowerCase());
	if (config.recent_recip.length > 10) config.recent_recip = config.recent_recip.slice(1);
	config.recent_recip.push(displayname);
	if (!user_filters[username])
	{
		document.querySelector("nav").appendChild(user_filters[username] = LABEL([
			INPUT({type: "radio", name: "channel", onchange: () => filter_messages(username)}),
			displayname,
		]));
	}
	update_recipient_list();
}

ComfyJS.onWhisper = (user, message, flags, self, extra) => {
	//console.log("Received whisper from", user); console.log(message, flags, self, extra);
	//window.localStorage.setItem("last_received", JSON.stringify({user, message, flags, self, extra})); //For #hack
	if (!self) add_recipient(user, extra.channel); //Don't add self to recent recipients :)

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
	msgs.appendChild(LI({"data-channel": extra.channel}, [
		SPAN({className: "username"}, user),
		": ",
		SPAN({className: "message"}, message),
	]));
	scroll_down();
};

document.getElementById("send_whisper").onsubmit = function(e) {
	e.preventDefault();
	const recip = this.elements.recipient.value;
	const msg = this.elements.message.value;
	if (recip === "" || msg === "") return;
	//TODO: if " " in recip: error
	//TODO: if msg too long, error
	ComfyJS.Whisper(msg, recip);
	//TODO: Retain the message somewhere for quick-resend (eg if recip wrong)
	this.elements.message.value = "";
	this.elements.message.focus();
	add_recipient(recip);
};

/* TODO: Config dialog. Probably use <dialog> itself.

Needs to show all the config settings currently used, and allow easy backup and restore.
Perhaps, as changes are made, it should dynamically show the JSON in a textarea??
*/

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
	if (data)
	{
		const {user, message, flags, self, extra} = JSON.parse(data);
		for (let i = 0; i < 20; ++i) ComfyJS.onWhisper(user, message, flags, self, extra);
	}
}
else init();
