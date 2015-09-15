/* ***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this file are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Original Code is Web Search Pro code.

The Initial Developer of the Original Code is Martijn Kooij a.k.a. Captain Caveman.

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.

***** END LICENSE BLOCK ***** */
function InitWindow()
{
	this.oUtils = new MMSearchUtils();

	this.aFreeSearchEngines = null;
	this.aFreeSearchGroups = null;
	this.aKeyboardShortcuts = null;

	document.getElementById('se_shortcut').addEventListener('click', UpdateSelectedKey, true);
	
	this.sOpenMode = window.arguments[0];

	WSProInitFreeSearchEngines();
	WSProInitFreeSearchGroups();
	WSProInitFreeSearchTypes();
	
	if (this.sOpenMode == "suggest")
	{
		var sURI = "", sLabel = "", sFavIcon = "";
		if (window.arguments[1] && window.arguments[2] && window.arguments[3])
		{
			sLabel = window.arguments[1];
			sURI = window.arguments[2];
			if (window.arguments[3] && window.arguments[3] != "none") sFavIcon = window.arguments[3];
		}

		document.title = this.oUtils.TranslateString("wspro-suggest-title");

		document.getElementById('freesearchname').value = sLabel;
		document.getElementById('freesearchurl').value = sURI;
		document.getElementById('favicon').src = sFavIcon;
		
		document.getElementById('wspro-intro').setAttribute('label', this.oUtils.TranslateString("wspro-suggest-intro"));
		document.getElementById('wspro-instruction-1').setAttribute('value', this.oUtils.TranslateString("wspro-suggest-instruction-1"));
        var oDescription = document.createTextNode(this.oUtils.TranslateString("wspro-suggest-instruction-2"));
        document.getElementById('wspro-instruction-2').appendChild(oDescription);
		
		document.getElementById('wspro-id').setAttribute('hidden', true);
		document.getElementById('browse').setAttribute('hidden', true);
		if (sFavIcon == "")
		{
			document.getElementById('wspro-favicon').setAttribute('hidden', true);
		}
		else
		{
			document.getElementById('wspro-instruction-1').setAttribute('hidden', true);
			document.getElementById('wspro-instruction-2').setAttribute('hidden', true);
		}
		document.getElementById('wspro-shortcut').setAttribute('hidden', true);
	}
	if (this.sOpenMode == "edit")
	{
		this.iFSEIndex = window.arguments[1];

		document.title = this.oUtils.TranslateString("wspro-editse-title") + " (Search Engine ID: " + this.aFreeSearchEngines[this.iFSEIndex][0] + ")";

		document.getElementById('wspro-intro').setAttribute('label', this.oUtils.TranslateString("wspro-editse-intro"));
		document.getElementById('wspro-instruction-1').setAttribute('value', this.oUtils.TranslateString("wspro-editse-instruction-1"));
        var oDescription = document.createTextNode(this.oUtils.TranslateString("wspro-editse-instruction-2"));
        document.getElementById('wspro-instruction-2').appendChild(oDescription);

		document.getElementById('freesearchname').value = this.aFreeSearchEngines[this.iFSEIndex][1];
		document.getElementById('freesearchurl').value = this.aFreeSearchEngines[this.iFSEIndex][2];
		var oMenuItem = document.getElementById('freesearchtype_' + this.aFreeSearchEngines[this.iFSEIndex][3]);
		if (oMenuItem)
		{
			oMenuItem.setAttribute('selected', true);
			document.getElementById('freesearchtype').selectedItem = oMenuItem;
		}
		var sFavIconURI = ""
		if (this.aFreeSearchEngines[this.iFSEIndex][4].length == 3) sFavIconURI = this.oUtils.GetFaviconURI(this.aFreeSearchEngines[this.iFSEIndex][2], this.aFreeSearchEngines[this.iFSEIndex][4]);
		else sFavIconURI = this.aFreeSearchEngines[this.iFSEIndex][4];
		document.getElementById('favicon').src = sFavIconURI;

		document.getElementById('wspro-url').setAttribute('hidden', this.aFreeSearchEngines[this.iFSEIndex][0].indexOf('p') == -1);
		document.getElementById('wspro-id').setAttribute('hidden', true);
		
		WSProInitShortcuts();
	}

	if (this.sOpenMode == "editgroup")
	{
		this.iFSEIndex = window.arguments[1];

		document.title = this.oUtils.TranslateString("wspro-editsg-title");

		document.getElementById('wspro-intro').setAttribute('label', this.oUtils.TranslateString("wspro-editse-intro"));
		document.getElementById('wspro-instruction-1').setAttribute('value', this.oUtils.TranslateString("wspro-editse-instruction-1"));
        var oDescription = document.createTextNode(this.oUtils.TranslateString("wspro-editse-instruction-2"));
        document.getElementById('wspro-instruction-2').appendChild(oDescription);

		document.getElementById('freesearchname').value = this.aFreeSearchGroups[this.iFSEIndex][1];
		document.getElementById('freesearchurl').value = "wsprogroupsearch";
		document.getElementById('favicon').src = this.aFreeSearchGroups[this.iFSEIndex][2];

		document.getElementById('wspro-url').setAttribute('hidden', true);
		document.getElementById('wspro-id').setAttribute('hidden', true);
		document.getElementById('wspro-type').setAttribute('hidden', true);
		//document.getElementById('wspro-shortcut').setAttribute('hidden', true);
        if (this.aFreeSearchGroups[this.iFSEIndex][0].indexOf('g') == -1)
		{
            document.getElementById('freesearchname').setAttribute("disabled", "true");
            document.getElementById('browse').setAttribute("disabled", "true");
        }
        
        WSProInitShortcuts();
	}

	if (this.sOpenMode == "addgroup")
	{
		this.iFSEIndex = window.arguments[1];

		document.title = this.oUtils.TranslateString("wspro-addsg-title");

		document.getElementById('wspro-intro').setAttribute('label', this.oUtils.TranslateString("wspro-addsg-intro"));
		document.getElementById('wspro-instruction-1').setAttribute('value', this.oUtils.TranslateString("wspro-addsg-instruction-1"));
        var oDescription = document.createTextNode(this.oUtils.TranslateString("wspro-addsg-instruction-2"));
        document.getElementById('wspro-instruction-2').appendChild(oDescription);

		document.getElementById('freesearchname').value = "";
		document.getElementById('freesearchurl').value = "wsprogroupsearch";
		document.getElementById('favicon').src = "";

		document.getElementById('wspro-url').setAttribute('hidden', true);
		document.getElementById('wspro-id').setAttribute('hidden', true);
		document.getElementById('wspro-type').setAttribute('hidden', true);
		document.getElementById('wspro-shortcut').setAttribute('hidden', true);
	}

	if (this.sOpenMode == "private")
	{
		this.iFSEIndex = window.arguments[1];

		document.title = this.oUtils.TranslateString("wspro-privatese-title");

		document.getElementById('wspro-intro').setAttribute('label', this.oUtils.TranslateString("wspro-privatese-intro"));
		document.getElementById('wspro-instruction-1').setAttribute('value', this.oUtils.TranslateString("wspro-privatese-instruction-1"));
        var oDescription = document.createTextNode(this.oUtils.TranslateString("wspro-privatese-instruction-2"));
        document.getElementById('wspro-instruction-2').appendChild(oDescription);

		document.getElementById('freesearchname').value = '';
		document.getElementById('freesearchurl').value = '';
		var oMenuItem = document.getElementById('freesearchtype_' + this.aFreeSearchEngines[this.iFSEIndex][3]);
		if (oMenuItem)
		{
			oMenuItem.setAttribute('selected', true);
			document.getElementById('freesearchtype').selectedItem = oMenuItem;
		}
		document.getElementById('favicon').src = '';
		
		document.getElementById('wspro-id').setAttribute('hidden', true);
		
		WSProInitShortcuts();
	}
	
	setTimeout(function() {window.sizeToContent();}, 100);
	setTimeout(function() {CheckPre16FreeSearchEngine();}, 1);
}

function CheckPre16FreeSearchEngine()
{
	if (this.oUtils.HasUserValue("mmsearch-freesearchname") == false) return false;
	var sName, sURL, sType;
	sName = this.oUtils.GetString("mmsearch-freesearchname")
	sURL = this.oUtils.GetString("mmsearch-freesearchurl")
	sType = this.oUtils.GetString("mmsearch-freesearchtype")
	if (sName != "" && sURL != "")
	{
		//Send pre version 1.6 freesearch engines as a request to the server, and clear them.
		alert(this.oUtils.TranslateString("mmsearch-alert-pre16freesearchengines"));
		
		document.getElementById('freesearchname').value = sName;
		document.getElementById('freesearchurl').value = sURL;

		var oMItem = document.getElementById(sType);
		if (oMItem) document.getElementById('freesearchtype').selectedItem = oMItem;
		
		this.oUtils.SetString("mmsearch-freesearchname", "");
		this.oUtils.SetString("mmsearch-freesearchurl", "");
		this.oUtils.SetString("mmsearch-freesearchtype", "");
		this.oUtils.SetBool("mmsearch-searchfreesearch", false);
	}
	return true;
}

function ApplyAndClose()
{
	//Gather entered information.
	var sFSELabel, sFSEURL, sFSEType = "", sFSEFavIcon;
	
	sFSELabel = document.getElementById('freesearchname').value;
	sFSEURL = document.getElementById('freesearchurl').value;
	
	if (sFSELabel == "" || sFSEURL == "")
	{
		alert(this.oUtils.TranslateString("mmsearch-alert-fillallvalues"));
		return false;
	}
	
	if (document.getElementById('freesearchtype').selectedItem) sFSEType = document.getElementById('freesearchtype').selectedItem.id.substr(15);
	if (this.sOpenMode != "private") sFSEURL = sFSEURL.replace('&', '%26');

	sFSEFavIcon = document.getElementById('favicon').src;
    if (this.sOpenMode != "suggest")
    {
	    if (sFSEFavIcon.indexOf("data:image") < 0 && sFSEFavIcon.indexOf("chrome://") < 0)
	    {
		    sFSEFavIcon = this.oUtils.RemoteImage2B64(sFSEFavIcon);
	    }
	}
	DisableControls(true);

	if (this.sOpenMode == "edit" || this.sOpenMode == "private" || this.sOpenMode == "editgroup")
	{
		//Update the shortcut key.
		var oLB = document.getElementById('se_shortcut');
		var oItem = oLB.selectedItem;
		var iSKIndex = WSProGetShortcutIndex(this.aFreeSearchEngines[this.iFSEIndex][0]);
        if (this.sOpenMode == "editgroup") iSKIndex = WSProGetShortcutIndex(this.aFreeSearchGroups[this.iFSEIndex][0]);
        
		var sKey = "";

		if (oItem && oItem.getAttribute('selected') == 'true')
		{
			if (iSKIndex == -1)
			{
				iSKIndex = this.aKeyboardShortcuts.length;
				this.aKeyboardShortcuts[iSKIndex] = new Array();
			}
			sKey = oItem.value;
			if (sKey.indexOf('SHIFT') >= 0)
			{
				this.aKeyboardShortcuts[iSKIndex][0] = sKey.substr(15, 1);
				this.aKeyboardShortcuts[iSKIndex][2] = "S";
			}
			else
			{
				this.aKeyboardShortcuts[iSKIndex][0] = sKey.substr(13, 1);
				this.aKeyboardShortcuts[iSKIndex][2] = "A";
			}
			this.aKeyboardShortcuts[iSKIndex][1] = this.aFreeSearchEngines[this.iFSEIndex][0];
            if (this.sOpenMode == "editgroup") this.aKeyboardShortcuts[iSKIndex][1] = this.aFreeSearchGroups[this.iFSEIndex][0];
		}
		else
		{
			if (iSKIndex >= 0) this.aKeyboardShortcuts.splice(iSKIndex, 1);		
		}
	}

	//Do something with it.
	if (this.sOpenMode == "suggest")
	{
		var oRequest = new XMLHttpRequest();
		var sURL = this.oUtils.GetString("mmsearch-freesearchenginesurl") + "?label=" + sFSELabel + "&url=" + sFSEURL + "&type=" + sFSEType + "&favicon=" + sFSEFavIcon;
		oRequest.open('GET', sURL, true);
		oRequest.oUtils = this.oUtils;
		oRequest.onreadystatechange = function ()
		{
			if (oRequest.readyState == 4)
			{
				try
				{
					if (oRequest.status == 200)
					{
						alert(oRequest.oUtils.TranslateString("mmsearch-alert-suggest-success"));
						setTimeout(function() {CloseSuggestWindow();}, 100);
					}
					else
					{
						alert(oRequest.oUtils.TranslateString("mmsearch-alert-suggest-failed"));
						DisableControls(false);
					}
				}
				catch (e)
				{
					alert(oRequest.oUtils.TranslateString("mmsearch-alert-suggest-failed"));
					DisableControls(false);
				}
			}
		};
		oRequest.send(null);
	}
	if (this.sOpenMode == "edit")
	{
		this.aFreeSearchEngines[this.iFSEIndex][1] = sFSELabel;
		this.aFreeSearchEngines[this.iFSEIndex][3] = sFSEType;
		this.aFreeSearchEngines[this.iFSEIndex][4] = sFSEFavIcon;
		if (this.aFreeSearchEngines[this.iFSEIndex][0].indexOf('p') >= 0)
		{
			this.aFreeSearchEngines[this.iFSEIndex][2] = decodeURIComponent(sFSEURL);
		}
		this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
		this.oUtils.SetLocalizedString("mmsearch-shortcutkeys", WSProFlattenShortcuts());
		setTimeout(function() {CloseSuggestWindow();}, 100);
	}
	if (this.sOpenMode == "editgroup")
	{
		this.aFreeSearchGroups[this.iFSEIndex][1] = sFSELabel;
		this.aFreeSearchGroups[this.iFSEIndex][2] = sFSEFavIcon;
		this.oUtils.SetLocalizedString("mmsearch-freesearchgroups", this.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
		this.oUtils.SetLocalizedString("mmsearch-shortcutkeys", WSProFlattenShortcuts());
		setTimeout(function() {CloseSuggestWindow();}, 100);
	}
	if (this.sOpenMode == "addgroup")
	{
		this.aFreeSearchGroups[this.iFSEIndex][1] = sFSELabel;
		this.aFreeSearchGroups[this.iFSEIndex][2] = sFSEFavIcon;
		this.oUtils.SetLocalizedString("mmsearch-freesearchgroups", this.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
		setTimeout(function() {CloseSuggestWindow();}, 100);
	}
	if (this.sOpenMode == "private")
	{
		this.aFreeSearchEngines[this.iFSEIndex][1] = sFSELabel;
		this.aFreeSearchEngines[this.iFSEIndex][2] = sFSEURL;
		this.aFreeSearchEngines[this.iFSEIndex][3] = sFSEType;
		this.aFreeSearchEngines[this.iFSEIndex][4] = sFSEFavIcon;
		this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
		this.oUtils.SetLocalizedString("mmsearch-shortcutkeys", WSProFlattenShortcuts());
		setTimeout(function() {CloseSuggestWindow();}, 100);
	}
	var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	oObService.notifyObservers(opener, "apply-se", "OK");
	oObService.notifyObservers(opener, "apply-settings", "OK");

	return false;
}

function CancelAndClose()
{
	if (this.sOpenMode == "addgroup")
	{
		this.aFreeSearchGroups.splice(this.iFSEIndex, 1);
		this.oUtils.SetLocalizedString("mmsearch-freesearchgroups", this.oUtils.WSProFlattenFreeSearchGroups(this.aFreeSearchGroups));
	}
	if (this.sOpenMode == "private")
	{
		this.aFreeSearchEngines.splice(this.iFSEIndex, 1);
		this.oUtils.SetLocalizedString("mmsearch-freesearchengines", this.oUtils.WSProFlattenFreeSearchEngines(this.aFreeSearchEngines));
	}

	var oObService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
	oObService.notifyObservers(opener, "apply-se", "CANCEL");
	
	return true;
}

function WSProBrowseFavIcon()
{
	const nsIFilePicker = Components.interfaces.nsIFilePicker;
	const nsIFileProtocolHandler = Components.interfaces.nsIFileProtocolHandler;
	var oFavIcon = document.getElementById('favicon');
	var oFavIconPicker = Components.classes['@mozilla.org/filepicker;1'].createInstance(nsIFilePicker);
	oFavIconPicker.init(window, '', nsIFilePicker.modeOpen);
	oFavIconPicker.appendFilter('*.gif *.ico *.png','*.gif;*.ico;*.png');
	oFavIconPicker.appendFilters(nsIFilePicker.filterAll);
	oFavIconPicker.filterIndex = 0;

	if(oFavIconPicker.show() == nsIFilePicker.returnOK)
	{
		var oFile = oFavIconPicker.file;
		if(!oFile.exists() || !oFile.isReadable() || oFile.isDirectory()) return;
		oFavIcon.src = Components.classes['@mozilla.org/network/protocol;1?name=file'].createInstance(nsIFileProtocolHandler).getURLSpecFromFile(oFile);
	}
}

function WSProInitFreeSearchGroups()
{
	//Initialize the free search engine groups array
	this.aFreeSearchGroups = null;
	this.aFreeSearchGroups = new Array();

	var aTemp = new Array();
	aTemp = this.oUtils.GetLocalizedString("mmsearch-freesearchgroups").split('f_g');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aFreeSearchGroups[iIndex] = new Array();
			this.aFreeSearchGroups[iIndex] = aTemp[iIndex].split('f_v');
		}
	}
}

function WSProInitFreeSearchEngines()
{
	//Initialize the free search engines array
	this.aFreeSearchEngines = null;
	this.aFreeSearchEngines = new Array();

	var aTemp = new Array();
	aTemp = this.oUtils.GetLocalizedString("mmsearch-freesearchengines").split('f_e');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aFreeSearchEngines[iIndex] = new Array();
			this.aFreeSearchEngines[iIndex] = aTemp[iIndex].split('f_v');
		}
	}
}

function WSProInitFreeSearchTypes()
{
	var oMenu = document.getElementById('freesearchtype').firstChild;
	var oMenuItem;
	var iIndex, iLen = this.aFreeSearchGroups.length;
	if (this.sOpenMode == "private" || this.sOpenMode == "edit")
	{
		for (iIndex = 0; iIndex < iLen; iIndex ++)
		{
			if (!document.getElementById('freesearchtype_' + this.aFreeSearchGroups[iIndex][0]))
			{
				oMenuItem = document.getElementById('freesearchtype_clone').cloneNode(true);
				oMenuItem.setAttribute('id', 'freesearchtype_' + this.aFreeSearchGroups[iIndex][0]);
				oMenuItem.setAttribute('label', this.aFreeSearchGroups[iIndex][1]);
				oMenuItem.setAttribute('hidden', false);
				oMenu.appendChild(oMenuItem);
			}
		}
	}
}

function WSProInitShortcuts()
{
	//Init Keyboard shotrcuts array.
	this.aKeyboardShortcuts = null;
	this.aKeyboardShortcuts = new Array();

	var aTemp = new Array();
	aTemp = this.oUtils.GetLocalizedString("mmsearch-shortcutkeys").split('s_k');
	var iIndex, iLen = aTemp.length;

	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (aTemp[iIndex] != "")
		{
			this.aKeyboardShortcuts[iIndex] = new Array();
			this.aKeyboardShortcuts[iIndex] = aTemp[iIndex].split('s_v');
			if (this.aKeyboardShortcuts[iIndex].length == 2)
			{
				//Pre 2.2, add S or A for SHIFT or ALT.
				this.aKeyboardShortcuts[iIndex][2] = "S";
			}
		}
	}
	DisableUsedShortcuts();
	SelectFSEKeyItem();
}

function SelectFSEKeyItem()
{
	var oLB = document.getElementById('se_shortcut');
	var sShortCut = "", sMod = "SHIFT", sValue;
	var iIndex, iLen = oLB.childNodes.length;
	var iSKIndex = WSProGetShortcutIndex(this.aFreeSearchEngines[this.iFSEIndex][0]);
    if (this.sOpenMode == "editgroup") iSKIndex = WSProGetShortcutIndex(this.aFreeSearchGroups[this.iFSEIndex][0]);

	if (iSKIndex >= 0)
	{
		if (this.aKeyboardShortcuts[iSKIndex][2] == "A") sMod = "ALT";
		sShortCut = "CTRL + " + sMod + " + " + this.aKeyboardShortcuts[iSKIndex][0];
		for (iIndex = 0; iIndex < iLen; iIndex ++)
		{
			sValue = oLB.childNodes[iIndex].getAttribute('value');
			if (sValue == sShortCut)
			{
				oLB.scrollToIndex(oLB.getIndexOfItem(oLB.childNodes[iIndex]));
				oLB.selectItem(oLB.childNodes[iIndex]);
				oLB.childNodes[iIndex].setAttribute('selectedandfocus', true);
				oLB.focus();
				break;
			}
		}
	}
}

function DisableUsedShortcuts()
{
	var oLB = document.getElementById('se_shortcut');
	var oKey;
	var sFSEID = this.aFreeSearchEngines[this.iFSEIndex][0];
	var sMod, sShortcut;
	var iIndex, iLen = this.aKeyboardShortcuts.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		if (this.aKeyboardShortcuts[iIndex][1] != sFSEID)
		{
			sMod = "SHIFT";
			if (this.aKeyboardShortcuts[iIndex][2] == "A") sMod = "ALT";
			sShortCut = "CTRL + " + sMod + " + " + this.aKeyboardShortcuts[iIndex][0];
			oKey = oLB.getElementsByAttribute('value', sShortCut)[0];
			if (oKey) oKey.setAttribute('disabled', true);
		}
	}
}

function UpdateSelectedKey()
{
	var oLB = document.getElementById('se_shortcut');
	var oItem = oLB.selectedItem;
	var oPrevItem = document.getElementsByAttribute('selectedandfocus', 'true')[0];
	
	if (oItem)
	{
		if (oItem.getAttribute('disabled') != 'true')
		{
			if (oPrevItem && oItem.getAttribute('value') == oPrevItem.getAttribute('value'))
			{
				oItem.setAttribute('selected', oItem.getAttribute('selected') == 'false');
			}
			else
			{
				if (oPrevItem) oPrevItem.setAttribute('selectedandfocus', false);
				oItem.setAttribute('selectedandfocus', true);
			}
		}
		else
		{
			oItem.setAttribute('selected', false);
			setTimeout(function() {SelectFSEKeyItem();}, 100);
		}
	}
}

function WSProFlattenShortcuts()
{
	var aTemp = new Array();
	var sResult = "";
	var iIndex, iLen = this.aKeyboardShortcuts.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++)
	{
		aTemp[iIndex] = this.aKeyboardShortcuts[iIndex].join('s_v');
	}
	sResult = aTemp.join('s_k');

	return sResult;
}

function WSProGetFreeSearchEngineIndex(sFSEID)
{
	var iIndex, iLen = this.aFreeSearchEngines.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aFreeSearchEngines[iIndex][0] == sFSEID) return iIndex;}
	return -1;
}

function WSProGetShortcutIndex(sFSEID)
{
	var iIndex, iLen = this.aKeyboardShortcuts.length;
	for (iIndex = 0; iIndex < iLen; iIndex ++) {if (this.aKeyboardShortcuts[iIndex][1] == sFSEID) return iIndex;}
	return -1;
}

function CloseSuggestWindow()
{
	this.oUtils = null;
	this.aFreeSearchEngines = null;
	this.aFreeSearchGroups = null;
	this.aKeyboardShortcuts = null;

	window.close();
}

function DisableControls(bDisable)
{
	document.getElementById('freesearchname').disabled = bDisable;
	document.getElementById('freesearchurl').disabled = bDisable;
	document.getElementById('freesearchtype').disabled = bDisable;
}
