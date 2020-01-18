(function() {

	// Variables
	let current_url = window.location.href;
	let shifted = false;
	let controlled = false;
	let alternated = false;
	if (typeof localStorage.JumpPoints != "string") localStorage.JumpPoints = "https://www.nationstates.net/region=artificial_solar_system";
	if (typeof localStorage.Role != "string") localStorage.Role = "Officer";

	let JumpPoint = getJumpPoint();

	// On popup.js requisting JumpPoints
	chrome.runtime.onMessage.addListener(
		function(message, sender, sendResponse) {
			switch(message.type) {
				case "getJumpPoints":
					sendResponse(localStorage.JumpPoints);
					break;
				case "setJumpPoint":
					JumpPoint = setJumpPoint(message.data);
					break;
				case "deleteJumpPoint":
					JumpPoint = deleteJumpPoint(message.data);
					break;
				case "getRole":
					sendResponse(localStorage.Role);
					break;
				case "setRole":
					localStorage.Role = message.data;
					break;
				default:
					console.error("Unrecognised message: ", message);
			}
		}
	);

	// On page load
	$(window).on("load", function(){
		// Send current page to background script
		chrome.runtime.sendMessage({action: "store", url: current_url});
		// If on the reports page and it is loaded
		if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
			// Make the page border green so the user knows they can safely refresh.
			$("html").css({"border-color": "#33cc00"});
		}
	});

	// Key down
	$(document).keydown(function(f) {
		if ($('input:focus').length > 0 || $('textarea:focus').length > 0) 	return;		// Disable in inputs & textareas
		if (window.location.href.indexOf("forum.nationstates.net") > -1) 	return;		// Disable in the forums

		// Detect Shift, Control and Alt keys being pressed
		shifted = f.shiftKey;
        controlled = f.ctrlKey;
		alternated = f.altKey;
		// Prevent defaults on keydown for [Backspace] and [Spacebar]
		if (f.keyCode === 8 || f.keyCode === 32){
			f.preventDefault();
		}
		// Prevent defaults on keydown for [F6], [F7] and [F8]
		if (f.keyCode === 117 || f.keyCode === 118 || f.keyCode === 119) {
			f.preventDefault();
		}
		// Prevent defaults on keydown for [F5] on the reports page, where this extension will press the "Generate Report" button instead of refreshing the page manually.
		if (current_url === "https://www.nationstates.net/template-overall=none/page=reports" && f.keyCode === 116){
			f.preventDefault();
		}
	});

	// Key up
	$(document).keyup(function(e) {
		if (!shifted) shifted = e.shiftKey;
        if (!controlled) controlled = e.ctrlKey;
		if (!alternated) alternated = e.altKey;

		if ($('input:focus').length > 0 || $('textarea:focus').length > 0) 	return;		// Disable in inputs & textareas
		if (window.location.href.indexOf("forum.nationstates.net") > -1) 	return;		// Disable in the forums
		if ((controlled || alternated || (shifted && e.keyCode !== 80))) 	return; 	// Ignore most combinations
		
		// [Enter] confirms dialogs in Chrome and Firefox by default. No code required.
		// [Ctrl]+[Tab] switches between browser tabs in Chrome and Firefox by default. No code required.
		// [Space] Reports Page (no template)
		if (e.keyCode === 32 && e.target === document.body) {
			let current_url = $(location).attr('href');
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				window.location.href = "https://www.nationstates.net/page=ajax2/a=reports/view=world/filter=move+member+endo";
			}
			else {
				window.location.href = "https://www.nationstates.net/template-overall=none/page=reports";
			}
		}
		// [F5] Refreshes window in both Chrome and Firefox by default.
		// If on the reports page and it is reloaded, make the green page border red so the user knows they shouldn't press refresh again.
		else if (e.keyCode === 116){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				// Instead of refreshing, press the "Generate Report" button. If NS ever decides to not make this page refresh when that button is clicked, this extension will benefit from that (as it would load changes faster).
				e.preventDefault();
				// Only get reports for the last 6 minutes.
				$("input[name=report_hours]").val("0.10");
				// Set the border to red so the user knows not to press refresh.
				$("html").css({"border-color": "#ff0000"});
				// Generate new report.
				$("input[name=generate_report]").first().trigger("click");
			}
		}
		// [F6] copies the link to the current page to the clipboard
		else if (e.keyCode === 117){
			e.preventDefault();
			let $temp = $("<input>");
			$("body").append($temp);
			$temp.val(current_url).select();
			document.execCommand("copy");
			$temp.remove();
		}
		// [F7] & [Backspace] Goes to previous page. [F7] is the shortcut for caret browsing in Firefox but can be disabled. [Backspace] is default for previous page in Firefox but not used in Chrome.
		else if (e.keyCode === 118 || e.keyCode === 8){
			e.preventDefault();
			// Send message to background script
			chrome.runtime.sendMessage({action: "previous", url: current_url});
			// Receive and load page in message
			chrome.runtime.onMessage.addListener(function(load){
				window.location.href = load.url;
			});
		}
		// [F8] Goes to next page. Unused by both Chrome and Firefox.
		else if (e.keyCode === 119){
			e.preventDefault();
			// Send message to background script
			chrome.runtime.sendMessage({action: "next", url: current_url});
			// Receive and load page in message
			chrome.runtime.onMessage.addListener(function(load){
				window.location.href = load.url;
			});
		}
		// [1] Add to Dossier
		else if (e.keyCode === 49){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(1)")[0].click();
				$("li a:nth-of-type(1)").eq(0).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(1)")[0].click();
				$("#reports li a:nth-of-type(1)").eq(0).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [2] Add to Dossier
		else if (e.keyCode === 50){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(1)")[1].click();
				$("li a:nth-of-type(1)").eq(1).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(1)")[1].click();
				$("#reports li a:nth-of-type(1)").eq(1).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [3] Add to Dossier
		else if (e.keyCode === 51){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(1)")[2].click();
				$("li a:nth-of-type(1)").eq(2).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(1)")[2].click();
				$("#reports li a:nth-of-type(1)").eq(2).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [4] Add to Dossier
		else if (e.keyCode === 52){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(1)")[3].click();
				$("li a:nth-of-type(1)").eq(3).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(1)")[3].click();
				$("#reports li a:nth-of-type(1)").eq(3).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [5] Add to Dossier
		else if (e.keyCode === 53){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(1)")[4].click();
				$("li a:nth-of-type(1)").eq(4).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(1)")[4].click();
				$("#reports li a:nth-of-type(1)").eq(4).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [Keypad 1] Add to Dossier
		else if (e.keyCode === 97){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(2)")[0].click();
				$("li a:nth-of-type(2)").eq(0).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(2)")[0].click();
				$("#reports li a:nth-of-type(2)").eq(0).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [Keypad 2] Add to Dossier
		else if (e.keyCode === 98){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(2)")[1].click();
				$("li a:nth-of-type(2)").eq(1).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(2)")[1].click();
				$("#reports li a:nth-of-type(2)").eq(1).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [Keypad 3] Add to Dossier
		else if (e.keyCode === 99){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(2)")[2].click();
				$("li a:nth-of-type(2)").eq(2).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(2)")[2].click();
				$("#reports li a:nth-of-type(2)").eq(2).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [Keypad 4] Add to Dossier
		else if (e.keyCode === 100){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(2)")[3].click();
				$("li a:nth-of-type(2)").eq(3).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(2)")[3].click();
				$("#reports li a:nth-of-type(2)").eq(3).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [Keypad 5] Add to Dossier
		else if (e.keyCode === 101){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(2)")[4].click();
				$("li a:nth-of-type(2)").eq(4).css("background-color", "yellow");
			}
			if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				$("#reports li a:nth-of-type(2)")[4].click();
				$("#reports li a:nth-of-type(2)").eq(4).css("background-color", "yellow");
			}
			else {
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [W] WA Delegate
		else if(e.keyCode === 87){
			if (current_url.indexOf("/region=") !== -1){
				// On region"s page
				$("#content").children("p:nth-child(2)").children("a.nlink:first")[0].click();
			}
			else if (current_url.indexOf("/page=change_region") !== -1 && $(".featuredregion").length === 0) {
				// The region in the sidebar updates too slow when you move regions, so this works better in that case. Should work on the page you get when you just moved, but not on the page with the featured region.
				$(".info").children("a")[0].click();
			}
			else {
				// Go to region"s page
				if ($("#paneltitle").length > 0){
					// Using Rift
					$("#panel").children(".panelcontent").children(".menu").children("li").children("a")[0].click();
				}
				else{
					// Other themes
					$("#panel").children("ul").children("li").children("a")[1].click();
				}
			}
		}
		// [E] Endorse
		else if (e.keyCode === 69){
			if ($("input[name=action]").val() === "endorse") $("button.endorse").first().trigger("click");
		}
		// [R] Region
		else if (e.keyCode === 82){
			if (window.location.href.indexOf("net/region=") > -1 || window.location.href.indexOf("none/region=") > -1) {
				window.location.reload();
			}
			if (window.location.href.indexOf("template-overall=none/page=change_region") > -1) {
				let region_url = $('a[href^="/region"]').first().text().toLowerCase().split(' ').join('_');
				window.location.replace("https://www.nationstates.net/region=' "+region_url+"'");
			}
			if (window.location.href.indexOf("none/page=reports") > -1 || window.location.href.indexOf("page=ajax2/a=reports") > -1) {
				$('li a:nth-of-type(3)')[0].click();
				$('li a:nth-of-type(3)').eq(0).css("background-color", "yellow");
			}
			else {
				if ($('#paneltitle').length > 0){
					// using Rift
					$('#panel').children('.panelcontent').children('.menu').children('li').children('a')[0].click();
				}
				else{
					// Default theme
					$('#panel').children('ul').children('li').children('a')[1].click();
				}
			}
		}
		// [T] Toggle site template on or off
		else if (e.keyCode === 84){
			if (window.location.href.indexOf("none/region") > -1) {
				let region_url = $('a[href^="/region"]').first().text().toLowerCase().split(' ').join('_');
				console.log(region_url);
				window.location.replace("https://www.nationstates.net/region="+region_url+" ");
			}
			if (window.location.href.indexOf("none/nation") > -1) {
				let nation_url = $('.quietlink').first().text().toLowerCase().split(' ').join('_');
				window.location.replace("https://www.nationstates.net/nation="+nation_url+" ");
			}
			if (window.location.href.indexOf("net/region") > -1) {
				let region_url = $('a[href^="/region"]').first().text().toLowerCase().split(' ').join('_');
				console.log(region_url);
				window.location.replace("https://www.nationstates.net/template-overall=none/region="+region_url+" ");
			}
			if (window.location.href.indexOf("net/nation") > -1) {
				let nation_url = $('.quietlink:eq(1)').text().toLowerCase().split(' ').join('_');
				window.location.replace("https://www.nationstates.net/template-overall=none/nation="+nation_url+" ");
			}
		}
		// [U] Did My Nation Update?
		else if (e.keyCode === 85){
			window.location.href = "https://www.nationstates.net/page=ajax2/a=reports/view=self/filter=change";
		}
		// [O] Regional officer functionality
		else if (e.keyCode === 79){
			let current_nation = $("#loggedin").attr("data-nname");
			// If on the regional control page, open own regional officer page
			if (current_url.indexOf("/page=region_control") !== -1){
				window.location.href = "https://www.nationstates.net/page=regional_officer/nation=" + current_nation;
			}
			// If on on own regional officer page, assign officer role
			else if (current_url.indexOf("/page=regional_officer") !== -1 && current_url.indexOf(current_nation) !== -1) {
				$("input[name=office_name]").val(localStorage.Role);
				$("input[name=authority_A]").prop("checked", true);
				$("input[name=authority_C]").prop("checked", true);
				$("input[name=authority_E]").prop("checked", true);
				$("input[name=authority_P]").prop("checked", true);
				$("button[name=editofficer]").trigger("click");
			}
			// If on someone else's regional officer page, dismiss them
			else if (current_url.indexOf("/page=regional_officer") !== -1) {
				$("button[name=abolishofficer]").trigger("click");
			}
			// If on none of these pages, open regional control page
			else {
				window.location.href = "https://www.nationstates.net/page=region_control";
			}
		}
		// [P] Open jump point, Move to jump point (2x), set jump point (+ [Shift])
		else if (e.keyCode === 80){
			if (shifted) {
				if (current_url.indexOf("https://www.nationstates.net/region=") !== -1) {
					setJumpPoint(current_url);
					alert("Jump Point Updated");
				}
			}
			else if (current_url === JumpPoint){
				$(".button[name=move_region], input[name=move_region]").first().trigger("click");
			}
			else {
				window.location.href = JumpPoint;
			}
		}
		// [A] Activity Feed With Chasing Filters, Activity Feed Without (2x)
		else if (e.keyCode === 65){
			if (current_url === "https://www.nationstates.net/page=activity/view=world"){
				window.location.href = "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo";
			}
			else if (current_url === "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo"){
				window.location.href = "https://www.nationstates.net/page=activity/view=world";
			}
			else {
				window.location.href = "https://www.nationstates.net/page=activity/view=world/filter=move+member+endo";
			}
		}
		// [S] Prep Switchers
		else if (e.keyCode === 83){
			if (window.location.href.indexOf("page=un") <= -1 && window.location.href.indexOf !== JumpPoint) {
				window.location.href = "https://www.nationstates.net/template-overall=none/page=un";
			}
			if (window.location.href.indexOf("page=un") > -1) {
				$('.button[name=submit]').first().trigger('click');
			}
			if (window.location.href.indexOf("page=UN_status") > -1) {
				window.location.href = JumpPoint;
			}
			if (window.location.href === JumpPoint) {
				$('.button[name=move_region], input[name=move_region]').first().trigger('click');
			}
		}
		// [D] Add to Dossier
		else if (e.keyCode === 68){
			if (current_url.indexOf("region=") !== -1){
				// On region"s page
				$(".button[name=add_to_dossier]").first().trigger("click");
			}
			else {
				// Elsewhere
				$(".button[name=action]").first().trigger("click");
			}
		}
		// [G] Check if a GCR is updating (Same as the plain Activity page, but faster)
		else if (e.keyCode === 71){
			window.location.href = "https://www.nationstates.net/page=ajax2/a=reports/view=world/filter=change";
		}
		// [H] Ajax2 feed for region happenings
		else if (e.keyCode === 72){
			if (window.location.href.indexOf("region=") > -1) {
				let region_url = $('a[href^="/region"]').first().text().toLowerCase().split(' ').join('_');
				window.location.href = "https://www.nationstates.net/page=ajax2/a=reports/view=region." +region_url+"/filter=move+member+endo";
			}
		}
		// [J] & [L] Open WA, Apply/Join/Resign in the WA (2x)
		else if (e.keyCode === 74 || e.keyCode === 76){
			if (current_url === "https://www.nationstates.net/page=un"){
				if ($("#content").length > 0){
					// Modern themes
					$("#content").children("form").children("p").children("button").trigger("click");
				}
				else{
					// Using Antiquity
					$("#main").children("form").children("p").children("button").trigger("click");
				}
			}
			else {
				window.location.href = "https://www.nationstates.net/page=un";
			}
		}
		// [X] Open Dossier, Clear Dossier (2x)
		else if (e.keyCode === 88){
			if (current_url === "https://www.nationstates.net/page=dossier"){
				$(".button[name=clear_dossier]").first().trigger("click");
			}
			else {
				window.location.href = "https://www.nationstates.net/page=dossier";
			}
		}
		// [Z] Zombie Control
		else if (e.keyCode === 90){
			window.location.href = "https://www.nationstates.net/page=zombie_control";
		}
		// [C] Open nations to cross
		else if (e.keyCode === 67){
			// Send message to background script that C has been pressed
			chrome.runtime.sendMessage({cancross: "?"});
			// Receive message.
			chrome.runtime.onMessage.addListener(function docross(reply){
				// If the user hasn't pressed the cross-endorse button 60 seconds ago or less, open the first 10 endorsers in separate tabs. This satisfies the limit of 10 requests/minute for scripts on NS.
				if (reply.cancross === true){
					let cross = $(".unbox").children("p").children("a");
					for (let i = 0; i < 10 && i < cross.length; i++) {
						cross[i].target = "_blank";
						cross[i].click();
					}
				}
				// Remove the listener, or it will keep listening if reply.cancross is not true. That would result in it opening the tabs to cross times the amount you pressed [C] while reply.cancross was not true.
				chrome.runtime.onMessage.removeListener(docross);
			});
		}
		// [B] Ban nation
		else if (e.keyCode === 66){
			$("button[name=ban]").trigger("click");
		}
		// [N] My Nation
		else if (e.keyCode === 78){
			window.location.href = "https://www.nationstates.net";
		}
		// [M] Move, Chase Move (2x)
		else if (e.keyCode === 77){
			if (current_url === "https://www.nationstates.net/template-overall=none/page=reports"){
				$("li a:nth-of-type(3)")[0].click();
				$("li a:nth-of-type(3)").eq(0).css("background-color", "yellow");
			}
			else {

				$(".button[name=move_region], input[name=move_region]").first().trigger("click");
			}
		}
		// Disabled Hotkeys
		// [H] File a GHR, for salty bois
		// else if (e.keyCode == 72){
		//		window.location.href = "https://www.nationstates.net/page=help";
		// }
	});
})();

$( document ).ready(function() {
	// Displays load time on the reports page
	if (window.location.href.indexOf("page=reports") > -1 ) {
		var loadTime = window.performance.timing.domContentLoadedEventEnd- window.performance.timing.navigationStart;
		$( "h1:first" ).append(" - PAGE LOAD TIME: " +loadTime+ " ms").css( "color", "#006400" );
	}
	// Starts nation pages at the bottom when you load them, so you can endorse easier
	if (window.location.href.indexOf("nation=") > -1 && window.location.href.indexOf('template-overall=none') === -1 &&  window.location.href.indexOf('page=join_WA') === -1) {
		$('html, body').scrollTop( $(document).height() );
	}
	if (window.location.href.indexOf("page=ajax2") > -1 || window.location.href.indexOf("page=reports") > -1) {
		// Enables clicking on ajax2 reports links
		$('.nlink').each(function() {
			$(this).attr("href", function(index, old) {
				return old.replace("nation", "/template-overall=none/nation");
			});
		});
		$('.rlink').each(function() {
			$(this).attr("href", function(index, old) {
				return old.replace("region", "/template-overall=none/region");
			});
		});
	}
});

function getJumpPoint() {
	return localStorage.JumpPoints.split(",")[0];
}

function setJumpPoint(jp) {
	let jps = jp + "," + localStorage.JumpPoints;
	jps = jps.split(",").filter(function(item, pos, self) {
		return self.indexOf(item) === pos;
	});
	localStorage.JumpPoints = jps.join(",");
	return getJumpPoint();
}

function deleteJumpPoint(jp) {
	let jps = localStorage.JumpPoints.split(",");
	let jps_new;
	jps.forEach(function (item, index) {
		if (jp === item) {
			jps_new = jps.splice(index, 1);
		}
	});
	localStorage.JumpPoints = jps.join(",");
	return getJumpPoint();
}

