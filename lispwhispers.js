import choc, {set_content} from "https://rosuav.github.io/shed/chocfactory.js";
import "https://cdn.jsdelivr.net/npm/comfy.js/dist/comfy.min.js"; const ComfyJS = window.ComfyJS;
const {A, IMG, INPUT, LABEL, LI, OPTION, OPTGROUP, SPAN} = choc;

const params = new URLSearchParams(window.location.search);

const hosts_only = window.location.pathname.includes("/hosts");
//The Twitch server doesn't support CORS, so we need a little CORS bouncer. Take your pick, either will work.
//const HOST_FETCH_URL = "https://cors-anywhere.herokuapp.com/https://tmi.twitch.tv/hosts?include_logins=1&target=";
const HOST_FETCH_URL = "https://sikorsky.rosuav.com/hostviewer?target=";

let config = {};
try {config = JSON.parse(window.localStorage.getItem("lispwhispers_config")) || {};} catch (e) { }
if (typeof config !== "object") config = {};
function save_config() {window.localStorage.setItem("lispwhispers_config", JSON.stringify(config));}
if (!config.recent_recip) config.recent_recip = [];

const user_info = {};

function update_recipient_list() {
	let recip = config.standard_recip || [];
	let map = {}; recip.forEach(r => map[r] = 1);
	config.recent_recip.forEach(r => map[r] || recip.push(r));
	if (config.sort_recipients) recip.sort();
	set_content("#recipients", recip.map(r => OPTION(user_info[r].displayname)));
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

function filter_messages(username, displayname) {
	document.querySelectorAll("#messages li").forEach(li =>
		li.classList.toggle("hidden", !!(li.dataset.channel && li.dataset.channel !== username)));
	document.getElementById("send_whisper").elements.recipient.value = displayname;
	scroll_down();
}

if (!hosts_only) document.getElementById("merged").onchange = () => {
	document.querySelectorAll("#messages li").forEach(li => li.classList.remove("hidden"));
	scroll_down();
}

function add_recipient(displayname, username, update) {
	const lcuser = displayname.toLowerCase();
	config.recent_recip = config.recent_recip.filter(r => r !== lcuser);
	if (config.recent_recip.length > 10) config.recent_recip = config.recent_recip.slice(1);
	config.recent_recip.push(lcuser);
	if (!user_info[lcuser])
	{
		document.querySelector("nav").appendChild(LABEL([
			INPUT({type: "radio", name: "channel", onchange: () => filter_messages(username, displayname)}),
			//TODO: Update this if the case changes
			displayname,
		]));
		user_info[lcuser] = {displayname, username};
	}
	else if (update) Object.assign(user_info[lcuser], {displayname, username});
	update_recipient_list();
}

const current_hosts = { };
ComfyJS.onHosted = (username, viewers, autohost, extra) => {
	//Hack to see if we can recognize hosts vs autohosts
	//Note that ComfyJS itself never seems to announce autohosts. It also
	//doesn't provide the displayname, so we fall back on the username.
	const now = new Date;
	const age = +now - (current_hosts[username]||0);
	if (age < 86400000) return; //Rehosting doesn't count (but expire them after a day in case the page is left up all the time)
	current_hosts[username] = +now;
	console.log("HOST:", username, viewers, autohost, extra);
	const li = LI({className: "new", title: now.toLocaleDateString() + " " + now.toLocaleTimeString()}, [
		SPAN({className: "username", "style": extra.userColor ? "color: " + extra.userColor : ""}, extra.displayname || username),
		` ${autohost ? "auto" : ""}hosted you for ${viewers} viewers`,
	]);
	msgs.appendChild(li);
	//These ones stay for a full minute before starting to fade. (TODO: Should they?)
	setTimeout(() => li.classList.remove("new"), 60000);
	scroll_down();
};

async function checkhosts(userid, desc) {
	const hosts = await (await fetch(HOST_FETCH_URL + userid)).json();
	const names = [];
	const now = new Date; //Consistent definition of current timestamp
	for (let host of hosts.hosts) {
		const age = +now - (current_hosts[host.host_login]||0);
		if (age < 86400000) continue; //Already hosting (or has previously been hosting)
		current_hosts[host.host_login] = +now;
		names.push(host.host_display_name);
	}
	let msg;
	switch (names.length) {
		case 0: break; //No new hosts - common case
		case 1: msg = `${names[0]} is ${desc} you.`; break;
		case 2: msg = `${names[0]} and ${names[1]} are ${desc} you.`; break;
		default: msg = `${names.length} channels are ${desc} you: ${names.join(", ")}`; break;
	}
	if (msg) {
		//TODO: For a11y compliance, make it possible to put the timestamp into the text
		const li = LI({className: "new", title: now.toLocaleDateString() + " " + now.toLocaleTimeString()}, msg);
		msgs.appendChild(li);
		setTimeout(() => li.classList.remove("new"), 60000);
		scroll_down();
	}
}

async function hostpoll() {
	let userid;
	if (hosts_only) {
		userid = params.get("channelid");
		if (!userid) {
			//Need to look up a channel name and get the ID. Beg StilleBot to help us out here.
			console.info("Need a channel to monitor - sending you to Sikorsky");
			window.location.href = "https://sikorsky.rosuav.com/hostviewer";
			return;
		}
	}
	else {
		userid = window.localStorage.getItem("lispwhispers_userid");
		if (!userid) //Shouldn't happen long-term but older LispWhispers didn't record the ID
		{
			const token = window.localStorage.getItem("lispwhispers_access_key");
			if (!token) return; //Can't show hosts without knowing who we are.
			console.log("Fetching userid...");
			const info = await (await fetch("https://id.twitch.tv/oauth2/validate",
				{headers: {"Authorization": "OAuth " + token}})).json();
			window.localStorage.setItem("lispwhispers_userid", userid = info.user_id);
		}
	}
	checkhosts(userid, "currently hosting"); //Grab any current hosts
	//After the startup display, guess that any new hosts are autohosts
	//Non-auto hosts should be caught by the ComfyJS hook.
	setInterval(checkhosts, 30000, userid, hosts_only ? "now hosting" : "now autohosting");
}

ComfyJS.onWhisper = (user, message, flags, self, extra) => {
	//console.log("Received whisper from", user); console.log(message, flags, self, extra);
	//window.localStorage.setItem("last_received", JSON.stringify({user, message, flags, self, extra})); //For #hack
	if (!self) add_recipient(user, extra.channel, true); //Don't add self to recent recipients :)
	else user = "To: " + (user_info[extra.channel] || {displayname: extra.channel}).displayname;

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
	//TODO: If a whisper comes in and you're filtered to some other channel,
	//what should happen? Currently it shows it anyway (definitely wrong
	//behaviour). Should it flick to the other channel? Highlight it somehow?
	const now = new Date;
	const li = LI({"data-channel": extra.channel, className: "new", title: now.toLocaleDateString() + " " + now.toLocaleTimeString()}, [
		SPAN({className: "username", "style": extra.userColor ? "color: " + extra.userColor : ""}, user),
		": ",
		SPAN({className: "message"}, message),
	]);
	msgs.appendChild(li);
	//Five seconds after it got added, start fading the highlight (over sixty seconds)
	setTimeout(() => li.classList.remove("new"), 5000);
	scroll_down();
};

const rewardid = params.get("rewardid");
if (rewardid) ComfyJS.onChat = ( user, message, flags, self, extra ) => {
	if (!flags.customReward) return;
	if (extra.customRewardId !== rewardid) return;
	//To figure out the appropriate rewardid, use OSDRewards and try it out
	console.log("Got magic reward: " + message);
	const socket = new WebSocket("ws://localhost:4444"); //Hard-coded for simplicity. Also, has to be passwordless.
	socket.onopen = () => {
		console.log("Connected");
		socket.send(JSON.stringify({"request-type": "GetSceneList", "message-id": "list"}));
	}
	socket.onmessage = (ev) => {
		const data = JSON.parse(ev.data);
		switch (data["message-id"]) {
			case "list": {
				//The logic is: Go through the words in the current scene name.
				//If you find "left", and the word "right" is in the reward text, replace it.
				//Ditto the other four.
				const valid = {left: "right", right: "left", top: "bottom", bottom: "top"};
				const change = {};
				//If it's valid to replace "left" with "right" and we find "left" in the message,
				//then we want to change "right" into "left" in the scene name.
				message.toLowerCase().split(" ").forEach(word => valid[word] && (change[valid[word]] = word));
				const scene = data["current-scene"].split(" ")
					.map(word => change[word] || word)
					.join(" ");
				if (scene === data.name) return; //Should we send back a notification?
				//Dedicated hack because my (Rosuav's) scenes have special markers at the start
				const scenes = {};
				data.scenes.forEach(s => scenes[s.name.slice(2)] = s.name);
				const adjscene = scenes[scene.slice(2)];
				console.log("Old scene name:", data["current-scene"]);
				console.log("New scene name:", adjscene);
				socket.send(JSON.stringify({"request-type": "SetCurrentScene", "scene-name": adjscene, "message-id": "update"}));
				break;
			}
			case "update": socket.close(); break;
			default: break;
		}
	};
	socket.onclose = () => {
		console.log("Socket closed");
	};
}

if (!hosts_only) document.getElementById("send_whisper").onsubmit = function(e) {
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
	add_recipient(recip, recip.toLowerCase(), false); //TODO: Find out the *actual* username and display name
};

/* TODO: Config dialog. Probably use <dialog> itself.

Needs to show all the config settings currently used, and allow easy backup and restore.
Perhaps, as changes are made, it should dynamically show the JSON in a textarea??
*/

function show_config()
{
	const dlg = document.getElementById("configdlg");
	if (localStorage.getItem("lispwhispers_access_key"))
	{
		//Yes, you might see "Logged in as undefined" if the two are out of sync.
		//No, I don't care.
		set_content("#cfg_auth", "Logged in as " + localStorage.getItem("lispwhispers_username"));
		document.getElementById("clear_auth").disabled = false;
	}
	document.getElementById("cfg_json").value = JSON.stringify(config);
	dlg.show();
}
window.show_config = show_config;

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
			window.localStorage.setItem("lispwhispers_userid", info.user_id);
			if (!info.login) token = null;
			else console.log("Logged in as", info.user_id, info.login);
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
	set_content("li.heading", "Lisp Whispers for " + username + (rewardid ? " + camhack" : ""));
	ComfyJS.Init(username, token);
	if (window.localStorage.getItem("lispwhispers_hosthack")) hostpoll();
}

if (hosts_only) hostpoll();
else if (window.location.hash === "#hack")
{
	const data = window.localStorage.getItem("last_received");
	if (data)
	{
		const {user, message, flags, self, extra} = JSON.parse(data);
		for (let i = 0; i < 20; ++i) ComfyJS.onWhisper(user, message, flags, self, extra);
	}
}
else init();

//For browsers with only partial support for the <dialog> tag, add the barest minimum.
//On browsers with full support, there are many advantages to using dialog rather than
//plain old div, but this way, other browsers at least have it pop up and down.
document.querySelectorAll("dialog").forEach(dlg => {
	if (!dlg.showModal) dlg.showModal = function() {this.style.display = "block";}
	if (!dlg.close) dlg.close = function() {this.style.removeProperty("display");}
});
document.querySelectorAll(".dialog_cancel").forEach(el => el.onclick = function() {this.parentElement.close();});
